<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Transcription extends Model
{
    protected $fillable = ['task_id', 'title', 'audio_url', 'raw_text', 'formatted_text', 'status', 'created_by'];
    public function task() { return $this->belongsTo(Task::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
