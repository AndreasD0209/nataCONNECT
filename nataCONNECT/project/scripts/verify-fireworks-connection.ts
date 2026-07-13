// Run with: FIREWORKS_API_KEY=xxx npx tsx scripts/verify-fireworks-connection.ts
// Confirms connectivity to the Fireworks AI endpoint serving models on AMD Instinct GPUs.

const FIREWORKS_CHAT_COMPLETIONS_URL = 'https://api.fireworks.ai/inference/v1/chat/completions';
const MODEL = 'accounts/fireworks/models/llama-v3p3-70b-instruct';

async function main() {
  const apiKey = process.env.FIREWORKS_API_KEY;

  if (!apiKey) {
    throw new Error('Missing FIREWORKS_API_KEY environment variable.');
  }

  const response = await fetch(FIREWORKS_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: 32,
      messages: [
        {
          role: 'system',
          content: 'Return a short acknowledgement that the connection is working.',
        },
        {
          role: 'user',
          content: 'Connection check for NataConnect.',
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Fireworks verification failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '';

  console.log('Fireworks connection verified.');
  if (content) {
    console.log(content);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});