import { config } from "../config.js";

// Free-tier DeepL keys end in ":fx" and only work against api-free.deepl.com
// (not api.deepl.com) — a common setup mistake, called out in .env.example.
const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

interface DeepLResponse {
  translations: { text: string; detected_source_language: string }[];
}

export async function translateBatch(texts: string[]): Promise<Map<string, string>> {
  if (texts.length === 0) return new Map();
  if (texts.length > 50) {
    throw new Error(`translateBatch: batch of ${texts.length} exceeds DeepL's 50-text/request limit`);
  }

  const body = new URLSearchParams();
  body.set("target_lang", "EN");
  for (const text of texts) body.append("text", text);

  const res = await fetch(DEEPL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `DeepL-Auth-Key ${config.deeplApiKey}`,
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`DeepL API error: HTTP ${res.status} ${detail}`);
  }

  const data = (await res.json()) as DeepLResponse;
  const result = new Map<string, string>();
  data.translations.forEach((t, i) => result.set(texts[i], t.text));
  return result;
}
