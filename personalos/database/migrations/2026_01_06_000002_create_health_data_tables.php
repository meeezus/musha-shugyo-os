<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Daily health metrics (aggregated per day for dashboard)
        Schema::create('health_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date')->index();

            // Activity
            $table->integer('steps')->nullable();
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->integer('active_calories')->nullable();
            $table->integer('exercise_minutes')->nullable();
            $table->integer('stand_hours')->nullable();
            $table->integer('flights_climbed')->nullable();

            // Heart
            $table->integer('resting_heart_rate')->nullable();
            $table->integer('avg_heart_rate')->nullable();
            $table->integer('hrv_avg')->nullable(); // HRV in ms
            $table->integer('walking_heart_rate_avg')->nullable();

            // Sleep (from Apple Health or Oura)
            $table->integer('sleep_minutes')->nullable();
            $table->integer('sleep_rem_minutes')->nullable();
            $table->integer('sleep_deep_minutes')->nullable();
            $table->integer('time_in_bed_minutes')->nullable();

            // Body
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('body_fat_percent', 4, 1)->nullable();

            // Source tracking
            $table->string('source')->default('apple_health'); // apple_health, oura, manual

            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });

        // Individual workouts
        Schema::create('workouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // strength, hiit, running, wrestling, bjj, etc.
            $table->string('apple_workout_type')->nullable(); // original HKWorkoutActivityType
            $table->date('date');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_minutes');
            $table->integer('calories_burned')->nullable();
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->integer('avg_heart_rate')->nullable();
            $table->integer('max_heart_rate')->nullable();
            $table->text('notes')->nullable();
            $table->string('source')->default('apple_health');
            $table->string('source_id')->nullable(); // for deduplication
            $table->timestamps();

            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workouts');
        Schema::dropIfExists('health_metrics');
    }
};
