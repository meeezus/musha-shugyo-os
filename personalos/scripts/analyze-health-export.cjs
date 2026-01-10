#!/usr/bin/env node

const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

const exportPath = process.argv[2] || '/Users/michaelenriquez/PersonalOS/apple_health_export/export.xml';

console.log('Parsing Apple Health export (this may take a moment)...');
console.log(`File: ${exportPath}`);

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

// Count by type
const byType = {};
records.forEach(r => {
    const type = r.type || 'Unknown';
    if (!byType[type]) byType[type] = 0;
    byType[type]++;
});

// Also check Workouts
let workouts = healthData.Workout || [];
if (!Array.isArray(workouts)) workouts = [workouts];

// Count workout types
const workoutTypes = {};
workouts.forEach(w => {
    const type = w.workoutActivityType || 'Unknown';
    if (!workoutTypes[type]) workoutTypes[type] = 0;
    workoutTypes[type]++;
});

console.log('\n=== RECORD TYPES ===');
Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
        const shortType = type
            .replace('HKQuantityTypeIdentifier', '')
            .replace('HKCategoryTypeIdentifier', '[Cat] ');
        console.log(`  ${shortType}: ${count.toLocaleString()}`);
    });

console.log(`\n=== WORKOUT TYPES (${workouts.length} total) ===`);
Object.entries(workoutTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([type, count]) => {
        const shortType = type.replace('HKWorkoutActivityType', '');
        console.log(`  ${shortType}: ${count}`);
    });

// Map to Human 3.0 quadrants
console.log('\n=== HUMAN 3.0 QUADRANT MAPPING ===');

console.log('\nBODY QUADRANT:');
const bodyTypes = [
    'HKQuantityTypeIdentifierStepCount',
    'HKQuantityTypeIdentifierDistanceWalkingRunning',
    'HKQuantityTypeIdentifierActiveEnergyBurned',
    'HKQuantityTypeIdentifierAppleExerciseTime',
    'HKQuantityTypeIdentifierHeartRate',
    'HKQuantityTypeIdentifierRestingHeartRate',
    'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
    'HKCategoryTypeIdentifierSleepAnalysis',
    'HKQuantityTypeIdentifierBodyMass',
    'HKQuantityTypeIdentifierVO2Max',
];
bodyTypes.forEach(type => {
    const count = byType[type] || 0;
    if (count > 0) {
        const shortType = type.replace('HKQuantityTypeIdentifier', '').replace('HKCategoryTypeIdentifier', '');
        console.log(`  ${shortType}: ${count.toLocaleString()}`);
    }
});
console.log(`  Workouts: ${workouts.length}`);

console.log('\nSPIRIT/MIND QUADRANT:');
const spiritTypes = [
    'HKCategoryTypeIdentifierMindfulSession',
];
spiritTypes.forEach(type => {
    const count = byType[type] || 0;
    if (count > 0) {
        const shortType = type.replace('HKCategoryTypeIdentifier', '');
        console.log(`  ${shortType}: ${count.toLocaleString()}`);
    }
});

// Sample some data
console.log('\n=== SAMPLE DATA ===');

// Sample sleep data
const sleepRecords = records.filter(r => r.type === 'HKCategoryTypeIdentifierSleepAnalysis').slice(0, 3);
if (sleepRecords.length > 0) {
    console.log('\nSleep (sample):');
    sleepRecords.forEach(r => {
        console.log(`  ${r.startDate} - ${r.value}`);
    });
}

// Sample workout
if (workouts.length > 0) {
    console.log('\nWorkouts (sample):');
    workouts.slice(0, 5).forEach(w => {
        const type = (w.workoutActivityType || '').replace('HKWorkoutActivityType', '');
        const duration = Math.round(parseFloat(w.duration || 0));
        const date = w.startDate ? w.startDate.split(' ')[0] : 'Unknown';
        console.log(`  ${date}: ${type} - ${duration} min`);
    });
}

// Mindful sessions
const mindful = records.filter(r => r.type === 'HKCategoryTypeIdentifierMindfulSession');
if (mindful.length > 0) {
    console.log('\nMindful Sessions (sample):');
    mindful.slice(0, 5).forEach(r => {
        const source = r.sourceName || 'Unknown';
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        const duration = Math.round((end - start) / 1000 / 60);
        console.log(`  ${r.startDate.split(' ')[0]}: ${duration} min (${source})`);
    });

    // Group by source
    const bySource = {};
    mindful.forEach(r => {
        const source = r.sourceName || 'Unknown';
        if (!bySource[source]) bySource[source] = 0;
        bySource[source]++;
    });
    console.log('\nMindful by source:');
    Object.entries(bySource).sort((a,b) => b[1]-a[1]).forEach(([src, cnt]) => {
        console.log(`  ${src}: ${cnt}`);
    });
}
