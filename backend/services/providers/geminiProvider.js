/**
 * Google Gemini Provider (Free Tier via Google AI Studio REST API).
 * Uses Node.js built-in fetch (Node 18+) to avoid heavy SDK dependencies.
 */

async function generateWithGemini({ prompt, systemInstruction, apiKey, model = 'gemini-2.5-flash', maxOutputTokens = 700, temperature = 0.4 }) {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const err = new Error('GEMINI_API_KEY is not configured.');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMsg = data?.error?.message || `Gemini API returned HTTP ${response.status}`;
      const err = new Error(apiMsg);
      err.status = response.status;
      err.code = response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_ERROR';
      throw err;
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('\n')
      .trim();

    if (!text) {
      const err = new Error('Gemini API returned an empty response.');
      err.code = 'AI_EMPTY_RESPONSE';
      throw err;
    }

    return {
      text,
      provider: 'gemini',
      model
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { generateWithGemini };
