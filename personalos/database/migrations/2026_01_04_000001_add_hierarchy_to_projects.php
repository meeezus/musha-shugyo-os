<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Quadrant assignment for Life integration
            $table->enum('quadrant', ['mind', 'body', 'spirit', 'vocation'])->nullable()->after('color');
            
            // Parent project for hierarchy (sub-projects)
            $table->foreignId('parent_id')->nullable()->after('quadrant')
                ->constrained('projects')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['quadrant', 'parent_id']);
        });
    }
};
