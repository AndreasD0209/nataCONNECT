import { PI_URL } from './pi';

export interface NataAIConfig {
  provider?: 'fireworks' | 'custom';
  endpoint?: string;
  apiKey?: string;
  model?: string;
}

const DEFAULT_FIREWORKS_ENDPOINT = 'https://api.fireworks.ai/inference/v1';
const DEFAULT_FIREWORKS_MODEL = 'llama-v3p3-70b-instruct';

export function loadNataAIConfig(): NataAIConfig {
  try {
    return JSON.parse(window.localStorage.getItem('nataAIConfig') || '{}') as NataAIConfig;
  } catch {
    return {};
  }
}

export async function askNataGuide(messages: any[], systemPrompt: string) {
  const config = JSON.parse(localStorage.getItem('nataAIConfig') || '{}');
  const provider = config.provider === 'custom' ? 'custom' : 'fireworks';

  const res = await fetch(`${PI_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      messages,
      systemPrompt,
      model: config.model || DEFAULT_FIREWORKS_MODEL,
      apiKey: config.apiKey,
      endpoint: config.endpoint || DEFAULT_FIREWORKS_ENDPOINT,
    }),
  });

  const data = await res.json();
  if (data.success) return data.content;
  throw new Error(data.error || 'AI request failed');
}
