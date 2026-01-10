import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
// Direct API (uses ANTHROPIC_API_KEY)
import { chat as directApiChat } from './anthropic-direct';
// Subscription mode (uses Claude Pro via CLI --print)
import { chat as subscriptionChat } from './claude-subscription';
// Command brief generator
import { generateCommandBrief, generateAiBrief } from '../command/brief-generator';
import { CommandBrief, OuraContext } from '../command/types';

// ============================================
// SERVER SETUP
// ============================================

const app = express();
const PORT = process.env.JOTARO_PORT || 3002;

// Engine modes:
// - 'api': Direct Anthropic API (uses ANTHROPIC_API_KEY, charges credits)
// - 'subscription': Claude CLI --print mode (uses Pro/Max subscription)
// Default to subscription to use Pro subscription
const ENGINE = process.env.IORI_ENGINE || 'subscription';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and text files
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`));
    }
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============================================
// BRIEF CACHE
// ============================================

interface BriefCache {
  brief: CommandBrief;
  cachedAt: number;
}

let briefCache: BriefCache | null = null;
const BRIEF_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function isBriefCacheValid(): boolean {
  if (!briefCache) return false;
  return Date.now() - briefCache.cachedAt < BRIEF_CACHE_TTL;
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'iori',
    engine: ENGINE,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// COMMAND BRIEF ENDPOINT
// ============================================

app.get('/command/brief', async (req: Request, res: Response) => {
  try {
    const refresh = req.query.refresh === 'true';
    const aiRefresh = req.query.ai === 'true';

    // Parse Oura context from query params if provided
    const oura: OuraContext | undefined = req.query.energyLevel ? {
      energyLevel: req.query.energyLevel as OuraContext['energyLevel'],
      readiness: req.query.readiness ? parseInt(req.query.readiness as string) : null,
      sleep: req.query.sleep ? parseInt(req.query.sleep as string) : null,
      activity: req.query.activity ? parseInt(req.query.activity as string) : null,
      patterns: [],
    } : undefined;

    // Check cache unless refresh requested
    if (!refresh && !aiRefresh && isBriefCacheValid() && briefCache) {
      console.log('[command] Returning cached brief');
      return res.json({
        ...briefCache.brief,
        cached: true,
        cacheAge: Math.round((Date.now() - briefCache.cachedAt) / 1000),
      });
    }

    console.log(`[command] Generating brief (refresh=${refresh}, ai=${aiRefresh})`);

    // Generate static brief
    let brief = generateCommandBrief({ oura });

    // If AI refresh requested, enhance the status brief
    if (aiRefresh) {
      console.log('[command] Generating AI-enhanced brief...');
      try {
        const aiBrief = await generateAiBrief(brief, oura);
        brief = {
          ...brief,
          statusBrief: aiBrief,
        };
      } catch (error) {
        console.error('[command] AI brief generation failed:', error);
        // Continue with static brief
      }
    }

    // Update cache
    briefCache = {
      brief,
      cachedAt: Date.now(),
    };

    // Mark as stale if older than 30 minutes
    const staleThreshold = 30 * 60 * 1000;
    brief.statusBrief.stale = false; // Fresh generation

    return res.json({
      ...brief,
      cached: false,
    });
  } catch (error) {
    console.error('[command] Error generating brief:', error);
    return res.status(500).json({
      error: 'Failed to generate command brief',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// CHAT ENDPOINT
// ============================================

app.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, context, model, mode, session_id, image, images } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const hasImage = image && image.data && image.media_type;
    const imageCount = images?.length || (hasImage ? 1 : 0);
    const ioriMode = mode || 'default';
    console.log(`[iori] Received message: "${message.substring(0, 50)}..."${imageCount > 0 ? ` [${imageCount} image(s)]` : ''} (engine: ${ENGINE}, mode: ${ioriMode})`);

    const chatRequest = {
      message,
      history: history || [],
      context: context || {
        goals: [],
        tasks: [],
        contacts: [],
        user_name: 'Michael',
      },
      model,
      mode: ioriMode,
      session_id,
      image: hasImage ? {
        data: image.data,
        media_type: image.media_type,
      } : undefined,
      images: images || undefined,
    };

    // Retry logic for transient failures
    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Use subscription or API based on ENGINE setting
        const result = ENGINE === 'subscription'
          ? await subscriptionChat(chatRequest)
          : await directApiChat(chatRequest);

        console.log(`[iori] Response generated (${result.response.length} chars, ${result.actions.length} actions)`);

        return res.json(result);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[iori] Attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);

        if (attempt < MAX_RETRIES) {
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // All retries failed
    console.error('[iori] All retries exhausted');
    return res.status(500).json({
      error: 'Failed to process chat request after retries',
      details: lastError?.message || 'Unknown error',
    });
  } catch (error) {
    console.error('[iori] Error processing chat:', error);
    return res.status(500).json({
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// START SERVER
// ============================================

export function startIoriServer(): void {
  app.listen(PORT, () => {
    console.log(`\n🏯 Iori server running on http://localhost:${PORT}`);
    console.log(`   POST /chat - Send a message`);
    console.log(`   GET /command/brief - Get command center brief`);
    console.log(`   GET /health - Health check\n`);
  });
}

// Keep old name for backwards compatibility
export const startJotaroServer = startIoriServer;

// Run if executed directly
if (require.main === module) {
  startIoriServer();
}

export default app;
