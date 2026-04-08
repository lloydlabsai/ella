// supabase/functions/claude-proxy/index.ts
// Proxies requests to Anthropic API, solving browser CORS issues.
// Includes server-side rate limiting for generation requests.
// Deploy: supabase functions deploy claude-proxy --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-generation-request",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Free tier: 3 generations/month. Paid: 50.
const FREE_LIMIT = 3;
const PAID_LIMIT = 50;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated via Supabase JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract user from JWT
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Check if this is a generation request (Opus draft calls)
    // The client sends x-generation-request: true header for draft generations
    const isGenerationRequest = req.headers.get("x-generation-request") === "true";

    if (isGenerationRequest) {
      // Get user's tier
      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .single();

      const tier = profile?.tier || "free";
      const limit = tier === "paid" ? PAID_LIMIT : FREE_LIMIT;

      // Count generations this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from("generation_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if (countError) {
        console.error("Rate limit check failed:", countError.message);
        // Don't block on rate limit errors — fail open
      } else if ((count || 0) >= limit) {
        return new Response(JSON.stringify({
          error: { message: `You've used all ${limit} generations this month. ${tier === "free" ? "Upgrade to Pro for more." : "Limit resets next month."}` }
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Enforce model allowlist and max_tokens limits
    const ALLOWED_MODELS = ["claude-sonnet-4-20250514", "claude-sonnet-4-6-20250514", "claude-opus-4-6"];
    if (!ALLOWED_MODELS.includes(body.model)) {
      body.model = "claude-sonnet-4-6-20250514";
    }
    body.max_tokens = Math.min(body.max_tokens || 1500, 8000);

    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Log the generation after successful API call
    if (isGenerationRequest && response.ok) {
      await supabase
        .from("generation_log")
        .insert({ user_id: user.id });
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
