import { PI_URL } from './pi';

export interface NataAIConfig {
  provider?: 'anthropic' | 'openai' | 'ollama' | 'custom';
  endpoint?: string;
  apiKey?: string;
  model?: string;
}

export function loadNataAIConfig(): NataAIConfig {
  try {
    return JSON.parse(window.localStorage.getItem('nataAIConfig') || '{}') as NataAIConfig;
  } catch {
    return {};
  }
}

export async function askNataGuide(messages: any[], systemPrompt: string) {
  const config = JSON.parse(localStorage.getItem('nataAIConfig') || '{}');

  const res = await fetch(`${PI_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: config.provider || 'anthropic',
      messages,
      systemPrompt,
      model: config.model || 'claude-sonnet-4-6',
      apiKey: config.apiKey,
      endpoint: config.endpoint,
    }),
  });

  const data = await res.json();
  if (data.success) return data.content;
  throw new Error(data.error || 'AI request failed');
}
