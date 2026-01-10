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
        Schema::table('oura_data', function (Blueprint $table) {
            $table->integer('stress_high')->nullable()->after('target_calories');
            $table->integer('recovery_high')->nullable()->after('stress_high');
            $table->string('day_summary', 50)->nullable()->after('recovery_high');
            $table->json('stress_data')->nullable()->after('activity_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('oura_data', function (Blueprint $table) {
            $table->dropColumn(['stress_high', 'recovery_high', 'day_summary', 'stress_data']);
        });
    }
};
