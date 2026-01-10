<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('queue_id')->unique(); // e.g., "TW-006"
            $table->enum('type', ['tweet', 'thread', 'newsletter'])->default('tweet');
            $table->enum('pillar', ['automation', 'martial-arts', 'consciousness']);
            $table->string('archetype')->nullable(); // Quiet Devastator, Patient Observer, Dramatic Prophet
            $table->string('topic')->nullable();
            $table->text('content');
            $table->enum('status', ['draft', 'ready', 'posted'])->default('draft');
            $table->integer('effortless_score')->nullable(); // 1-10
            $table->string('source_path')->nullable(); // path to original .md file
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'pillar']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_drafts');
    }
};
