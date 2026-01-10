<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coding_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // commit, session, task_complete, pr_created, pr_merged
            $table->string('project_name')->nullable(); // e.g., "personalos", "decopon-atx"
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null'); // link to MSOS project
            $table->string('branch')->nullable();
            $table->string('commit_hash', 40)->nullable();
            $table->text('commit_message')->nullable();
            $table->integer('files_changed')->nullable();
            $table->integer('lines_added')->nullable();
            $table->integer('lines_removed')->nullable();
            $table->integer('duration_minutes')->nullable(); // for sessions
            $table->text('task_description')->nullable(); // for task completions
            $table->json('metadata')->nullable(); // extra data
            $table->string('source')->default('claude_code'); // claude_code, git_hook, manual
            $table->timestamp('activity_at');
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'activity_at']);
            $table->index('commit_hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coding_activities');
    }
};
