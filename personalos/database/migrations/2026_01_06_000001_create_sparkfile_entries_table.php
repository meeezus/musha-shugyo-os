<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sparkfile_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['meditation', 'journal', 'spark'])->default('spark');
            $table->string('title')->nullable();
            $table->text('content')->nullable();
            $table->date('date');
            $table->integer('duration_minutes')->nullable(); // for meditation
            $table->integer('mood_before')->nullable(); // 1-10
            $table->integer('mood_after')->nullable(); // 1-10
            $table->string('meditation_type')->nullable(); // daily, theory, conversation, moment
            $table->json('tags')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sparkfile_entries');
    }
};
