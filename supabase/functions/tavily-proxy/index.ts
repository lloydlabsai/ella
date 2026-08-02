// supabase/functions/tavily-proxy/index.ts
// Proxies requests to Tavily API. Paid tier only.
// Deploy: supabase functions deploy tavily-proxy --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TAVILY_URL = "https://api.tavily.com/search";
const TAVILY_KEY = Deno.env.get("TAVILY_API_KEY");

// Origins allowed to call this function. Self-hosters should set their own:
//   supabase secrets set ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
// When ALLOWED_ORIGINS is set it replaces these defaults entirely. Any localhost
// port is always allowed, so `npm run dev` works whatever port Vite picks.
const CONFIGURED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const DEFAULT_ORIGINS = [
  "https://getella.io",
  "https://www.getella.io",
  "https://ella-beryl.vercel.app",
];

const ALLOWED_ORIGINS = CONFIGURED_ORIGINS.length ? CONFIGURED_ORIGINS : DEFAULT_ORIGINS;

const isLocalDev = (origin: string) =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin =
    ALLOWED_ORIGINS.includes(origin) || isLocalDev(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify auth and check paid tier
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();

    if (profile?.tier !== "paid") {
      return new Response(JSON.stringify({ error: "Paid tier required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    body.api_key = TAVILY_KEY;

    const response = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
