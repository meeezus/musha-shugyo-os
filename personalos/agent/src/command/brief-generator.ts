import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import {
  CommandBrief,
  StatusBrief,
  Recommendation,
  TimeAllocation,
  GoalAlignment,
  BriefGeneratorOptions,
  OuraContext,
} from './types';

// ============================================
// FILE PATHS
// ============================================

const HOME = process.env.HOME || '/Users/michaelenriquez';
const PERSONALOS_ROOT = path.join(HOME, 'PersonalOS');

const PATHS = {
  goals: path.join(PERSONALOS_ROOT, 'Memory', 'goals.md'),
  today: path.join(PERSONALOS_ROOT, 'Tasks', 'Daily', 'Today.md'),
  projectsActive: path.join(PERSONALOS_ROOT, 'Projects', 'Active'),
  observations: path.join(PERSONALOS_ROOT, 'Memory', 'observations.md'),
};

// ============================================
// FILE READERS
// ============================================

function safeReadFile(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    console.error(`[brief] Error reading ${filePath}:`, error);
  }
  return '';
}

function getProjectFiles(): { name: string; content: string }[] {
  const projects: { name: string; content: string }[] = [];

  try {
    if (fs.existsSync(PATHS.projectsActive)) {
      const entries = fs.readdirSync(PATHS.projectsActive, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = safeReadFile(path.join(PATHS.projectsActive, entry.name));
          projects.push({ name: entry.name.replace('.md', ''), content });
        } else if (entry.isDirectory()) {
          // Check for dashboard.md or README.md in subdirectory
          const subPath = path.join(PATHS.projectsActive, entry.name);
          const dashboardPath = path.join(subPath, 'dashboard.md');
          const readmePath = path.join(subPath, 'README.md');

          if (fs.existsSync(dashboardPath)) {
            projects.push({ name: entry.name, content: safeReadFile(dashboardPath) });
          } else if (fs.existsSync(readmePath)) {
            projects.push({ name: entry.name, content: safeReadFile(readmePath) });
          }
        }
      }
    }
  } catch (error) {
    console.error('[brief] Error reading projects:', error);
  }

  return projects;
}

// ============================================
// GOALS PARSER
// ============================================

interface ParsedGoals {
  priorities: string[];
  currentPhase: string;
  timeAllocation: TimeAllocation[];
  weeklyFocus: string[];
  successMetrics: GoalAlignment[];
}

