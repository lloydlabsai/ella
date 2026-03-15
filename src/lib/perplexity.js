/* ═══════════════════════════════════════════════════════════
   PERPLEXITY API — Paid Tier Context Enrichment
   Provides real-time context and data to enrich drafts
   ═══════════════════════════════════════════════════════════ */

import { supabase } from "./supabase";

function getEndpoint() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) return `${supabaseUrl}/functions/v1/perplexity-proxy`;
  return "https://api.perplexity.ai/chat/completions";
}

export async function enrichWithContext(draftText, industry) {
  const url = getEndpoint();
  const isProxy = url.includes("functions/v1");

  const headers = { "Content-Type": "application/json" };
  if (isProxy) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (anonKey) headers["apikey"] = anonKey;
  } else {
    const key = import.meta.env.VITE_PERPLEXITY_API_KEY;
    if (!key) throw new Error("Perplexity API key not configured");
    headers["Authorization"] = `Bearer ${key}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `You are a fact-checker and context enricher for LinkedIn posts in the ${industry} industry. Given a draft post, identify any claims that could use current data, provide the latest relevant statistics or news, and suggest specific improvements with real numbers. Be concise. Return plain text.`,
        },
        {
          role: "user",
          content: `Review this LinkedIn draft and enrich it with current, verified data points:\n\n${draftText}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Perplexity API error: ${res.status}`);
  const data = await res.json();
  return {
    enrichment: data.choices?.[0]?.message?.content || "",
    citations: data.citations || [],
  };
}
