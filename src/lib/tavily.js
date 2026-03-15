/* ═══════════════════════════════════════════════════════════
   TAVILY SEARCH API — Paid Tier Fact Validation
   Searches the web for claims in a draft post
   ═══════════════════════════════════════════════════════════ */

import { supabase } from "./supabase";

function getEndpoint() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) return `${supabaseUrl}/functions/v1/tavily-proxy`;
  return "https://api.tavily.com/search";
}

export async function searchClaims(query, { maxResults = 5 } = {}) {
  const url = getEndpoint();
  const isProxy = url.includes("functions/v1");

  const headers = { "Content-Type": "application/json" };
  if (isProxy) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (anonKey) headers["apikey"] = anonKey;
  }

  const body = { query, search_depth: "advanced", max_results: maxResults, include_answer: true, include_raw_content: false };
  if (!isProxy) {
    const key = import.meta.env.VITE_TAVILY_API_KEY;
    if (!key) throw new Error("Tavily API key not configured");
    body.api_key = key;
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Tavily API error: ${res.status}`);
  return res.json();
}

export async function validateDraft(draftText) {
  // Extract claims that contain numbers, stats, or factual assertions
  const sentences = draftText.split(/[.!?\n]+/).filter((s) => s.trim().length > 20);
  const factualSentences = sentences.filter(
    (s) => /\d/.test(s) || /according|study|research|report|data|survey|found|shows/i.test(s)
  );

  if (!factualSentences.length) {
    return { validated: true, claims: [], summary: "No factual claims detected to validate." };
  }

  const results = [];
  for (const claim of factualSentences.slice(0, 5)) {
    try {
      const search = await searchClaims(claim.trim(), { maxResults: 3 });
      results.push({
        claim: claim.trim(),
        answer: search.answer || null,
        sources: (search.results || []).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 200),
          score: r.score,
        })),
        supported: search.results?.some((r) => r.score > 0.7) || false,
      });
    } catch (err) {
      results.push({ claim: claim.trim(), error: err.message, supported: false, sources: [] });
    }
  }

  const supportedCount = results.filter((r) => r.supported).length;
  return {
    validated: true,
    claims: results,
    summary: `${supportedCount}/${results.length} claims verified with sources.`,
    score: results.length ? Math.round((supportedCount / results.length) * 100) : 100,
  };
}
