<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Models\Client;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function teamPerformance(Request $request)
    {
        return User::where('role', 'team')->where('is_active', true)
            ->withCount([
                'assignedTasks as completed' => fn($q) => $q->where('status', 'completed'),
                'assignedTasks as active' => fn($q) => $q->whereIn('status', ['pending', 'in_progress']),
                'assignedTasks as overdue' => fn($q) => $q->overdue(),
            ])
            ->get()
            ->map(function ($u) {
                $avgDays = Task::where('assigned_to', $u->id)
                    ->whereNotNull('completed_at')
                    ->selectRaw('AVG(DATEDIFF(completed_at, created_at)) as avg')
                    ->value('avg');
                $u->avg_days = $avgDays ? round($avgDays) : null;
                return $u->only('id', 'name', 'completed', 'active', 'overdue', 'avg_days');
            });
    }

    public function clientStatus()
    {
        return Client::where('is_active', true)
            ->withCount([
                'projects',
                'tasks as active_tasks' => fn($q) => $q->whereNotIn('status', ['completed', 'cancelled']),
                'tasks as awaiting_approval' => fn($q) => $q->where('status', 'waiting_approval'),
                'tasks as completed_tasks' => fn($q) => $q->where('status', 'completed'),
            ])
            ->orderByDesc('active_tasks')->get();
    }

    public function overdue()
    {
        return Task::overdue()
            ->with(['assignee:id,name', 'client:id,name'])
            ->selectRaw('tasks.*, DATEDIFF(CURDATE(), due_date) as days_overdue')
            ->orderByDesc('days_overdue')
            ->get();
    }

    public function workflowBottlenecks()
    {
        return Task::whereNotNull('workflow_id')
            ->whereNotNull('parent_task_id')
            ->whereIn('status', ['pending', 'in_progress', 'waiting_approval'])
            ->join('workflows', 'tasks.workflow_id', '=', 'workflows.id')
            ->select(
                'workflows.name as workflow_name',
                'tasks.current_step',
                'tasks.title as step_name'
            )
            ->selectRaw('COUNT(*) as stuck_count')
            ->selectRaw('AVG(DATEDIFF(CURDATE(), tasks.updated_at)) as avg_days_stuck')
            ->groupBy('workflows.name', 'tasks.current_step', 'tasks.title')
            ->havingRaw('avg_days_stuck > 2')
            ->orderByDesc('avg_days_stuck')
            ->get();
    }
}
