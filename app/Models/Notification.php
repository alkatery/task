<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $fillable = ['user_id', 'title', 'message', 'type', 'related_task_id', 'is_read'];
    protected $casts = ['is_read' => 'boolean'];
    public function user() { return $this->belongsTo(User::class); }
    public function task() { return $this->belongsTo(Task::class, 'related_task_id'); }
}
