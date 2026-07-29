# Ella — Deployment Guide

## Prerequisites

- Node.js 18+
- Supabase CLI (`npm install -g supabase`)
- GitHub account
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
- Tavily API key ([app.tavily.com](https://app.tavily.com)) — paid tier only
- Perplexity API key ([docs.perplexity.ai](https://docs.perplexity.ai)) — paid tier only

## Step 1: Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon/public key** from Settings → API
3. Run the migrations:
   - Go to SQL Editor in the Supabase dashboard
   - Run every file in `supabase/migrations/` in numerical order, from
     `001_initial_schema.sql` through `008_add_generation_tracking.sql`
   - Running only 001 will leave you missing columns the app expects

   All tables have row-level security enabled with owner-scoped policies, so
   each user can only read and write their own rows.

## Step 2: Deploy Edge Functions

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets (API keys stored server-side, never in browser)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
supabase secrets set TAVILY_API_KEY=tvly-your-key        # optional
supabase secrets set PERPLEXITY_API_KEY=pplx-your-key    # optional

# Deploy all three proxy functions
supabase functions deploy claude-proxy --no-verify-jwt
supabase functions deploy tavily-proxy --no-verify-jwt
supabase functions deploy perplexity-proxy --no-verify-jwt
```

The `--no-verify-jwt` flag is needed because the functions handle their own auth verification internally.

## Step 3: Environment Variables

```bash
cp .env.example .env
```

Fill in:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You do NOT need `VITE_ANTHROPIC_API_KEY` etc. in production — the edge functions handle all API keys server-side.

## Step 4: Deploy Frontend

### Vercel (recommended)
```bash
npm install -g vercel
vercel
```
Set environment variables in the Vercel dashboard.

### Netlify
```bash
npm run build
# Deploy dist/ folder
```

### Manual
```bash
npm run build
# Upload dist/ to any static host
```

## Step 5: Enable Auth

In Supabase dashboard → Authentication → Settings:
- Enable Email/Password sign-ups
- Set your site URL (e.g., `https://ella.yourdomain.com`)
- Add redirect URLs for your deployment

## Architecture: How API Calls Flow

```
Browser → Supabase Edge Function → External API
  (with Supabase JWT)  (with API key from secrets)
```

1. User's browser calls the edge function URL (e.g., `your-project.supabase.co/functions/v1/claude-proxy`)
2. Edge function verifies the Supabase auth token
3. Edge function adds the real API key (stored as a Supabase secret)
4. Edge function forwards the request to Anthropic/Tavily/Perplexity
5. Response flows back through

API keys never touch the browser. CORS is handled by the edge function headers.

## Upgrading Users to Paid Tier

Currently manual via Supabase dashboard:
```sql
UPDATE profiles SET tier = 'paid' WHERE id = 'user-uuid';
```

For production, integrate Stripe webhooks to automatically update the tier column.
