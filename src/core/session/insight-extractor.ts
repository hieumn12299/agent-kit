import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ok, err, type Result } from '../../types/result.js';

const execFileAsync = promisify(execFile);

export interface Insight {
  summary: string;
  source: 'git-diff' | 'session';
}

/**
 * Extract insights from git diff since session start.
 * No LLM — uses heuristics on git diff stat + commit messages.
 */
export const extractInsights = async (
  root: string,
  startTime: string,
): Promise<Result<Insight[], Error>> => {
  try {
    const insights: Insight[] = [];

    // Validate startTime
    const startMs = new Date(startTime).getTime();
    if (isNaN(startMs)) {
      return ok([]); // Invalid startTime — no insights possible
    }
    try {
      const { stdout } = await execFileAsync(
        'git', ['log', '--oneline', `--since=${startTime}`, '--no-merges'],
        { cwd: root, encoding: 'utf-8', timeout: 5000 },
      );
      const commits = stdout.trim();

      if (commits) {
        for (const line of commits.split('\n')) {
          const msg = line.replace(/^[a-f0-9]+ /, '').trim();
          if (msg && msg.length > 3) {
            insights.push({ summary: msg, source: 'git-diff' });
          }
        }
      }
    } catch {
      // No git or no commits — that's fine
    }

    // Try to get diff stat for a summary insight
    try {
      let statOutput = '';
      try {
        const { stdout } = await execFileAsync(
          'git', ['diff', '--stat', 'HEAD~1'],
          { cwd: root, encoding: 'utf-8', timeout: 5000 },
        );
        statOutput = stdout.trim();
      } catch {
        const { stdout } = await execFileAsync(
          'git', ['diff', '--stat', '--cached'],
          { cwd: root, encoding: 'utf-8', timeout: 5000 },
        );
        statOutput = stdout.trim();
      }

      if (statOutput) {
        const lastLine = statOutput.split('\n').pop() ?? '';
        const filesMatch = lastLine.match(/(\d+) files? changed/);
        if (filesMatch) {
          insights.push({
            summary: `Changed ${filesMatch[1]} files this session`,
            source: 'git-diff',
          });
        }
      }
    } catch {
      // No diff available
    }

    // Session duration insight
    const durationMs = Date.now() - startMs;
    const mins = Math.max(0, Math.floor(durationMs / 60_000));
    if (mins > 0) {
      insights.push({
        summary: `Session lasted ${mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}`,
        source: 'session',
      });
    }

    return ok(insights);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

// ── AI-Enhanced Extraction ───────────────────────────────────────────

interface AIInsight {
  title: string;
  content: string;
  type: string;
  confidence: number;
}

const AI_SYSTEM_PROMPT = `You are a developer session analyzer. Given git commit messages and diff stats from a coding session, extract the most important insights.

Each insight should capture a decision, pattern, or learning from the session.

Respond ONLY with a JSON array (no markdown):
[{"title": "Short title", "content": "Detailed description", "type": "decision", "confidence": 0.9}]

Valid types: insight, decision, pattern, convention, bug-learning, integration, preference
Extract 1-5 insights. Focus on quality over quantity.`;

/**
 * AI-powered insight extraction — uses LLM to analyze session changes.
 * Falls back to heuristic extraction on any failure.
 */
export const extractInsightsWithAI = async (
  root: string,
  startTime: string,
): Promise<Result<Insight[], Error>> => {
  try {
    const { getAIProvider, isAIConfigured } = await import('../ai/ai-config.js');

    if (!(await isAIConfigured(root))) {
      return extractInsights(root, startTime);
    }

    const provider = await getAIProvider(root);
    const available = await provider.isAvailable();
    if (!available) {
      return extractInsights(root, startTime);
    }

    // Gather session context
    let commitMessages = '';
    try {
      const { stdout } = await execFileAsync(
        'git', ['log', '--oneline', `--since=${startTime}`, '--no-merges'],
        { cwd: root, encoding: 'utf-8', timeout: 5000 },
      );
      commitMessages = stdout.trim();
    } catch {
      // No git
    }

    let diffStat = '';
    try {
      const { stdout } = await execFileAsync(
        'git', ['diff', '--stat', 'HEAD~1'],
        { cwd: root, encoding: 'utf-8', timeout: 5000 },
      );
      diffStat = stdout.trim();
    } catch {
      // No diff
    }

    if (!commitMessages && !diffStat) {
      return extractInsights(root, startTime);
    }

    // Ask LLM
    const prompt = `Session commits:\n${commitMessages || 'No commits'}\n\nDiff stats:\n${diffStat || 'No diffs'}`;
    const result = await provider.complete(prompt, {
      system: AI_SYSTEM_PROMPT,
      maxTokens: 500,
      temperature: 0.3,
    });

    if (!result.text) {
      return extractInsights(root, startTime);
    }

    // Parse AI insights
    const aiInsights = parseAIInsights(result.text);
    if (aiInsights.length === 0) {
      return extractInsights(root, startTime);
    }

    // Convert to Insight format
    const insights: Insight[] = aiInsights.map(ai => ({
      summary: `${ai.title}: ${ai.content}`,
      source: 'git-diff' as const,
    }));

    return ok(insights);
  } catch {
    return extractInsights(root, startTime);
  }
};

const parseAIInsights = (text: string): AIInsight[] => {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as AIInsight[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(i => i.title && i.content).slice(0, 5);
  } catch {
    return [];
  }
};
