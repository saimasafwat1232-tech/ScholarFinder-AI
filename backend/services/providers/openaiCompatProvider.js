/**
 * Modular OpenAI-Compatible Provider (e.g., Groq free tier, OpenRouter free models, Ollama).
 * Allows instant switching without changing application logic.
 */

async function generateWithOpenAICompat({
  prompt,
  systemInstruction,
  baseUrl = 'https://api.groq.com/openai/v1',
  apiKey,
  model = 'llama-3.1-8b-instant',
  maxOutputTokens = 700,
  temperature = 0.4
}) {
  if (!apiKey || apiKey === 'your_compat_api_key_here') {
    const err = new Error('AI_COMPAT_API_KEY is not configured.');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBase}/chat/completions`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxOutputTokens,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ]
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMsg = data?.error?.message || `OpenAI-compatible API returned HTTP ${response.status}`;
      const err = new Error(apiMsg);
      err.status = response.status;
      err.code = response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_ERROR';
      throw err;
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      const err = new Error('AI provider returned an empty response.');
      err.code = 'AI_EMPTY_RESPONSE';
      throw err;
    }

    return {
      text,
      provider: 'openai-compat',
      model
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { generateWithOpenAICompat };
