import type {
  AIProvider,
  AIConfig,
  EmbeddingResult,
  CompletionResult,
  CompletionOptions,
} from './ai-types.js';
import { OLLAMA_DEFAULTS, OPENAI_DEFAULTS } from './ai-types.js';

// ── NoopProvider ─────────────────────────────────────────────────────

/**
 * NoopProvider — graceful degradation when no AI is configured.
 * Returns empty results, never throws.
 */
export class NoopProvider implements AIProvider {
  readonly name = 'none';

  async embed(): Promise<EmbeddingResult> {
    return { embedding: [], model: 'none' };
  }

  async complete(): Promise<CompletionResult> {
    return { text: '', model: 'none' };
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always "available" (just does nothing)
  }
}

// ── OllamaProvider ───────────────────────────────────────────────────

/**
 * OllamaProvider — local LLM via Ollama (OpenAI-compatible API).
 * Default provider. Free, private, no API key.
 */
export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  private baseUrl: string;
  private embeddingModel: string;
  private completionModel: string;

  constructor(config: Partial<AIConfig> = {}) {
    this.baseUrl = config.baseUrl ?? OLLAMA_DEFAULTS.baseUrl!;
    this.embeddingModel = config.embeddingModel ?? OLLAMA_DEFAULTS.embeddingModel!;
    this.completionModel = config.completionModel ?? OLLAMA_DEFAULTS.completionModel!;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const res = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.embeddingModel, input: text }),
    });

    if (!res.ok) {
      throw new Error(`Ollama embed failed (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as { embeddings: number[][] };
    return {
      embedding: data.embeddings[0] ?? [],
      model: this.embeddingModel,
    };
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.completionModel,
        prompt,
        system: options?.system,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.3,
          num_predict: options?.maxTokens ?? 500,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama generate failed (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as { response: string };
    return {
      text: data.response ?? '',
      model: this.completionModel,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ── OpenAIProvider ───────────────────────────────────────────────────

/**
 * OpenAIProvider — cloud LLM via OpenAI-compatible API.
 * Requires API key.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private baseUrl: string;
  private embeddingModel: string;
  private completionModel: string;
  private apiKey: string;

  constructor(config: Partial<AIConfig> = {}) {
    this.baseUrl = config.baseUrl ?? OPENAI_DEFAULTS.baseUrl!;
    this.embeddingModel = config.embeddingModel ?? OPENAI_DEFAULTS.embeddingModel!;
    this.completionModel = config.completionModel ?? OPENAI_DEFAULTS.completionModel!;
    this.apiKey = config.apiKey ?? '';
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const res = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.embeddingModel, input: text }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI embed failed (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      data: Array<{ embedding: number[] }>;
      usage?: { total_tokens: number };
    };
    return {
      embedding: data.data[0]?.embedding ?? [],
      model: this.embeddingModel,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    const messages: Array<{ role: string; content: string }> = [];
    if (options?.system) {
      messages.push({ role: 'system', content: options.system });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.completionModel,
        messages,
        max_tokens: options?.maxTokens ?? 500,
        temperature: options?.temperature ?? 0.3,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI complete failed (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { total_tokens: number };
    };
    return {
      text: data.choices[0]?.message?.content ?? '',
      model: this.completionModel,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}

// ── Factory ──────────────────────────────────────────────────────────

/**
 * Create an AI provider from config.
 */
export const createProvider = (config: AIConfig): AIProvider => {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'none':
    default:
      return new NoopProvider();
  }
};
