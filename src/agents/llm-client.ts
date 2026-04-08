import { useSettingsStore } from '../store';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter' | null;
}

export interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
}

const DEFAULT_PROXY_URL = 'http://localhost:8765';

export class LLMClient {
  private baseUrl: string;
  private apiKey: string;
  private proxyUrl: string;
  private model: string;
  private defaultConfig: Required<LLMConfig>;

  constructor(baseUrl: string, apiKey: string, model: string, config: LLMConfig = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.proxyUrl = DEFAULT_PROXY_URL;
    this.model = model;
    this.defaultConfig = {
      model: model,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      topP: config.topP ?? 1,
      frequencyPenalty: config.frequencyPenalty ?? 0,
      presencePenalty: config.presencePenalty ?? 0,
      stream: config.stream ?? false,
    };
  }

  static fromSettings(): LLMClient {
    const provider = useSettingsStore.getState().getActiveProvider();
    const selectedModel = useSettingsStore.getState().getActiveModel();
    const temperature = useSettingsStore.getState().temperature;

    if (!provider || !selectedModel) {
      throw new Error('No provider or model configured');
    }

    const modelId: string = selectedModel.id ?? 'gpt-4o';
    return new LLMClient(provider.baseUrl, provider.apiKey || '', modelId, { temperature });
  }

  async complete(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const mergedConfig = { ...this.defaultConfig, ...config };

    try {
      const response = await fetch(`${this.proxyUrl}/api/proxy/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: this.baseUrl,
          apiKey: this.apiKey,
          model: mergedConfig.model,
          messages,
          temperature: mergedConfig.temperature,
          maxTokens: mergedConfig.maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`LLM API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('LLM complete error:', error);
      throw error;
    }
  }

  private parseResponse(data: unknown): LLMResponse {
    const isAnthropic = this.baseUrl.includes('anthropic');

    if (isAnthropic) {
      const anthropicData = data as {
        content?: Array<{ text: string }>;
        usage?: { input_tokens: number; output_tokens: number };
        stop_reason?: string;
        model?: string;
      };
      return {
        content: anthropicData.content?.[0]?.text || '',
        model: anthropicData.model || this.model,
        usage: {
          promptTokens: anthropicData.usage?.input_tokens || 0,
          completionTokens: anthropicData.usage?.output_tokens || 0,
          totalTokens: (anthropicData.usage?.input_tokens || 0) + (anthropicData.usage?.output_tokens || 0),
        },
        finishReason: anthropicData.stop_reason as LLMResponse['finishReason'],
      };
    }

    const openAIData = data as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      model?: string;
      finish_reason?: string;
    };
    return {
      content: openAIData.choices?.[0]?.message?.content || '',
      model: openAIData.model || this.model,
      usage: {
        promptTokens: openAIData.usage?.prompt_tokens ?? 0,
        completionTokens: openAIData.usage?.completion_tokens ?? 0,
        totalTokens: openAIData.usage?.total_tokens ?? 0,
      },
      finishReason: openAIData.finish_reason as LLMResponse['finishReason'],
    };
  }

  async *streamComplete(messages: LLMMessage[], config?: Partial<LLMConfig>): AsyncGenerator<string, void, unknown> {
    const mergedConfig = { ...this.defaultConfig, ...config, stream: true };

    const response = await fetch(`${this.proxyUrl}/api/proxy/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        baseUrl: this.baseUrl,
        apiKey: this.apiKey,
        model: mergedConfig.model,
        messages,
        temperature: mergedConfig.temperature,
        maxTokens: mergedConfig.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

export const createLLMClient = (
  baseUrl?: string,
  apiKey?: string,
  model?: string,
  config?: LLMConfig
): LLMClient => {
  const provider = useSettingsStore.getState().getActiveProvider();
  const selectedModel = useSettingsStore.getState().getActiveModel();

  return new LLMClient(
    baseUrl || provider?.baseUrl || 'https://api.openai.com/v1',
    apiKey || provider?.apiKey || '',
    (model || selectedModel?.id) ?? 'gpt-4o',
    config
  );
};