function parseGoalsFile(content: string): ParsedGoals {
  const result: ParsedGoals = {
    priorities: [],
    currentPhase: '',
    timeAllocation: [],
    weeklyFocus: [],
    successMetrics: [],
  };

  if (!content) return result;

  // Extract priority order
  const priorityMatch = content.match(/## Priority Order\n([\s\S]*?)(?=\n##|$)/);
  if (priorityMatch) {
    const lines = priorityMatch[1].split('\n').filter(l => l.match(/^\d+\./));
    result.priorities = lines.map(l => l.replace(/^\d+\.\s*\*\*/, '').replace(/\*\*.*/, '').trim());
  }

  // Extract current phase/focus
  const immediateMatch = content.match(/## Immediate Focus[^#]*?\n([\s\S]*?)(?=\n##|$)/);
  if (immediateMatch) {
    const firstLine = immediateMatch[1].split('\n').find(l => l.trim().length > 0);
    if (firstLine) {
      result.currentPhase = firstLine.replace(/^###?\s*/, '').trim();
    }
  }

  // Extract time allocation from "Weekly Time Allocation" or "Energy Allocation Strategy"
  // Look for **Energy Allocation Strategy:** or plain text version
  const timeMatch = content.match(/\*\*Energy Allocation Strategy:\*\*\n([\s\S]*?)(?=\n---|\n##|\n\n\n|$)/i)
    || content.match(/(?:Weekly Time Allocation|Energy Allocation Strategy)[:\s]*\n([\s\S]*?)(?=\n---|\n##|\n\n\n|$)/i);
  if (timeMatch) {
    const lines = timeMatch[1].split('\n').filter(l => l.match(/^-\s*\*\*/));
    const colors = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];

    lines.forEach((line, idx) => {
      // Match patterns like "- **Project:** time (notes)" or "- **Project** time"
      const projectMatch = line.match(/\*\*([^*:]+):?\*\*[:\s]*([^(]+)/);
      if (projectMatch) {
        result.timeAllocation.push({
          project: projectMatch[1].trim(),
          targetHours: projectMatch[2].trim(),
          color: colors[idx % colors.length],
          priority: idx + 1,
        });
      }
    });
  }

  // Extract this week's focus
  const weekMatch = content.match(/### This Week[^#]*?\n([\s\S]*?)(?=\n###|$)/);
  if (weekMatch) {
    const tasks = weekMatch[1].match(/-\s*\*\*[^*]+\*\*/g);
    if (tasks) {
      result.weeklyFocus = tasks.map(t => t.replace(/-\s*\*\*/, '').replace(/\*\*/, '').trim());
    }
  }

  // Extract success metrics (checkboxes)
  const metricsMatch = content.match(/## Success Metrics\n([\s\S]*?)(?=\n## [^S]|$)/);
  if (metricsMatch) {
    const sections = metricsMatch[1].split(/\n### /);

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.split('\n');
      const categoryLine = lines[0];
      if (!categoryLine) continue;

      // Extract just the name part, removing "(90-Day Targets):" etc
      const categoryName = categoryLine.split('(')[0].replace(/[^a-zA-Z\s]/g, '').trim();
      if (!categoryName) continue;

      const checkboxes = section.match(/-\s*\[[ x]\]\s*.+/gi) || [];
      const total = checkboxes.length;
      const completed = checkboxes.filter(c => c.toLowerCase().includes('[x]')).length;

      if (total > 0) {
        result.successMetrics.push({
          name: categoryName,
          category: categorizeGoal(categoryName),
          progress: Math.round((completed / total) * 100),
          target: 100,
          trend: 'flat',
          weeklyDelta: 0,
          notes: `${completed}/${total} tasks complete`,
        });
      }
    }
  }

  return result;
}

function categorizeGoal(name: string): GoalAlignment['category'] {
  const lower = name.toLowerCase();
  if (lower.includes('revenue') || lower.includes('client') || lower.includes('decopon') || lower.includes('automation')) {
    return 'revenue';
  }
  if (lower.includes('content') || lower.includes('musha') || lower.includes('tweet') || lower.includes('newsletter')) {
    return 'content';
  }
  if (lower.includes('health') || lower.includes('recovery') || lower.includes('bjj') || lower.includes('training')) {
    return 'health';
  }
  if (lower.includes('digital') || lower.includes('learning') || lower.includes('course')) {
    return 'learning';
  }
  return 'other';
}

// ============================================
// TODAY PARSER
// ============================================

interface ParsedToday {
  title: string;
  tasks: { text: string; completed: boolean; priority: 'high' | 'medium' | 'low' }[];
  timeBlocks: { time: string; title: string }[];
}

function parseTodayFile(content: string): ParsedToday {
  const result: ParsedToday = {
    title: '',
    tasks: [],
    timeBlocks: [],
  };

  if (!content) return result;

  // Get title from first heading
  const titleMatch = content.match(/^#\s+(.+)/m);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  // Extract all tasks with checkboxes
  const taskMatches = content.matchAll(/-\s*\[([ x])\]\s*(.+)/gi);
  for (const match of taskMatches) {
    const completed = match[1].toLowerCase() === 'x';
    const text = match[2].trim();

    // Determine priority based on context
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (text.toLowerCase().includes('primary') || text.toLowerCase().includes('critical')) {
      priority = 'high';
    }

    result.tasks.push({ text, completed, priority });
  }

  // Extract time blocks (### HH:MM or ### Morning/Afternoon patterns)
  const blockMatches = content.matchAll(/###\s*(\d{1,2}:\d{2}[ap]?m?|\w+\s*Block)[:\s-]*(.+)?/gi);
  for (const match of blockMatches) {
    result.timeBlocks.push({
      time: match[1].trim(),
      title: match[2]?.trim() || 'Focus Block',
    });
  }

  return result;
}

// ============================================
// RECOMMENDATIONS GENERATOR
// ============================================

function generateRecommendations(
  goals: ParsedGoals,
  today: ParsedToday,
  oura?: OuraContext
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let id = 1;

  // Get incomplete high-priority tasks
  const incompleteTasks = today.tasks.filter(t => !t.completed);

  for (const task of incompleteTasks.slice(0, 3)) {
    let confidence = 70;
    let energyAware = false;

    // Boost confidence if aligned with goals
    if (goals.priorities.some(p => task.text.toLowerCase().includes(p.toLowerCase()))) {
      confidence += 15;
    }

    // Adjust based on energy level
    if (oura?.energyLevel === 'high') {
      confidence += 10;
      energyAware = true;
    } else if (oura?.energyLevel === 'low') {
      confidence -= 10;
      energyAware = true;
    }

    recommendations.push({
      id: id++,
      title: task.text,
      description: `From today's task list`,
      confidence: Math.min(99, Math.max(40, confidence)),
      priority: task.priority,
      energyAware,
      source: 'Today.md',
    });
  }

  // Add time-based recommendations from time allocation
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 12 && goals.timeAllocation.length > 0) {
    const morningProject = goals.timeAllocation[0];
    if (morningProject) {
      recommendations.push({
        id: id++,
        title: `Focus on ${morningProject.project}`,
        description: `Morning block - ${morningProject.targetHours}`,
        confidence: 85,
        priority: 'high',
        energyAware: false,
        timeBlock: '7:00am-12:00pm',
        source: 'goals.md',
      });
    }
  }

  // Energy-based recommendations
  if (oura?.energyLevel === 'low') {
    recommendations.push({
      id: id++,
      title: 'Prioritize recovery today',
      description: `Readiness at ${oura.readiness || 'unknown'} - focus on easy wins`,
      confidence: 90,
      priority: 'high',
      energyAware: true,
      source: 'Oura biometrics',
    });
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

// ============================================
// STATUS BRIEF GENERATOR (Static)
// ============================================

function generateStaticBrief(
  goals: ParsedGoals,
  today: ParsedToday,
  oura?: OuraContext
): StatusBrief {
  // Determine headline from current phase or first priority
  let headline = goals.currentPhase || goals.priorities[0] || 'COMMAND CENTER';
  headline = headline.toUpperCase().replace(/[^A-Z0-9\s]/g, '').substring(0, 30);

  // Build overview from context
  const parts: string[] = [];

  if (goals.priorities[0]) {
    parts.push(`Primary focus: ${goals.priorities[0]}.`);
  }

  const incompleteTasks = today.tasks.filter(t => !t.completed).length;
  if (incompleteTasks > 0) {
    parts.push(`${incompleteTasks} tasks remaining today.`);
  }

  if (oura?.energyLevel && oura.energyLevel !== 'unknown') {
    const energyText = oura.energyLevel === 'high' ? 'Peak energy' :
                       oura.energyLevel === 'medium' ? 'Moderate energy' : 'Low energy';
    parts.push(`${energyText} day.`);
  }

  // Generate directive
  let directive = 'EXECUTE';
  if (goals.priorities[0]?.toLowerCase().includes('revenue') ||
      goals.priorities[0]?.toLowerCase().includes('client')) {
    directive = 'REVENUE NOW';
  } else if (goals.priorities[0]?.toLowerCase().includes('health')) {
    directive = 'RECOVERY FIRST';
  } else if (oura?.energyLevel === 'low') {
    directive = 'CONSERVE ENERGY';
  }

  return {
    headline,
    overview: parts.join(' ') || 'Ready for action.',
    directive,
    phase: goals.currentPhase || 'Active',
    stale: false,
    aiGenerated: false,
  };
}

// ============================================
// PATTERNS DETECTOR
// ============================================

function detectPatterns(
  goals: ParsedGoals,
  today: ParsedToday,
  oura?: OuraContext
): string[] {
  const patterns: string[] = [];

  // Check for task completion rate
  const totalTasks = today.tasks.length;
  const completedTasks = today.tasks.filter(t => t.completed).length;
  if (totalTasks > 0) {
    const rate = Math.round((completedTasks / totalTasks) * 100);
    if (rate >= 80) {
      patterns.push('Strong execution today - most tasks complete');
    } else if (rate < 30 && totalTasks > 3) {
      patterns.push('Low task completion - consider reducing scope');
    }
  }

  // Energy patterns from Oura
  if (oura?.patterns) {
    patterns.push(...oura.patterns);
  }

  // Goal alignment check
  if (goals.successMetrics.length > 0) {
    const avgProgress = goals.successMetrics.reduce((sum, g) => sum + g.progress, 0) / goals.successMetrics.length;
    if (avgProgress < 30) {
      patterns.push('Goal progress below 30% - focus on high-impact tasks');
    } else if (avgProgress > 70) {
      patterns.push('Strong goal progress - maintain momentum');
    }
  }

  return patterns;
}

// ============================================
// MAIN GENERATOR
// ============================================

export function generateCommandBrief(options: BriefGeneratorOptions = {}): CommandBrief {
  const contextSources: string[] = [];

  // Read and parse context files
  const goalsContent = safeReadFile(PATHS.goals);
  if (goalsContent) contextSources.push('Memory/goals.md');

  const todayContent = safeReadFile(PATHS.today);
  if (todayContent) contextSources.push('Tasks/Daily/Today.md');

  const projects = getProjectFiles();
  projects.forEach(p => contextSources.push(`Projects/Active/${p.name}`));

  // Parse files
  const goals = parseGoalsFile(goalsContent);
  const today = parseTodayFile(todayContent);

  // Generate components
  const statusBrief = generateStaticBrief(goals, today, options.oura);
  const recommendations = generateRecommendations(goals, today, options.oura);
  const patterns = detectPatterns(goals, today, options.oura);

  return {
    statusBrief,
    recommendations,
    timeAllocation: goals.timeAllocation,
    goalAlignment: goals.successMetrics,
    patterns,
    contextSources,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// AI SYNTHESIS (On-demand only)
// ============================================

export async function generateAiBrief(
  staticBrief: CommandBrief,
  oura?: OuraContext
): Promise<StatusBrief> {
  // This will be called only on manual refresh
  // Import Claude utility dynamically to avoid loading if not needed
  const { callClaude } = await import('../utils/claude');

  const goalsContent = safeReadFile(PATHS.goals);
  const todayContent = safeReadFile(PATHS.today);

  const prompt = `You are generating a Command Center status brief for Michael's personal OS.

Current Context:
- Date: ${dayjs().format('dddd, MMMM D, YYYY')}
- Energy Level: ${oura?.energyLevel || 'unknown'} (Readiness: ${oura?.readiness || 'N/A'})
- Tasks remaining today: ${staticBrief.recommendations.length}

Goals Summary (truncated):
${goalsContent.substring(0, 2000)}

Today's Plan:
${todayContent.substring(0, 1000)}

Generate a JSON response with ONLY these fields:
{
  "headline": "SHORT PHRASE (max 25 chars, uppercase)",
  "overview": "2-3 compelling sentences about today's priorities and current state",
  "directive": "ACTION PHRASE (max 15 chars, like 'REVENUE NOW' or 'SHIP IT')"
}

Be direct, no fluff. Focus on what matters most today.`;

  try {
    const response = await callClaude(prompt, 'haiku');
    const parsed = JSON.parse(response);

    return {
      headline: parsed.headline || staticBrief.statusBrief.headline,
      overview: parsed.overview || staticBrief.statusBrief.overview,
      directive: parsed.directive || staticBrief.statusBrief.directive,
      phase: staticBrief.statusBrief.phase,
      stale: false,
      aiGenerated: true,
    };
  } catch (error) {
    console.error('[brief] AI generation failed, using static brief:', error);
    return staticBrief.statusBrief;
  }
}

// Test if run directly
if (require.main === module) {
  console.log('Testing brief-generator...\n');
  const brief = generateCommandBrief();
  console.log(JSON.stringify(brief, null, 2));
}
