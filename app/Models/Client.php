<?php
// =============================================
// app/Models/Client.php
// =============================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = ['name', 'type', 'contact_name', 'contact_phone', 'contact_email', 'notes', 'user_id', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function user() { return $this->belongsTo(User::class); }
    public function projects() { return $this->hasMany(Project::class); }
    public function tasks() { return $this->hasMany(Task::class); }
}
