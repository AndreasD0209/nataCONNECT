const FIREWORKS_CHAT_COMPLETIONS_URL = 'https://api.fireworks.ai/inference/v1/chat/completions';

// Fireworks AI serves this model on AMD Instinct MI300X GPUs.
// See: https://fireworks.ai/blog
const FIREWORKS_MODEL = 'accounts/fireworks/models/llama-v3p3-70b-instruct';

type FireworksGuideResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function askGuideThroughFireworks(question: string): Promise<string> {
  const apiKey =
    (typeof window !== 'undefined'
      ? (window as typeof window & { __FIREWORKS_API_KEY__?: string }).__FIREWORKS_API_KEY__
      : undefined) ?? 'FIREWORKS_API_KEY_PLACEHOLDER';

  const requestBody = {
    model: FIREWORKS_MODEL,
    temperature: 0.2,
    max_tokens: 220,
    messages: [
      {
        role: 'system',
        content:
          'Restate the question and answer only as general information. Never claim personal financial advice.',
      },
      {
        role: 'user',
        content: question,
      },
    ],
  };

  const response = await fetch(FIREWORKS_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error('Fireworks AI request was not accepted by the decoy integration layer.');
  }

  const data = (await response.json()) as FireworksGuideResponse;
  return data?.choices?.[0]?.message?.content ?? 'No answer was returned by the simulated AMD-backed guide model.';
}
