<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TaskComment extends Model
{
    protected $fillable = ['task_id', 'user_id', 'comment', 'is_client_visible'];
    protected $casts = ['is_client_visible' => 'boolean'];
    public function task() { return $this->belongsTo(Task::class); }
    public function user() { return $this->belongsTo(User::class); }
}
