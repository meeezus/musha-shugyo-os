# Command Center Setup - Week 1 Projects

This document walks through setting up your PersonalOS dashboard with the Week 1 projects and tasks.

## Overview

The CommandController now **gracefully generates** recommendations, goals, and time allocation from your Projects in the database:

- If Iori agent service is available: Uses Iori's AI-generated data (enhanced)
- If Iori is unavailable: Falls back to database projects (seamless)
- The widgets automatically display whatever source has data

## Setup Steps

### 1. Run the Seeder (Creates Projects + Tasks)

Run this Laravel artisan command to create the three Week 1 projects with all their tasks:

```bash
php artisan db:seed --class=Week1ProjectsSeeder
```

This creates:
- **DecoponATX** (Purple) - 5 tasks for hero video, landing page, email automation
- **Automation Agency** (Dark purple) - 4 tasks for Theresa outreach & discovery
- **Personal Brand + Growth System** (Amber) - 5 tasks for newsletter, tweets, Digital Econ course

### 2. View in Command Center

Go to http://localhost:8000/

The dashboard now shows:

**RECOMMENDATIONS Widget:**
- Top 5 uncompleted tasks from your active projects
- Confidence scores based on priority (high=95%, medium=75%, low=60%)
- Shows project name as context

**GOAL ALIGNMENT Widget:**
- Progress on each project (tasks completed vs total)
- Auto-categorized: DecoponATX/Automation Agency = revenue, Personal Brand = content
- Trend indicators: up (>50%), stable (>0%), down (0%)

**TIME ALLOCATION Widget:**
- DecoponATX: 4-6 hrs/day (Primary focus)
- Automation Agency: 2-3 hrs/day (Secondary)
- Personal Brand: 2-3 hrs/day (Daily ritual: 2 tweets + newsletter)

### 3. Update Projects Through the UI

All projects and tasks are now in your database and can be managed through:

**Option A: Projects Page**
- Go to http://localhost:8000/projects
- Create, edit, or mark tasks complete
- Changes instantly reflect in Command Center

**Option B: Command Center**
- Tasks appear in RECOMMENDATIONS widget
- Mark complete by checking the task in Projects page
- Progress updates automatically

## How It Works

The `/api/command/brief` endpoint now:

1. **Tries Iori first** (if available):
   - Fetches AI-generated recommendations, goals, time allocation
   - Merges with Oura biometrics data
   - Returns full AI-enhanced brief

2. **Falls back gracefully** (if Iori unavailable):
   - Generates from your Projects/Tasks database
   - Still shows all widgets with real data
   - No errors, just seamless switching

3. **Data Flow**:
   ```
   Dashboard.tsx
       ↓
   /api/command/brief
       ↓
   Try Iori → Fallback to Projects ↓
           CommandController
           ├── generateRecommendationsFromProjects()
           ├── generateGoalAlignmentFromProjects()
           └── generateTimeAllocationFromProjects()
   ```

## Customizing Projects

### Rename a Project

Edit through Projects UI or update in DB:

```php
Project::where('name', 'Personal Brand + Growth System')
    ->update(['name' => 'Your Custom Name']);
```

### Change Time Allocation

Edit the `$timeAllocationMap` in `CommandController.php` line 208:

```php
'DecoponATX' => ['hours' => '5-7', 'schedule' => 'PRIORITY', 'color' => '#667eea'],
```

### Add New Projects

Either:
- Use Projects UI
- Or extend the seeder

### Change Project Colors

Projects use hex colors (`#667eea`, `#764ba2`, `#F59E0B`). Update via:

```php
Project::where('name', 'DecoponATX')
    ->update(['color' => '#FF5733']);
```

The Command Center will automatically pick up the new color.

## Troubleshooting

### Projects not showing in Command Center?

1. Check Oura/Iori status (if you were relying on that)
2. Verify seeder ran: `php artisan tinker` then `App\Models\Project::count()`
3. Refresh page, check browser console for errors
4. Try: `php artisan cache:clear`

### Tasks not showing in RECOMMENDATIONS?

1. Verify projects exist: `http://localhost:8000/projects`
2. Check tasks have `completed_at = null` (not marked done)
3. Make sure you have active projects

### Time allocation missing colors?

Projects need hex color codes in `color` field. Default in seeder:
- DecoponATX: `#667eea`
- Automation Agency: `#764ba2`
- Personal Brand: `#F59E0B`

Update via Projects UI or database.

## Architecture Benefits

✓ **No external dependencies**: Works with or without Iori
✓ **Single source of truth**: Projects/Tasks in database
✓ **Graceful degradation**: Missing Iori? Use projects instead
✓ **Fully editable**: Change projects/tasks through UI
✓ **Real-time updates**: Refresh page = latest data
✓ **Scalable**: Add as many projects/tasks as you want

## Next Steps

1. Run seeder: `php artisan db:seed --class=Week1ProjectsSeeder`
2. View dashboard: http://localhost:8000/
3. Complete tasks as you work
4. Watch progress update in Command Center
5. Edit projects through the UI as plans change

---

**Last Updated:** Jan 6, 2025
**File:** `/personalos/COMMAND_CENTER_SETUP.md`
