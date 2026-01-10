<?php

namespace App\Console\Commands;

use App\Models\HealthMetric;
use App\Models\Workout;
use App\Models\SparkfileEntry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportHealthData extends Command
{
    protected $signature = 'health:import {file?} {--user=1}';
    protected $description = 'Import health data from Apple Health export JSON';

    public function handle()
    {
        $file = $this->argument('file') ?? storage_path('health-import.json');

        if (!file_exists($file)) {
            $this->error("File not found: $file");
            $this->info("Run: node scripts/import-apple-health.cjs");
            return 1;
        }

        $data = json_decode(file_get_contents($file), true);
        $userId = $this->option('user');

        $this->info("Importing health data for user $userId...");

        // Import workouts
        if (!empty($data['workouts'])) {
            $this->importWorkouts($data['workouts'], $userId);
        }

        // Import daily metrics
        if (!empty($data['daily_metrics'])) {
            $this->importDailyMetrics($data['daily_metrics'], $userId);
        }

        // Import meditation sessions
        if (!empty($data['meditation'])) {
            $this->importMeditation($data['meditation'], $userId);
        }

        $this->info("\nImport complete!");
        return 0;
    }

    protected function importWorkouts(array $workouts, int $userId): void
    {
        $this->info("\nImporting " . count($workouts) . " workouts...");

        $bar = $this->output->createProgressBar(count($workouts));
        $bar->start();

        $imported = 0;
        $skipped = 0;

        foreach ($workouts as $workout) {
            // Check for duplicate by source_id
            $exists = Workout::where('user_id', $userId)
                ->where('source_id', $workout['source_id'] ?? null)
                ->exists();

            if ($exists) {
                $skipped++;
                $bar->advance();
                continue;
            }

            Workout::create([
                'user_id' => $userId,
                'type' => $workout['type'],
                'apple_workout_type' => $workout['apple_workout_type'] ?? null,
                'date' => $workout['date'],
                'started_at' => $workout['started_at'] ?? null,
                'ended_at' => $workout['ended_at'] ?? null,
                'duration_minutes' => $workout['duration_minutes'],
                'calories_burned' => $workout['calories_burned'] ?? null,
                'distance_km' => $workout['distance_km'] ?? null,
                'source' => $workout['source'] ?? 'apple_health',
                'source_id' => $workout['source_id'] ?? null,
            ]);

            $imported++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("  Imported: $imported, Skipped (duplicates): $skipped");
    }

    protected function importDailyMetrics(array $metrics, int $userId): void
    {
        $this->info("\nImporting " . count($metrics) . " days of health metrics...");

        $bar = $this->output->createProgressBar(count($metrics));
        $bar->start();

        $imported = 0;
        $updated = 0;

        foreach ($metrics as $metric) {
            $existing = HealthMetric::where('user_id', $userId)
                ->where('date', $metric['date'])
                ->first();

            $data = [
                'user_id' => $userId,
                'date' => $metric['date'],
                'steps' => $metric['steps'] ?? null,
                'distance_km' => $metric['distance_km'] ?? null,
                'active_calories' => $metric['active_calories'] ?? null,
                'exercise_minutes' => $metric['exercise_minutes'] ?? null,
                'flights_climbed' => $metric['flights_climbed'] ?? null,
                'resting_heart_rate' => $metric['resting_heart_rate'] ?? null,
                'hrv_avg' => $metric['hrv_avg'] ?? null,
                'sleep_minutes' => $metric['sleep_minutes'] ?? null,
                'weight_kg' => $metric['weight_kg'] ?? null,
                'source' => $metric['source'] ?? 'apple_health',
            ];

            if ($existing) {
                // Only update if new data has more fields
                $existing->update($data);
                $updated++;
            } else {
                HealthMetric::create($data);
                $imported++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("  Imported: $imported, Updated: $updated");
    }

    protected function importMeditation(array $entries, int $userId): void
    {
        $this->info("\nImporting " . count($entries) . " meditation sessions...");

        $bar = $this->output->createProgressBar(count($entries));
        $bar->start();

        $imported = 0;
        $skipped = 0;

        foreach ($entries as $entry) {
            // Check for duplicate by date + duration (rough dedup)
            $exists = SparkfileEntry::where('user_id', $userId)
                ->where('type', 'meditation')
                ->where('date', $entry['date'])
                ->where('duration_minutes', $entry['duration_minutes'])
                ->exists();

            if ($exists) {
                $skipped++;
                $bar->advance();
                continue;
            }

            SparkfileEntry::create([
                'user_id' => $userId,
                'type' => 'meditation',
                'date' => $entry['date'],
                'duration_minutes' => $entry['duration_minutes'],
                'meditation_type' => $entry['meditation_type'] ?? 'daily',
                'content' => $entry['content'] ?? null,
            ]);

            $imported++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("  Imported: $imported, Skipped (duplicates): $skipped");
    }
}
