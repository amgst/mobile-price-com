const TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";

function getCredentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  return { accountId, apiToken };
}

export function isCloudflareAIAvailable(): boolean {
  const { accountId, apiToken } = getCredentials();
  return !!accountId && !!apiToken;
}

async function runModel(model: string, input: Record<string, unknown>): Promise<any> {
  const { accountId, apiToken } = getCredentials();
  if (!accountId || !apiToken) {
    throw new Error("Cloudflare Workers AI is not configured (missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN)");
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudflare Workers AI request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data: any = await res.json();
  if (!data.success) {
    throw new Error(`Cloudflare Workers AI error: ${JSON.stringify(data.errors)}`);
  }
  return data.result;
}

export async function generateText(systemPrompt: string, userPrompt: string, maxTokens: number = 512): Promise<string> {
  const result = await runModel(TEXT_MODEL, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
  });

  // Cloudflare's OpenAI-compatible endpoint auto-parses `response` into an object when the
  // model's output looks like JSON, so the raw text must come from choices[0].message.content.
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  const response = result?.response;
  if (typeof response === "string") {
    return response.trim();
  }
  if (response && typeof response === "object") {
    return JSON.stringify(response);
  }

  return "";
}

const VISION_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";

export async function describeImage(prompt: string, imageBase64: string, maxTokens: number = 512): Promise<string> {
  const bytes = Array.from(Buffer.from(imageBase64, "base64"));
  const result = await runModel(VISION_MODEL, {
    image: bytes,
    prompt,
    max_tokens: maxTokens,
  });

  const description = result?.description ?? result?.response;
  if (typeof description === "string" && description.trim()) {
    return description.trim();
  }
  throw new Error("Cloudflare Workers AI returned no image description");
}

export async function generateImage(prompt: string): Promise<{ buffer: Buffer; contentType: string }> {
  const result = await runModel(IMAGE_MODEL, { prompt });
  const b64 = result?.image;
  if (!b64) {
    throw new Error("Cloudflare Workers AI returned no image data");
  }
  return { buffer: Buffer.from(b64, "base64"), contentType: "image/jpeg" };
}
