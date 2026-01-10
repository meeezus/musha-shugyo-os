<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('strategic_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('category'); // revenue, health, content, learning
            $table->decimal('target_value', 10, 2);
            $table->decimal('current_value', 10, 2)->default(0);
            $table->string('unit'); // workshops, clients, %, dollars
            $table->decimal('target_dollars', 10, 2)->nullable(); // monetary value of goal
            $table->date('target_date')->nullable();
            $table->string('timeframe')->nullable(); // Q1 2026, This Month, etc.
            $table->text('notes')->nullable();
            $table->string('status')->default('active'); // active, completed, paused
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('strategic_goals');
    }
};
