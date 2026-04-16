<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Workflow extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'steps', 'is_active'];
    protected $casts = ['steps' => 'array', 'is_active' => 'boolean'];
    public function tasks() { return $this->hasMany(Task::class); }
}
