#!/usr/bin/env node

/**
 * Apple Health Comprehensive Import Script
 *
 * Imports health data from Apple Health export into PersonalOS for Human 3.0 tracking.
 *
 * Data imported:
 * - Workouts (strength, HIIT, running, wrestling, etc.)
 * - Daily metrics (steps, calories, exercise minutes)
 * - Heart data (resting HR, HRV)
 * - Sleep data
 * - Mindfulness sessions (Waking Up, etc.)
 *
 * Usage:
 *   node scripts/import-apple-health.cjs /path/to/export.xml [options]
 *
 * Options:
 *   --dry-run     Show what would be imported without making changes
 *   --since=DATE  Only import data after this date (YYYY-MM-DD)
 *   --output=DIR  Write JSON files to directory for manual import
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

// Parse args
const args = process.argv.slice(2);
const exportPath = args.find(a => !a.startsWith('--')) || '/Users/michaelenriquez/PersonalOS/apple_health_export/export.xml';
const dryRun = args.includes('--dry-run');
const sinceArg = args.find(a => a.startsWith('--since='));
const sinceDate = sinceArg ? new Date(sinceArg.split('=')[1]) : null;
const outputArg = args.find(a => a.startsWith('--output='));
const outputDir = outputArg ? outputArg.split('=')[1] : null;

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Apple Health Comprehensive Import

Usage:
  node scripts/import-apple-health.cjs [export.xml] [options]

Options:
  --dry-run       Show stats without importing
  --since=DATE    Only import data after DATE (YYYY-MM-DD)
  --output=DIR    Write JSON files to DIR for manual import

Examples:
  node scripts/import-apple-health.cjs --dry-run
  node scripts/import-apple-health.cjs --since=2024-01-01
  node scripts/import-apple-health.cjs --output=./health-data
`);
    process.exit(0);
}

console.log('='.repeat(60));
console.log('Apple Health Import for PersonalOS Human 3.0');
console.log('='.repeat(60));
console.log(`\nFile: ${exportPath}`);

if (!fs.existsSync(exportPath)) {
    console.error(`Error: File not found: ${exportPath}`);
    process.exit(1);
}

const fileSize = (fs.statSync(exportPath).size / 1024 / 1024).toFixed(2);
console.log(`Size: ${fileSize} MB`);
if (sinceDate) console.log(`Since: ${sinceDate.toISOString().split('T')[0]}`);
if (dryRun) console.log('Mode: DRY RUN');
console.log('');

console.log('Parsing XML (this may take a minute)...');
const xmlData = fs.readFileSync(exportPath, 'utf-8');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseAttributeValue: false,
});

const parsed = parser.parse(xmlData);
const healthData = parsed.HealthData;

let records = healthData.Record || [];
if (!Array.isArray(records)) records = [records];

let workouts = healthData.Workout || [];
if (!Array.isArray(workouts)) workouts = [workouts];

console.log(`Total records: ${records.length.toLocaleString()}`);
console.log(`Total workouts: ${workouts.length}`);

// Filter by date if specified
if (sinceDate) {
    const sinceTs = sinceDate.getTime();
    records = records.filter(r => new Date(r.startDate).getTime() >= sinceTs);
    workouts = workouts.filter(w => new Date(w.startDate).getTime() >= sinceTs);
    console.log(`After date filter: ${records.length.toLocaleString()} records, ${workouts.length} workouts`);
}

// ============================================================
// 1. WORKOUTS
// ============================================================
console.log('\n' + '='.repeat(40));
console.log('WORKOUTS');
console.log('='.repeat(40));

const workoutData = workouts.map(w => {
    const startDate = new Date(w.startDate);
    const endDate = new Date(w.endDate);
    const duration = Math.round((endDate - startDate) / 1000 / 60);
    const appleType = w.workoutActivityType || 'Other';

    // Normalize type
    let type = appleType.replace('HKWorkoutActivityType', '').toLowerCase();
    const typeMapping = {
        'traditionalstrengthtraining': 'strength',
        'functionalstrengthtraining': 'strength',
        'highintensityintervaltraining': 'hiit',
        'mixedcardio': 'cardio',
        'martialarts': 'martial_arts',
    };
    type = typeMapping[type] || type;

    return {
        type,
        apple_workout_type: appleType,
        date: startDate.toISOString().split('T')[0],
        started_at: startDate.toISOString(),
        ended_at: endDate.toISOString(),
        duration_minutes: duration,
        calories_burned: w.totalEnergyBurned ? Math.round(parseFloat(w.totalEnergyBurned)) : null,
        distance_km: w.totalDistance ? parseFloat((parseFloat(w.totalDistance) / 1000).toFixed(2)) : null,
        source: 'apple_health',
        source_id: `apple_${startDate.getTime()}`,
    };
});

// Group by type for summary
const workoutsByType = {};
workoutData.forEach(w => {
    if (!workoutsByType[w.type]) workoutsByType[w.type] = [];
    workoutsByType[w.type].push(w);
});

console.log(`\nWorkout types:`);
Object.entries(workoutsByType)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, list]) => {
        const totalMin = list.reduce((sum, w) => sum + w.duration_minutes, 0);
        const totalHours = (totalMin / 60).toFixed(1);
        console.log(`  ${type}: ${list.length} sessions (${totalHours}h total)`);
    });

// ============================================================
// 2. DAILY METRICS (aggregated by day)
// ============================================================
console.log('\n' + '='.repeat(40));
console.log('DAILY METRICS');
console.log('='.repeat(40));

// Group records by date and type
const recordsByDateType = {};
records.forEach(r => {
    if (!r.startDate) return;
    const date = r.startDate.split(' ')[0];
    const type = r.type;
    if (!recordsByDateType[date]) recordsByDateType[date] = {};
    if (!recordsByDateType[date][type]) recordsByDateType[date][type] = [];
    recordsByDateType[date][type].push(r);
});

const dailyMetrics = [];
const dates = Object.keys(recordsByDateType).sort();

dates.forEach(date => {
    const dayRecords = recordsByDateType[date];
    const metric = {
        date,
        source: 'apple_health',
    };

    // Steps (sum for the day)
    const steps = dayRecords['HKQuantityTypeIdentifierStepCount'] || [];
    if (steps.length > 0) {
        metric.steps = steps.reduce((sum, r) => sum + parseInt(r.value || 0), 0);
    }

    // Distance (sum)
    const distance = dayRecords['HKQuantityTypeIdentifierDistanceWalkingRunning'] || [];
    if (distance.length > 0) {
        const totalMeters = distance.reduce((sum, r) => sum + parseFloat(r.value || 0), 0);
        metric.distance_km = parseFloat((totalMeters / 1000).toFixed(2));
    }

    // Active calories (sum)
    const calories = dayRecords['HKQuantityTypeIdentifierActiveEnergyBurned'] || [];
    if (calories.length > 0) {
        metric.active_calories = Math.round(calories.reduce((sum, r) => sum + parseFloat(r.value || 0), 0));
    }

    // Exercise minutes (sum)
    const exercise = dayRecords['HKQuantityTypeIdentifierAppleExerciseTime'] || [];
    if (exercise.length > 0) {
        metric.exercise_minutes = Math.round(exercise.reduce((sum, r) => sum + parseFloat(r.value || 0), 0));
    }

    // Resting heart rate (average)
    const restingHR = dayRecords['HKQuantityTypeIdentifierRestingHeartRate'] || [];
    if (restingHR.length > 0) {
        const avg = restingHR.reduce((sum, r) => sum + parseFloat(r.value || 0), 0) / restingHR.length;
        metric.resting_heart_rate = Math.round(avg);
    }

    // HRV (average)
    const hrv = dayRecords['HKQuantityTypeIdentifierHeartRateVariabilitySDNN'] || [];
    if (hrv.length > 0) {
        const avg = hrv.reduce((sum, r) => sum + parseFloat(r.value || 0), 0) / hrv.length;
        metric.hrv_avg = Math.round(avg);
    }

    // Flights climbed (sum)
    const flights = dayRecords['HKQuantityTypeIdentifierFlightsClimbed'] || [];
    if (flights.length > 0) {
        metric.flights_climbed = flights.reduce((sum, r) => sum + parseInt(r.value || 0), 0);
    }

    // Sleep (sum of asleep time)
    const sleep = dayRecords['HKCategoryTypeIdentifierSleepAnalysis'] || [];
    if (sleep.length > 0) {
        let sleepMinutes = 0;
        sleep.forEach(s => {
            // Only count actual sleep, not "InBed"
            if (s.value && s.value.includes('Asleep')) {
                const start = new Date(s.startDate);
                const end = new Date(s.endDate);
                sleepMinutes += (end - start) / 1000 / 60;
            }
        });
        if (sleepMinutes > 0) {
            metric.sleep_minutes = Math.round(sleepMinutes);
        }
    }

    // Body mass (latest of day)
    const weight = dayRecords['HKQuantityTypeIdentifierBodyMass'] || [];
    if (weight.length > 0) {
        metric.weight_kg = parseFloat(parseFloat(weight[weight.length - 1].value).toFixed(2));
    }

    // Only include if we have some data
    if (Object.keys(metric).length > 2) {
        dailyMetrics.push(metric);
    }
});

console.log(`Days with data: ${dailyMetrics.length}`);

// Show sample
const metricsWithSteps = dailyMetrics.filter(m => m.steps);
const metricsWithSleep = dailyMetrics.filter(m => m.sleep_minutes);
const metricsWithHRV = dailyMetrics.filter(m => m.hrv_avg);

console.log(`  Days with steps: ${metricsWithSteps.length}`);
console.log(`  Days with sleep: ${metricsWithSleep.length}`);
console.log(`  Days with HRV: ${metricsWithHRV.length}`);

if (metricsWithSteps.length > 0) {
    const avgSteps = metricsWithSteps.reduce((sum, m) => sum + m.steps, 0) / metricsWithSteps.length;
    console.log(`  Avg daily steps: ${Math.round(avgSteps).toLocaleString()}`);
}

// ============================================================
// 3. MINDFULNESS SESSIONS
// ============================================================
console.log('\n' + '='.repeat(40));
console.log('MINDFULNESS SESSIONS');
console.log('='.repeat(40));

const mindfulRecords = records.filter(r => r.type === 'HKCategoryTypeIdentifierMindfulSession');

const meditationData = mindfulRecords.map(r => {
    const startDate = new Date(r.startDate);
    const endDate = new Date(r.endDate);
    const duration = Math.round((endDate - startDate) / 1000 / 60);
    const source = r.sourceName || 'Unknown';

    // Determine meditation type based on duration
    let meditationType = 'daily';
    if (duration <= 3) meditationType = 'moment';
    else if (duration <= 8) meditationType = 'practice';
    else if (duration >= 15) meditationType = 'daily';
    else meditationType = 'practice';

    return {
        type: 'meditation',
        date: startDate.toISOString().split('T')[0],
        duration_minutes: duration,
        meditation_type: meditationType,
        content: `Imported from ${source}`,
    };
});

// Group by source
const bySource = {};
mindfulRecords.forEach(r => {
    const source = r.sourceName || 'Unknown';
    if (!bySource[source]) bySource[source] = 0;
    bySource[source]++;
});

console.log(`\nMindfulness sessions: ${meditationData.length}`);
console.log('By source:');
Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .forEach(([src, cnt]) => console.log(`  ${src}: ${cnt}`));

const totalMedMinutes = meditationData.reduce((sum, m) => sum + m.duration_minutes, 0);
console.log(`Total meditation time: ${(totalMedMinutes / 60).toFixed(1)} hours`);

// ============================================================
// OUTPUT
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

console.log(`
Ready to import:
  - ${workoutData.length} workouts
  - ${dailyMetrics.length} days of health metrics
  - ${meditationData.length} meditation sessions
`);

if (dryRun) {
    console.log('[DRY RUN - No changes made]');
    process.exit(0);
}

// Write to files
if (outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(outputDir, 'workouts.json'),
        JSON.stringify(workoutData, null, 2)
    );
    fs.writeFileSync(
        path.join(outputDir, 'daily_metrics.json'),
        JSON.stringify(dailyMetrics, null, 2)
    );
    fs.writeFileSync(
        path.join(outputDir, 'meditation.json'),
        JSON.stringify({ entries: meditationData }, null, 2)
    );

    console.log(`\nData written to ${outputDir}/`);
    console.log('  - workouts.json');
    console.log('  - daily_metrics.json');
    console.log('  - meditation.json');
    process.exit(0);
}

// Direct database import
console.log('\nImporting to database...');

// We'll use a PHP script for the actual import since we need Laravel
const importData = {
    workouts: workoutData,
    daily_metrics: dailyMetrics,
    meditation: meditationData,
};

const importPath = path.join(__dirname, '..', 'storage', 'health-import.json');
fs.writeFileSync(importPath, JSON.stringify(importData, null, 2));

console.log(`\nData written to: ${importPath}`);
console.log(`\nTo complete import, run:`);
console.log(`  php artisan health:import`);
console.log(`\nOr import manually via API endpoints.`);
