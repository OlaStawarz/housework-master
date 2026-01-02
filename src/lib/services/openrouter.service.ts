import { z } from 'zod';

export interface Message {
  role: 'system' | 'user';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export class OpenRouterError extends Error {
  constructor(
    public code: 'API_KEY_MISSING' | 'NETWORK_ERROR' | 'API_ERROR' | 'INVALID_JSON',
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly siteUrl: string;
  public readonly defaultModel: string;

  constructor() {
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.siteUrl = import.meta.env.PUBLIC_SITE_URL;
    // Domyślny model, np. darmowy lub tani, można zmienić w przyszłości lub przenieść do env
    this.defaultModel = 'nvidia/nemotron-3-nano-30b-a3b:free';

    if (!this.apiKey) {
      throw new OpenRouterError(
        'API_KEY_MISSING',
        'OpenRouter API key is missing in environment variables.'
      );
    }
  }

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.siteUrl) {
      headers['HTTP-Referer'] = this.siteUrl;
      headers['X-Title'] = 'Housework Master';
    }

    return headers;
  }

  private async performRequest(payload: unknown): Promise<any> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `OpenRouter API error: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error && errorBody.error.message) {
            errorMessage = errorBody.error.message;
          }
        } catch (e) {
          // Ignoruj błędy parsowania jsona błędu
        }
        
        throw new OpenRouterError('API_ERROR', errorMessage, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new OpenRouterError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Unknown network error'
      );
    }
  }

  public async getChatCompletion(
    messages: Message[],
    options?: CompletionOptions
  ): Promise<string> {
    const payload = {
      model: options?.model || this.defaultModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens,
      top_p: options?.top_p,
    };

    const data = await this.performRequest(payload);

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new OpenRouterError('API_ERROR', 'Invalid response format from OpenRouter');
    }

    return data.choices[0].message.content;
  }

  public async getStructuredCompletion<T>(
    messages: Message[],
    schema: z.ZodType<T>,
    options?: CompletionOptions
  ): Promise<T> {
    const payload = {
      model: options?.model || this.defaultModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens,
      top_p: options?.top_p,
      response_format: { type: 'json_object' },
    };

    const data = await this.performRequest(payload);

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new OpenRouterError('API_ERROR', 'Invalid response format from OpenRouter');
    }

    const content = data.choices[0].message.content;

    try {
      const json = JSON.parse(content);
      return schema.parse(json);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new OpenRouterError(
          'INVALID_JSON',
          'Failed to parse JSON response: ' + content
        );
      }
      if (error instanceof z.ZodError) {
        throw new OpenRouterError(
          'INVALID_JSON',
          'Response validation failed: ' + error.message
        );
      }
      throw error;
    }
  }
}

