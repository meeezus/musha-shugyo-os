<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class Week1ProjectsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        if (!$user) {
            echo "No user found. Please create a user first.\n";
            return;
        }

        // 1. DecoponATX PROJECT
        $decoponATX = Project::updateOrCreate(
            ['name' => 'DecoponATX', 'user_id' => $user->id],
            [
                'description' => 'Phone case decorating workshop business - Hero video + Landing page + Email automation',
                'status' => 'active',
                'quadrant' => 'vocation',
                'color' => '#667eea',
                'sort_order' => 1,
            ]
        );

        // DecoponATX Week 1 Tasks
        $decoponTasks = [
            ['title' => 'Hero video created by Tricia', 'priority' => 'high', 'sort_order' => 1],
            ['title' => 'Landing page live with video + email capture', 'priority' => 'high', 'sort_order' => 2],
            ['title' => 'Email automation system designed', 'priority' => 'high', 'sort_order' => 3],
            ['title' => 'Warm network outreach emails sent', 'priority' => 'medium', 'sort_order' => 4],
            ['title' => 'First discovery calls completed', 'priority' => 'medium', 'sort_order' => 5],
        ];

        foreach ($decoponTasks as $taskData) {
            Task::updateOrCreate(
                ['title' => $taskData['title'], 'project_id' => $decoponATX->id],
                [
                    'priority' => $taskData['priority'],
                    'sort_order' => $taskData['sort_order'],
                    'user_id' => $user->id,
                ]
            );
        }

        // 2. AUTOMATION AGENCY PROJECT
        $automationAgency = Project::updateOrCreate(
            ['name' => 'Automation Agency', 'user_id' => $user->id],
            [
                'description' => 'Done-for-you automation systems for SMBs - Theresa Bastian as first warm lead',
                'status' => 'active',
                'quadrant' => 'vocation',
                'color' => '#764ba2',
                'sort_order' => 2,
            ]
        );

        // Automation Agency Week 1 Tasks
        $automationTasks = [
            ['title' => 'Theresa Bastian discovery request sent', 'priority' => 'high', 'sort_order' => 1],
            ['title' => 'Discovery call scheduled for Friday', 'priority' => 'high', 'sort_order' => 2],
            ['title' => 'Pain points documented', 'priority' => 'medium', 'sort_order' => 3],
            ['title' => 'Soft close for follow-up completed', 'priority' => 'medium', 'sort_order' => 4],
        ];

        foreach ($automationTasks as $taskData) {
            Task::updateOrCreate(
                ['title' => $taskData['title'], 'project_id' => $automationAgency->id],
                [
                    'priority' => $taskData['priority'],
                    'sort_order' => $taskData['sort_order'],
                    'user_id' => $user->id,
                ]
            );
        }

        // 3. PERSONAL BRAND + GROWTH PROJECT
        $personalBrand = Project::updateOrCreate(
            ['name' => 'Personal Brand + Growth System', 'user_id' => $user->id],
            [
                'description' => 'Audience building: 2 tweets/day, weekly newsletter, Digital Economics course (Lessons 1-16 Week 1)',
                'status' => 'active',
                'quadrant' => 'vocation',
                'color' => '#F59E0B',
                'sort_order' => 3,
            ]
        );

        // Personal Brand Week 1 Tasks
        $brandTasks = [
            ['title' => 'Newsletter #1 published (Building the Hero Video)', 'priority' => 'high', 'sort_order' => 1],
            ['title' => '2 tweets/day system established (14 tweets total)', 'priority' => 'high', 'sort_order' => 2],
            ['title' => 'Digital Economics Lessons 1-4 completed', 'priority' => 'medium', 'sort_order' => 3],
            ['title' => 'Metrics tracking started (Substack, Twitter Analytics)', 'priority' => 'medium', 'sort_order' => 4],
            ['title' => 'Digital Economics Lessons 5-8 completed', 'priority' => 'medium', 'sort_order' => 5],
        ];

        foreach ($brandTasks as $taskData) {
            Task::updateOrCreate(
                ['title' => $taskData['title'], 'project_id' => $personalBrand->id],
                [
                    'priority' => $taskData['priority'],
                    'sort_order' => $taskData['sort_order'],
                    'user_id' => $user->id,
                ]
            );
        }

        echo "✓ Week 1 projects and tasks created successfully.\n";
        echo "  - DecoponATX\n";
        echo "  - Automation Agency\n";
        echo "  - Personal Brand + Growth System\n";
    }
}
