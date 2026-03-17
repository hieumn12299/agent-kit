/**
 * AI Provider types — unified interface for embeddings and completions.
 * All AI features are opt-in and config-gated.
 */

// ── Provider Interface ───────────────────────────────────────────────

export interface AIProvider {
  readonly name: string;

  /** Generate embedding vector for text. */
  embed(text: string): Promise<EmbeddingResult>;

  /** Generate text completion from prompt. */
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;

  /** Check if provider is available and configured. */
  isAvailable(): Promise<boolean>;
}

// ── Results ──────────────────────────────────────────────────────────

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  /** Tokens used (if reported by provider). */
  tokensUsed?: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  tokensUsed?: number;
}

export interface CompletionOptions {
  /** Max tokens in response. Default: 500. */
  maxTokens?: number;
  /** Temperature (0-1). Default: 0.3. */
  temperature?: number;
  /** System prompt. */
  system?: string;
}

// ── Config ───────────────────────────────────────────────────────────

export type AIProviderName = 'ollama' | 'openai' | 'none';

export interface AIConfig {
  provider: AIProviderName;
  /** Model for embeddings. */
  embeddingModel: string;
  /** Model for completions. */
  completionModel: string;
  /** Base URL override (e.g., Ollama at custom port). */
  baseUrl?: string;
  /** API key (for OpenAI). */
  apiKey?: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'none',
  embeddingModel: 'nomic-embed-text',
  completionModel: 'llama3.2',
  baseUrl: undefined,
  apiKey: undefined,
};

export const OLLAMA_DEFAULTS: Partial<AIConfig> = {
  provider: 'ollama',
  embeddingModel: 'nomic-embed-text',
  completionModel: 'llama3.2',
  baseUrl: 'http://localhost:11434',
};

export const OPENAI_DEFAULTS: Partial<AIConfig> = {
  provider: 'openai',
  embeddingModel: 'text-embedding-3-small',
  completionModel: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com',
};
