<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recovery_routines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date')->index();

            // Left Brain Activation (5 min each, 2x/day)
            $table->boolean('left_brain_am')->default(false);
            $table->boolean('left_brain_pm')->default(false);

            // Physical Exercises
            $table->integer('scapular_squeezes')->default(0); // Target: 100/day
            $table->boolean('rear_deltoid')->default(false);
            $table->boolean('bicep_tricep_reset')->default(false);
            $table->boolean('tricep_extension')->default(false);
            $table->boolean('chin_darts')->default(false);
            $table->boolean('pec_lat_massage')->default(false);

            // Meta
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recovery_routines');
    }
};
