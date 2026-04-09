/* ═══════════════════════════════════════════════════════════
   ANTHROPIC API CLIENT
   Routes through Supabase Edge Function proxy only.
   API keys live in edge function secrets, never in the browser.
   ═══════════════════════════════════════════════════════════ */

import { supabase } from "./supabase";

const MODEL = "claude-sonnet-4-6-20250514";

function getEndpoint() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL not configured");
  return `${supabaseUrl}/functions/v1/claude-proxy`;
}

async function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) headers["apikey"] = anonKey;
  return headers;
}

export async function callClaude(systemPrompt, userMessage, { useWebSearch = false, model = null, isGeneration = false } = {}) {
  const url = getEndpoint();
  const body = {
    model: model || MODEL, max_tokens: model === "claude-opus-4-6" ? 4000 : 1500, system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  };
  if (useWebSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const headers = await getHeaders();
  if (isGeneration) headers["x-generation-request"] = "true";
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  // Strip citation tags and other HTML/XML markup from web search responses
  return text.replace(/<[^>]*>/g, "").trim();
}

// Get server-side generation count for the current month
export async function getGenerationCount() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("generation_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());
  if (error) return 0;
  return count || 0;
}

export async function extractFromScreenshot(base64Image, mediaType = "image/png") {
  const url = getEndpoint();
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
  const res = await fetch(url, { method: "POST", headers: await getHeaders(), body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Vision API error");
  const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text.replace(/```json\s?|```/g, "").trim());
}
