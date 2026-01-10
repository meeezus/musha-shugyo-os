<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class FullProjectPlanSeeder extends Seeder
{
    /**
     * Full 12-week project plans (Jan 6 - Mar 31, 2026)
     */
    public function run(): void
    {
        $user = User::first();
        if (!$user) {
            echo "No user found. Please create a user first.\n";
            return;
        }

        $this->seedDecoponATX($user);
        $this->seedAutomationAgency($user);
        $this->seedPersonalBrand($user);

        echo "✓ Full project plans seeded successfully.\n";
    }

    private function seedDecoponATX($user): void
    {
        $project = Project::updateOrCreate(
            ['name' => 'DecoponATX', 'user_id' => $user->id],
            [
                'description' => 'Phone case decorating workshop business - Goal: $2,500-3,000 revenue by end of Month 1',
                'status' => 'active',
                'quadrant' => 'vocation',
                'color' => '#667eea',
                'sort_order' => 1,
            ]
        );

        $tasks = [
            // Week 1 (Jan 6-10)
            ['title' => 'Hero video created by Tricia (60-90 sec)', 'priority' => 'high', 'sort_order' => 1, 'phase' => 'Week 1'],
            ['title' => 'Landing page live with video + email capture', 'priority' => 'high', 'sort_order' => 2, 'phase' => 'Week 1'],
            ['title' => 'Email automation system designed', 'priority' => 'high', 'sort_order' => 3, 'phase' => 'Week 1'],
            ['title' => 'Warm network outreach emails sent', 'priority' => 'medium', 'sort_order' => 4, 'phase' => 'Week 1'],
            ['title' => 'First discovery calls completed', 'priority' => 'medium', 'sort_order' => 5, 'phase' => 'Week 1'],

            // Week 2 (Jan 13-17)
            ['title' => 'Email automation system built (3-email welcome sequence)', 'priority' => 'high', 'sort_order' => 6, 'phase' => 'Week 2'],
            ['title' => 'First 50 cold emails sent', 'priority' => 'high', 'sort_order' => 7, 'phase' => 'Week 2'],
            ['title' => 'Landing page analytics tracking live', 'priority' => 'medium', 'sort_order' => 8, 'phase' => 'Week 2'],
            ['title' => 'Follow-up sequence for warm leads', 'priority' => 'medium', 'sort_order' => 9, 'phase' => 'Week 2'],

            // Week 3 (Jan 20-24)
            ['title' => '100 total cold emails sent', 'priority' => 'high', 'sort_order' => 10, 'phase' => 'Week 3'],
            ['title' => 'First paid workshop booked', 'priority' => 'high', 'sort_order' => 11, 'phase' => 'Week 3'],
            ['title' => 'Case study content from first event', 'priority' => 'medium', 'sort_order' => 12, 'phase' => 'Week 3'],

            // Week 4 (Jan 27-31)
            ['title' => '150 total cold emails sent', 'priority' => 'high', 'sort_order' => 13, 'phase' => 'Week 4'],
            ['title' => '2nd workshop booked or completed', 'priority' => 'high', 'sort_order' => 14, 'phase' => 'Week 4'],
            ['title' => 'Testimonials collected from first events', 'priority' => 'medium', 'sort_order' => 15, 'phase' => 'Week 4'],
            ['title' => 'Month 1 revenue target: $2,500-3,000', 'priority' => 'high', 'sort_order' => 16, 'phase' => 'Week 4'],

            // Month 2 (Weeks 5-8)
            ['title' => 'Expand to schools/daycares outreach', 'priority' => 'medium', 'sort_order' => 17, 'phase' => 'Month 2'],
            ['title' => '4-6 workshops completed', 'priority' => 'high', 'sort_order' => 18, 'phase' => 'Month 2'],
            ['title' => 'Referral system established', 'priority' => 'medium', 'sort_order' => 19, 'phase' => 'Month 2'],
            ['title' => 'Corporate team-building packages created', 'priority' => 'medium', 'sort_order' => 20, 'phase' => 'Month 2'],

            // Month 3 (Weeks 9-12)
            ['title' => '8+ workshops completed', 'priority' => 'high', 'sort_order' => 21, 'phase' => 'Month 3'],
            ['title' => 'Recurring clients identified', 'priority' => 'high', 'sort_order' => 22, 'phase' => 'Month 3'],
            ['title' => 'Q2 planning complete', 'priority' => 'medium', 'sort_order' => 23, 'phase' => 'Month 3'],
            ['title' => 'Revenue target: $7,500-10,000 cumulative', 'priority' => 'high', 'sort_order' => 24, 'phase' => 'Month 3'],
        ];

        $this->createTasks($project, $tasks, $user);
        echo "  - DecoponATX: " . count($tasks) . " tasks\n";
    }

    private function seedAutomationAgency($user): void
    {
        $project = Project::updateOrCreate(
            ['name' => 'Automation Agency', 'user_id' => $user->id],
            [
                'description' => 'Done-for-you automation systems for SMBs - Goal: Close first $8,500 client by Day 90',
                'status' => 'active',
                'quadrant' => 'vocation',
                'color' => '#764ba2',
                'sort_order' => 2,
            ]
        );

        $tasks = [
            // Week 1 (Jan 6-10)
            ['title' => 'Theresa Bastian discovery request sent', 'priority' => 'high', 'sort_order' => 1, 'phase' => 'Week 1'],
            ['title' => 'Discovery call scheduled for Friday', 'priority' => 'high', 'sort_order' => 2, 'phase' => 'Week 1'],
            ['title' => 'Pain points documented', 'priority' => 'medium', 'sort_order' => 3, 'phase' => 'Week 1'],
            ['title' => 'Soft close for follow-up completed', 'priority' => 'medium', 'sort_order' => 4, 'phase' => 'Week 1'],

            // Week 2 (Jan 13-17)
            ['title' => 'Theresa proposal sent', 'priority' => 'high', 'sort_order' => 5, 'phase' => 'Week 2'],
            ['title' => 'Property management research complete', 'priority' => 'medium', 'sort_order' => 6, 'phase' => 'Week 2'],
            ['title' => 'Cold email template created', 'priority' => 'medium', 'sort_order' => 7, 'phase' => 'Week 2'],

            // Week 3 (Jan 20-26)
            ['title' => 'Property manager outreach campaign starts', 'priority' => 'high', 'sort_order' => 8, 'phase' => 'Week 3'],
            ['title' => '20 cold emails sent to property managers', 'priority' => 'high', 'sort_order' => 9, 'phase' => 'Week 3'],
            ['title' => 'Follow-up on Theresa proposal', 'priority' => 'high', 'sort_order' => 10, 'phase' => 'Week 3'],

            // Week 4 (Jan 27-31)
            ['title' => '40 total cold emails sent', 'priority' => 'high', 'sort_order' => 11, 'phase' => 'Week 4'],
            ['title' => 'First automation audit completed', 'priority' => 'high', 'sort_order' => 12, 'phase' => 'Week 4'],
            ['title' => '2-3 discovery calls booked', 'priority' => 'medium', 'sort_order' => 13, 'phase' => 'Week 4'],

            // Month 2 (Weeks 5-8)
            ['title' => 'First client proposal sent', 'priority' => 'high', 'sort_order' => 14, 'phase' => 'Month 2'],
            ['title' => '80+ cold emails sent', 'priority' => 'medium', 'sort_order' => 15, 'phase' => 'Month 2'],
            ['title' => '5+ discovery calls completed', 'priority' => 'medium', 'sort_order' => 16, 'phase' => 'Month 2'],
            ['title' => 'Case study framework created', 'priority' => 'medium', 'sort_order' => 17, 'phase' => 'Month 2'],

            // Month 3 (Weeks 9-12)
            ['title' => 'First $8,500 client closed', 'priority' => 'high', 'sort_order' => 18, 'phase' => 'Month 3'],
            ['title' => 'First automation project delivered', 'priority' => 'high', 'sort_order' => 19, 'phase' => 'Month 3'],
            ['title' => 'Testimonial and case study collected', 'priority' => 'medium', 'sort_order' => 20, 'phase' => 'Month 3'],
            ['title' => 'Pipeline: 3+ qualified prospects', 'priority' => 'medium', 'sort_order' => 21, 'phase' => 'Month 3'],
        ];

        $this->createTasks($project, $tasks, $user);
        echo "  - Automation Agency: " . count($tasks) . " tasks\n";
    }

    private function seedPersonalBrand($user): void
    {
        $project = Project::updateOrCreate(
            ['name' => 'Personal Brand + Growth System', 'user_id' => $user->id],
            [
                'description' => 'Musha Shugyo content + Digital Economics - Goal: 1,200 followers, 300 newsletter subs',
                'status' => 'active',
                'quadrant' => 'vocation',
                'color' => '#F59E0B',
                'sort_order' => 3,
            ]
        );

        $tasks = [
            // Week 1 (Jan 6-10) - Phase 1 Foundation
            ['title' => 'Newsletter #1 published (Why I Left)', 'priority' => 'high', 'sort_order' => 1, 'phase' => 'Week 1'],
            ['title' => '2 tweets/day system established (14 tweets)', 'priority' => 'high', 'sort_order' => 2, 'phase' => 'Week 1'],
            ['title' => 'Digital Economics Lessons 1-4 completed', 'priority' => 'medium', 'sort_order' => 3, 'phase' => 'Week 1'],
            ['title' => 'Metrics tracking started (Substack, Twitter)', 'priority' => 'medium', 'sort_order' => 4, 'phase' => 'Week 1'],

            // Week 2 (Jan 13-17)
            ['title' => 'Newsletter #2 published (Decentralized Health)', 'priority' => 'high', 'sort_order' => 5, 'phase' => 'Week 2'],
            ['title' => '14 more tweets posted (28 total)', 'priority' => 'high', 'sort_order' => 6, 'phase' => 'Week 2'],
            ['title' => 'Digital Economics Lessons 5-8 completed', 'priority' => 'medium', 'sort_order' => 7, 'phase' => 'Week 2'],
            ['title' => 'Profile optimization based on lessons', 'priority' => 'medium', 'sort_order' => 8, 'phase' => 'Week 2'],

            // Week 3 (Jan 20-24)
            ['title' => 'Newsletter #3 published (White Belt Advantage)', 'priority' => 'high', 'sort_order' => 9, 'phase' => 'Week 3'],
            ['title' => '42 total tweets posted', 'priority' => 'high', 'sort_order' => 10, 'phase' => 'Week 3'],
            ['title' => 'Digital Economics Lessons 9-12 completed', 'priority' => 'medium', 'sort_order' => 11, 'phase' => 'Week 3'],

            // Week 4 (Jan 27-31)
            ['title' => 'Newsletter #4 published (Building My Second Brain with AI)', 'priority' => 'high', 'sort_order' => 12, 'phase' => 'Week 4'],
            ['title' => '56 total tweets posted (Phase 1 complete)', 'priority' => 'high', 'sort_order' => 13, 'phase' => 'Week 4'],
            ['title' => 'Digital Economics Lessons 13-16 completed', 'priority' => 'medium', 'sort_order' => 14, 'phase' => 'Week 4'],
            ['title' => 'Phase 1 goal: 600 followers, 50 subs', 'priority' => 'high', 'sort_order' => 15, 'phase' => 'Week 4'],

            // Phase 2: Momentum (Weeks 5-8)
            ['title' => 'Add weekly thread (extracted from newsletter)', 'priority' => 'high', 'sort_order' => 16, 'phase' => 'Phase 2'],
            ['title' => 'Digital Economics Lessons 17-24 completed', 'priority' => 'medium', 'sort_order' => 17, 'phase' => 'Phase 2'],
            ['title' => 'Newsletters #5-8 published', 'priority' => 'high', 'sort_order' => 18, 'phase' => 'Phase 2'],
            ['title' => 'Principle Stacking content (connect all 3 pillars)', 'priority' => 'medium', 'sort_order' => 19, 'phase' => 'Phase 2'],
            ['title' => 'Phase 2 goal: 800 followers, 150 subs', 'priority' => 'high', 'sort_order' => 20, 'phase' => 'Phase 2'],

            // Phase 3: Scale (Weeks 9-12)
            ['title' => 'Digital Economics Lessons 25+ completed', 'priority' => 'medium', 'sort_order' => 21, 'phase' => 'Phase 3'],
            ['title' => 'Newsletters #9-12 published', 'priority' => 'high', 'sort_order' => 22, 'phase' => 'Phase 3'],
            ['title' => 'First digital product outline created', 'priority' => 'medium', 'sort_order' => 23, 'phase' => 'Phase 3'],
            ['title' => 'Multi-platform strategy evaluated', 'priority' => 'low', 'sort_order' => 24, 'phase' => 'Phase 3'],
            ['title' => 'Phase 3 goal: 1,200 followers, 300 subs', 'priority' => 'high', 'sort_order' => 25, 'phase' => 'Phase 3'],
        ];

        $this->createTasks($project, $tasks, $user);
        echo "  - Personal Brand + Growth System: " . count($tasks) . " tasks\n";
    }

    private function createTasks($project, $tasks, $user): void
    {
        foreach ($tasks as $taskData) {
            Task::updateOrCreate(
                ['title' => $taskData['title'], 'project_id' => $project->id],
                [
                    'priority' => $taskData['priority'],
                    'sort_order' => $taskData['sort_order'],
                    'description' => $taskData['phase'] ?? null,
                    'user_id' => $user->id,
                ]
            );
        }
    }
}
