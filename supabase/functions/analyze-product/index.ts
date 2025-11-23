// Supabase Edge Function: analyze-product (Gemini Vision)
// Returns strict JSON: { description: string, category?: string, subcategory?: string, variants?: string[] }
// Secrets: GEMINI_API_KEY must be configured on the project.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Analysis = {
  description: string;
  category?: string;
  subcategory?: string;
  variants?: string[];
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!GEMINI_API_KEY) return j({ error: "Missing GEMINI_API_KEY" }, 500);
  if (req.method !== "POST") return j({ error: "Method not allowed" }, 405);

  try {
    const { productName, imageUrl } = (await req.json()) as {
      productName?: string;
      imageUrl?: string;
    };
    if (!productName || !imageUrl) return j({ error: "productName and imageUrl are required" }, 400);

    // Fetch the image and convert to base64 inlineData
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) return j({ error: `Image fetch failed: ${imgResp.status}` }, 400);
    const mime = imgResp.headers.get("content-type") ?? "image/jpeg";
    const buf = await imgResp.arrayBuffer();
    const base64 = ab2b64(buf);

    const prompt = [
      "You are a product catalog assistant.",
      "Analyze the provided product image and name, then output STRICT JSON only (no extra text).",
      "JSON shape: {\"description\": string, \"category\"?: string, \"subcategory\"?: string, \"variants\"?: string[]}.",
      "- description: 60-140 words, persuasive, concise, plain text.",
      "- category: a high-level group (e.g., 'Electronics', 'Fashion', 'Home Furniture & Appliances', 'Vehicles', 'Beauty & Personal Care', 'Services, Repair & Construction', 'Commercial Equipment & Tools', 'Art & Sports', 'Babies & Kids', 'Food', 'Agriculture & Farming', 'Real Estate & Rentals').",
      "- subcategory: a specific type under category (e.g., 'Mobile Phones', 'Laptops', 'Sofas', 'Hair Care', 'Power Tools').",
      "- variants: up to 6 short strings (e.g., colors/sizes/capacity).",
      `Product name: ${productName}`,
    ].join("\n");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mime, data: base64 } },
          ],
        },
      ],
    };

    // Basic retry for rate limits/network
    let r: Response | null = null;
    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      r = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) break;
      const status = r.status;
      const txt = await r.text();
      console.log(JSON.stringify({ level: 'warn', msg: 'gemini_call_failed', status, body: txt, attempt: attempts }));
      if (status === 429 || status >= 500) {
        await new Promise(res => setTimeout(res, attempts * 500));
        continue;
      }
      return j({ error: `Gemini error ${status}: ${txt}` }, 502);
    }
    if (!r || !r.ok) return j({ error: `Gemini error: failed after retries` }, 502);
    const data = (await r.json()) as any;
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return j({ error: "Gemini returned no text" }, 502);
    const clean = stripFences(text).trim();
    let parsed: Analysis | null = null;
    try {
      parsed = JSON.parse(clean) as Analysis;
    } catch (_e) {
      return j({ error: "Failed to parse AI JSON" }, 502);
    }
    if (!parsed?.description) return j({ error: "AI response missing description" }, 502);
    return j(parsed, 200);
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});

function j(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function ab2b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function stripFences(s: string): string {
  return s.replace(/^```[a-zA-Z]*\n?|```$/g, "");
}
