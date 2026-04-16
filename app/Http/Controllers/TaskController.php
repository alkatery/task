<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TaskLog;
use App\Models\User;
use App\Models\Workflow;
use App\Models\Client;
use App\Models\Notification as AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TaskController extends Controller
{
    // =============================================
    // قائمة المهام مع فلترة
    // =============================================
    public function index(Request $request)
    {
        $query = Task::with(['assignee:id,name', 'client:id,name', 'workflow:id,name', 'creator:id,name']);

        // العميل يرى مهامه فقط
        if ($request->user()->role === 'client') {
            $client = Client::where('user_id', $request->user()->id)->first();
            if (!$client) return response()->json([]);
            $query->where('client_id', $client->id);
        }

        if ($request->status) $query->where('status', $request->status);
        if ($request->assigned_to === 'me') {
            $query->where('assigned_to', $request->user()->id);
        } elseif ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }
        if ($request->client_id) $query->where('client_id', $request->client_id);
        if ($request->project_id) $query->where('project_id', $request->project_id);
        if ($request->workflow_id) $query->where('workflow_id', $request->workflow_id);
        if ($request->overdue == '1') $query->overdue();

        return $query->orderByRaw("priority = 'urgent' DESC")
            ->orderBy('due_date')
            ->orderByDesc('created_at')
            ->limit(200)->get();
    }

    // =============================================
    // مهمة واحدة مع التفاصيل
    // =============================================
    public function show(Task $task)
    {
        $task->load([
            'assignee:id,name',
            'client:id,name',
            'workflow:id,name,steps',
            'comments.user:id,name,role',
            'attachments',
            'logs.user:id,name',
            'subtasks.assignee:id,name',
        ]);

        return $task;
    }

    // =============================================
    // إنشاء مهمة (يدوية أو من مسار)
    // =============================================
    public function store(Request $request)
    {
        $request->validate(['title' => 'required|max:255']);

        $task = Task::create([
            'title' => $request->title,
            'description' => $request->description,
            'assigned_to' => $request->assigned_to,
            'client_id' => $request->client_id,
            'project_id' => $request->project_id,
            'workflow_id' => $request->workflow_id,
            'workflow_instance_id' => $request->workflow_id ? Str::random(8) : null,
            'priority' => $request->priority ?? 'medium',
            'due_date' => $request->due_date,
            'parent_task_id' => $request->parent_task_id,
            'created_by' => $request->user()->id,
            'status' => 'pending',
        ]);

        $this->logActivity($task->id, $request->user()->id, 'created', ['title' => $task->title]);

        // إنشاء المهام الفرعية من المسار
        if ($request->workflow_id) {
            $this->spawnWorkflowTasks($task);
        }

        // تنبيه المسؤول
        if ($request->assigned_to) {
            $this->notify($request->assigned_to, 'task_assigned', "مهمة جديدة: {$task->title}", $task->id);
        }

        return response()->json(['id' => $task->id], 201);
    }

    // =============================================
    // تحديث حالة المهمة
    // =============================================
    public function updateStatus(Request $request, Task $task)
    {
        $request->validate(['status' => 'required']);

        $oldStatus = $task->status;
        $updates = ['status' => $request->status];

        if ($request->status === 'in_progress' && !$task->started_at) {
            $updates['started_at'] = now();
        }
        if ($request->status === 'completed') {
            $updates['completed_at'] = now();
        }

        $task->update($updates);

        $this->logActivity($task->id, $request->user()->id, 'status_changed', [
            'from' => $oldStatus, 'to' => $request->status
        ]);

        // تقدم المسار تلقائياً
        if ($request->status === 'completed' && $task->parent_task_id && $task->workflow_id) {
            $this->advanceWorkflow($task->parent_task_id, $task->current_step);
        }

        return response()->json(['message' => 'تم التحديث']);
    }

    // =============================================
    // تعديل مهمة
    // =============================================
    public function update(Request $request, Task $task)
    {
        $task->update($request->only('title', 'description', 'assigned_to', 'priority', 'due_date', 'status'));

        $this->logActivity($task->id, $request->user()->id, 'updated', $request->only('title', 'assigned_to', 'priority'));

        return response()->json(['message' => 'تم التحديث']);
    }

    // =============================================
    // إضافة تعليق
    // =============================================
    public function addComment(Request $request, Task $task)
    {
        $request->validate(['comment' => 'required']);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'comment' => $request->comment,
            'is_client_visible' => $request->is_client_visible ?? false,
        ]);

        $this->logActivity($task->id, $request->user()->id, 'commented', [
            'comment' => Str::limit($request->comment, 100)
        ]);

        return response()->json(['id' => $comment->id], 201);
    }

    // =============================================
    // اعتماد العميل
    // =============================================
    public function approve(Request $request, Task $task)
    {
        $request->validate(['action' => 'required|in:approved,revision']);

        $newStatus = $request->action === 'approved' ? 'approved' : 'revision';
        $task->update(['status' => $newStatus]);

        if ($request->notes) {
            TaskComment::create([
                'task_id' => $task->id,
                'user_id' => $request->user()->id,
                'comment' => $request->notes,
                'is_client_visible' => true,
            ]);
        }

        $action = $request->action === 'approved' ? 'client_approved' : 'client_revision';
        $this->logActivity($task->id, $request->user()->id, $action, ['notes' => $request->notes]);

        // تقدم المسار عند الاعتماد
        if ($request->action === 'approved' && $task->parent_task_id) {
            $this->advanceWorkflow($task->parent_task_id, $task->current_step);
        }

        return response()->json([
            'message' => $request->action === 'approved' ? 'تم الاعتماد' : 'تم إرجاع المهمة للمراجعة'
        ]);
    }

    // =============================================
    // إحصائيات لوحة التحكم
    // =============================================
    public function dashboard(Request $request)
    {
        $userId = $request->user()->id;
        $isTeam = $request->user()->role === 'team';

        $baseQuery = fn() => Task::query()->when($isTeam, fn($q) => $q->where('assigned_to', $userId));

        $stats = [
            'pending' => $baseQuery()->active()->count(),
            'waiting_approval' => $baseQuery()->where('status', 'waiting_approval')->count(),
            'overdue' => $baseQuery()->overdue()->count(),
            'completed_today' => $baseQuery()->where('status', 'completed')->whereDate('completed_at', today())->count(),
            'completed_week' => $baseQuery()->where('status', 'completed')->where('completed_at', '>=', now()->subDays(7))->count(),
        ];

        $recentTasks = $baseQuery()
            ->with(['assignee:id,name', 'client:id,name'])
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderByRaw("priority = 'urgent' DESC")
            ->orderBy('due_date')
            ->limit(10)->get();

        $recentLogs = TaskLog::with(['user:id,name', 'task:id,title'])
            ->latest()->limit(15)->get();

        return response()->json(compact('stats', 'recentTasks', 'recentLogs'));
    }

    // =============================================
    // Helper: تسجيل النشاط
    // =============================================
    private function logActivity(int $taskId, int $userId, string $action, ?array $details = null)
    {
        TaskLog::create([
            'task_id' => $taskId,
            'user_id' => $userId,
            'action' => $action,
            'details' => $details,
        ]);
    }

    // =============================================
    // Helper: إنشاء تنبيه
    // =============================================
    private function notify(int $userId, string $type, string $message, int $taskId)
    {
        AppNotification::create([
            'user_id' => $userId,
            'title' => $message,
            'message' => $message,
            'type' => $type,
            'related_task_id' => $taskId,
        ]);
    }

    // =============================================
    // Helper: إنشاء المهام الفرعية من المسار
    // =============================================
    private function spawnWorkflowTasks(Task $parentTask)
    {
        $workflow = Workflow::find($parentTask->workflow_id);
        if (!$workflow) return;

        $instanceId = Str::random(8);

        foreach ($workflow->steps as $step) {
            if (($step['type'] ?? '') === 'fork') continue;

            $assigneeId = null;
            if (!empty($step['default_assignee'])) {
                $assignee = User::where('email', $step['default_assignee'])->first();
                $assigneeId = $assignee?->id;
            }

            Task::create([
                'title' => $step['name'],
                'parent_task_id' => $parentTask->id,
                'workflow_id' => $parentTask->workflow_id,
                'workflow_instance_id' => $instanceId,
                'current_step' => $step['order'],
                'assigned_to' => $assigneeId,
                'client_id' => $parentTask->client_id,
                'project_id' => $parentTask->project_id,
                'created_by' => $parentTask->created_by,
                'status' => $step['order'] === 0 ? 'in_progress' : 'pending',
            ]);
        }
    }

    // =============================================
    // Helper: تقدم المسار للخطوة التالية
    // =============================================
    private function advanceWorkflow(int $parentTaskId, int $completedStep)
    {
        $nextStep = $completedStep + 1;

        // تفعيل الخطوة التالية
        $updated = Task::where('parent_task_id', $parentTaskId)
            ->where('current_step', $nextStep)
            ->where('status', 'pending')
            ->update(['status' => 'in_progress']);

        // إذا لا توجد خطوة تالية، تحقق من اكتمال المسار
        if ($updated === 0) {
            $remaining = Task::where('parent_task_id', $parentTaskId)
                ->whereNotIn('status', ['completed', 'cancelled'])->count();

            if ($remaining === 0) {
                Task::where('id', $parentTaskId)->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);
            }
        }

        // تنبيه المسؤول الجديد
        $nextTasks = Task::where('parent_task_id', $parentTaskId)
            ->where('current_step', $nextStep)->get();

        foreach ($nextTasks as $t) {
            if ($t->assigned_to) {
                $this->notify($t->assigned_to, 'task_assigned', "دورك الآن: {$t->title}", $t->id);
            }
        }
    }
}
