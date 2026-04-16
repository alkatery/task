<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // =============================================
        // المشاريع
        // =============================================
        Schema::create('projects', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('client_id');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'paused', 'completed', 'archived'])->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });

        // =============================================
        // مسارات العمل
        // =============================================
        Schema::create('workflows', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 150);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->longText('steps');
            $table->tinyInteger('is_active')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        // =============================================
        // المهام
        // =============================================
        Schema::create('tasks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('client_id')->nullable();
            $table->unsignedBigInteger('workflow_id')->nullable();
            $table->string('workflow_instance_id', 50)->nullable();
            $table->integer('current_step')->default(0);
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->enum('status', [
                'pending', 'in_progress', 'waiting_approval',
                'approved', 'revision', 'completed', 'cancelled'
            ])->default('pending');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->date('due_date')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('parent_task_id')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('set null');
            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('set null');
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('parent_task_id')->references('id')->on('tasks')->onDelete('set null');

            $table->index('status');
            $table->index('assigned_to');
            $table->index('due_date');
            $table->index(['workflow_id', 'workflow_instance_id'], 'tasks_wf_instance_index');
        });

        // =============================================
        // تعليقات المهام
        // =============================================
        Schema::create('task_comments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('user_id');
            $table->text('comment');
            $table->tinyInteger('is_client_visible')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // =============================================
        // مرفقات المهام
        // =============================================
        Schema::create('task_attachments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('user_id');
            $table->string('file_name', 255);
            $table->string('file_url', 500);
            $table->integer('file_size')->nullable();
            $table->string('file_type', 50)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // =============================================
        // سجل حركة المهام
        // =============================================
        Schema::create('task_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('action', 50);
            $table->longText('details')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index('task_id', 'task_logs_task_index');
        });

        // =============================================
        // التفريغات
        // =============================================
        Schema::create('transcriptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('task_id')->nullable();
            $table->string('title', 255);
            $table->string('audio_url', 500)->nullable();
            $table->longText('raw_text')->nullable();
            $table->longText('formatted_text')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('task_id')->references('id')->on('tasks')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });

        // =============================================
        // التنبيهات
        // =============================================
        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('title', 255);
            $table->text('message')->nullable();
            $table->enum('type', [
                'task_assigned', 'task_updated', 'approval_needed', 'overdue', 'system'
            ])->default('system');
            $table->unsignedBigInteger('related_task_id')->nullable();
            $table->tinyInteger('is_read')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('related_task_id')->references('id')->on('tasks')->onDelete('set null');
            $table->index(['user_id', 'is_read'], 'notif_user_read_index');
        });
    }

    public function down()
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('transcriptions');
        Schema::dropIfExists('task_logs');
        Schema::dropIfExists('task_attachments');
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('workflows');
        Schema::dropIfExists('projects');
    }
};
