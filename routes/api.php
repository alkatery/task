<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\WorkflowController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TranscriptionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// =============================================
// المصادقة (بدون حماية)
// =============================================
Route::post('/auth/login', [AuthController::class, 'login']);

// =============================================
// الـ Routes المحمية بـ Sanctum
// =============================================
Route::middleware('auth:sanctum')->group(function () {

    // المصادقة
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // إحصائيات لوحة التحكم
    Route::get('/tasks/stats/dashboard', [TaskController::class, 'dashboard']);

    // المستخدمون (مدير فقط للإنشاء والتعديل)
    Route::get('/users', [UserController::class, 'index']);
    Route::middleware('admin')->group(function () {
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
    });

    // العملاء
    Route::get('/clients', [ClientController::class, 'index']);
    Route::get('/clients/{client}', [ClientController::class, 'show']);
    Route::middleware('admin')->group(function () {
        Route::post('/clients', [ClientController::class, 'store']);
        Route::put('/clients/{client}', [ClientController::class, 'update']);
    });

    // المسارات
    Route::get('/workflows', [WorkflowController::class, 'index']);
    Route::get('/workflows/{workflow}', [WorkflowController::class, 'show']);

    // المهام
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::middleware('team')->group(function () {
        Route::post('/tasks', [TaskController::class, 'store']);
        Route::put('/tasks/{task}', [TaskController::class, 'update']);
    });
    Route::put('/tasks/{task}/status', [TaskController::class, 'updateStatus']);
    Route::post('/tasks/{task}/comments', [TaskController::class, 'addComment']);
    Route::post('/tasks/{task}/approve', [TaskController::class, 'approve']);

    // التفريغ (فريق ومدير)
    Route::middleware('team')->group(function () {
        Route::get('/transcriptions', [TranscriptionController::class, 'index']);
        Route::get('/transcriptions/{transcription}', [TranscriptionController::class, 'show']);
        Route::post('/transcriptions', [TranscriptionController::class, 'store']);
        Route::post('/transcriptions/{transcription}/transcribe', [TranscriptionController::class, 'transcribe']);
        Route::put('/transcriptions/{transcription}', [TranscriptionController::class, 'update']);
    });

    // التقارير (مدير فقط)
    Route::middleware('admin')->prefix('reports')->group(function () {
        Route::get('/team-performance', [ReportController::class, 'teamPerformance']);
        Route::get('/client-status', [ReportController::class, 'clientStatus']);
        Route::get('/overdue', [ReportController::class, 'overdue']);
        Route::get('/workflow-bottlenecks', [ReportController::class, 'workflowBottlenecks']);
    });

    // التنبيهات
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // رفع ملفات
    Route::post('/upload', function (Request $request) {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'لم يتم رفع ملف'], 400);
        }
        $file = $request->file('file');
        $path = $file->store('attachments', 'public');
        return response()->json([
            'url' => "/storage/{$path}",
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
        ]);
    });

    // Health check
    Route::get('/health', fn() => response()->json(['status' => 'ok', 'time' => now()->toISOString()]));
});
