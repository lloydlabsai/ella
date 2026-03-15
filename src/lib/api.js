/* ═══════════════════════════════════════════════════════════
   ANTHROPIC API CLIENT
   Routes through Supabase Edge Function proxy for CORS.
   Falls back to direct API if VITE_ANTHROPIC_API_KEY is set.
   ═══════════════════════════════════════════════════════════ */

import { supabase } from "./supabase";

const DIRECT_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

function getEndpoint() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const directKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (supabaseUrl) return { url: `${supabaseUrl}/functions/v1/claude-proxy`, mode: "proxy" };
  return { url: DIRECT_URL, mode: directKey ? "direct" : "direct" };
}

async function getHeaders(mode) {
  const headers = { "Content-Type": "application/json" };
  if (mode === "proxy") {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (anonKey) headers["apikey"] = anonKey;
  } else {
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (key) { headers["x-api-key"] = key; headers["anthropic-version"] = "2023-06-01"; }
  }
  return headers;
}

export async function callClaude(systemPrompt, userMessage, { useWebSearch = false } = {}) {
  const { url, mode } = getEndpoint();
  const body = {
    model: MODEL, max_tokens: 1500, system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  };
  if (useWebSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await fetch(url, { method: "POST", headers: await getHeaders(mode), body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

export async function extractFromScreenshot(base64Image, mediaType = "image/png") {
  const { url, mode } = getEndpoint();
  const body = {
    model: MODEL, max_tokens: 1500,
    system: `You extract LinkedIn post data from screenshots. Return ONLY valid JSON, no markdown fences, no preamble. Extract every visible field. For engagement numbers, parse "1.2K" as 1200, "5M" as 5000000, etc. If a field is not visible, use null.

Return this exact JSON structure:
{
  "post_text": "full post text verbatim, including line breaks",
  "author_name": "name or null",
  "author_title": "headline/title or null",
  "likes": number or 0,
  "comments_count": number or 0,
  "shares": number or 0,
  "hashtags": "comma separated or empty string",
  "has_image": true/false,
  "has_video": true/false,
  "has_carousel": true/false,
  "comment_texts": "visible comments separated by | or empty string"
}`,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
        { type: "text", text: "Extract all LinkedIn post data from this screenshot. Return ONLY the JSON object." },
      ],
    }],
  };
  const res = await fetch(url, { method: "POST", headers: await getHeaders(mode), body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Vision API error");
  const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text.replace(/```json\s?|```/g, "").trim());
}
