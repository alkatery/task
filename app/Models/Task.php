<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'project_id', 'client_id', 'workflow_id', 'workflow_instance_id',
        'current_step', 'title', 'description', 'assigned_to', 'created_by',
        'status', 'priority', 'due_date', 'started_at', 'completed_at', 'parent_task_id'
    ];

    protected $casts = [
        'due_date' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function project()    { return $this->belongsTo(Project::class); }
    public function client()     { return $this->belongsTo(Client::class); }
    public function workflow()   { return $this->belongsTo(Workflow::class); }
    public function assignee()   { return $this->belongsTo(User::class, 'assigned_to'); }
    public function creator()    { return $this->belongsTo(User::class, 'created_by'); }
    public function parent()     { return $this->belongsTo(Task::class, 'parent_task_id'); }
    public function subtasks()   { return $this->hasMany(Task::class, 'parent_task_id'); }
    public function comments()   { return $this->hasMany(TaskComment::class)->orderBy('created_at'); }
    public function attachments(){ return $this->hasMany(TaskAttachment::class); }
    public function logs()       { return $this->hasMany(TaskLog::class)->orderByDesc('created_at'); }

    public function scopeOverdue($query)
    {
        return $query->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->whereNotIn('status', ['completed', 'cancelled']);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'in_progress']);
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->lt(now()) && !in_array($this->status, ['completed', 'cancelled']);
    }
}
