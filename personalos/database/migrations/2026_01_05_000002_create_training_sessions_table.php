<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // bjj, strength, cardio, yoga, etc.
            $table->date('date');
            $table->integer('duration_minutes')->nullable(); // duration in minutes
            $table->string('intensity')->nullable(); // light, moderate, hard
            $table->text('notes')->nullable();
            $table->json('techniques')->nullable(); // array of techniques practiced
            $table->json('sparring')->nullable(); // sparring rounds info
            $table->integer('energy_before')->nullable(); // 1-10
            $table->integer('energy_after')->nullable(); // 1-10
            $table->timestamps();

            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_sessions');
    }
};
