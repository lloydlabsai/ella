<div align="center">

<img src="public/ella-logo.png" alt="Ella" width="120" />

# Ella

**Ella learns what makes LinkedIn posts perform in your industry, then writes you one.**

[![License: MIT](https://img.shields.io/badge/License-MIT-E8664A.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/React_18-Vite-2D2520.svg)](#stack)
[![Backend](https://img.shields.io/badge/Supabase-Postgres-3ECF8E.svg)](https://supabase.com)

Free and open source. Self-host it, bring your own API keys, own your data.

</div>

---

## What it does

1. **Capture** - grab a high-performing LinkedIn post, by screenshot or with the bundled Chrome extension
2. **Extract** - Claude Vision reads it into structured data: text, engagement counts, format signals
3. **Store** - lands in your own Supabase database, scoped to your account by row-level security
4. **Analyze** - a client-side ML pipeline finds which features actually correlate with engagement in *your* captured set
5. **Generate** - Claude drafts new posts using your discovered patterns plus your brand voice
6. **Validate** *(optional)* - Tavily and Perplexity fact-check claims and inject current data

The point is that the patterns are yours. Ella does not ship a generic "viral formula", it derives one from the posts you decide are worth learning from.

---

## Get it running

You need Node 18+, a free [Supabase](https://supabase.com) project, and an [Anthropic API key](https://console.anthropic.com). Tavily and Perplexity keys are optional and only power the validation step.

### 1. Clone and install

```bash
git clone https://github.com/lloydlabsai/ella.git
cd ella
npm install
```

### 2. Create the database

In your Supabase project, open the **SQL Editor** and run every file in `supabase/migrations/` in numerical order, starting with `001_initial_schema.sql` through `008_add_generation_tracking.sql`.

This creates the tables, enables row-level security on all of them, and sets up the screenshots storage bucket. Every table is owner-scoped, so users only ever read their own rows.

### 3. Configure the frontend

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Supabase → Project Settings → API**.

### 4. Deploy the edge functions

These hold your API keys server-side so they never reach the browser.

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
supabase secrets set TAVILY_API_KEY=tvly-your-key        # optional
supabase secrets set PERPLEXITY_API_KEY=pplx-your-key    # optional

supabase functions deploy claude-proxy --no-verify-jwt
supabase functions deploy tavily-proxy --no-verify-jwt
supabase functions deploy perplexity-proxy --no-verify-jwt
```

`--no-verify-jwt` is correct here: the functions verify the Supabase auth token themselves.

### 5. Turn on email auth

**Supabase → Authentication → Settings**: enable email/password sign-ups and set your site URL.

### 6. Run it

```bash
npm run dev
```

Sign up, set your industry in **Settings**, then start capturing posts. The ML analysis needs at least 5 posts before it will run, and gets meaningfully better past 20.

---

## Chrome extension

One-click capture straight from your LinkedIn feed, instead of screenshotting by hand.

1. Edit `chrome-extension/config.js` and set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the same values you put in `.env`. Extensions cannot read `.env` files, so this one is configured separately.
2. Go to `chrome://extensions` and enable **Developer mode**
3. **Load unpacked**, select the `chrome-extension/` folder
4. Log in through the extension popup with your Ella account
5. Browse LinkedIn. A capture button appears on every post.

It reads post data straight from the page DOM, which is fast and costs nothing. If LinkedIn changes their markup and extraction fails, it falls back to sending a screenshot to Claude Vision.

---

## Generation limits

Self-hosted installs are **unlimited by default**, because you are paying for your own Anthropic usage.

If you deploy Ella as a hosted service and want to meter users, set the caps in both places:

```bash
# Frontend (.env)
VITE_FREE_GENERATION_LIMIT=3
VITE_PAID_GENERATION_LIMIT=50

# Server-side enforcement
supabase secrets set FREE_GENERATION_LIMIT=3
supabase secrets set PAID_GENERATION_LIMIT=50
```

`0` or unset means unlimited. To move an account to the paid tier:

```sql
UPDATE profiles SET tier = 'paid' WHERE id = 'user-uuid';
```

---

## Bulk import

Already have posts in a spreadsheet or JSON? Import them in one shot:

```bash
node scripts/import-posts.cjs you@example.com yourpassword path/to/posts.json
```

Only the `text` field is required per post. The file header documents the full accepted shape. There is also a CSV importer built into the web app.

---

## Stack

- **Frontend** - React 18, Vite, D3.js, React Router
- **Database and auth** - Supabase (Postgres, Auth, Storage), RLS on every table
- **Vision and generation** - Anthropic Claude
- **ML** - client-side NLP: TF-IDF, Pearson correlation, feature extraction
- **Validation** *(optional)* - Tavily Search, Perplexity

Everything ML runs in the browser. Your post data never goes anywhere except your own Supabase project and the model APIs you configured.

---

## Project structure

```
├── src/
│   ├── App.jsx              # Router + auth wrapper
│   ├── lib/                 # API clients (Supabase, Anthropic, Tavily, Perplexity)
│   ├── utils/               # ML pipeline, NLP, prompts
│   ├── hooks/               # useAuth, usePosts, useMLAnalysis
│   ├── components/          # UI components
│   └── pages/               # Capture, Database, Analyze, Generate, Score, Settings
├── chrome-extension/        # Manifest V3 extension
│   ├── config.js            # <- set your Supabase URL + anon key here
│   ├── content.js           # LinkedIn DOM extraction + button injection
│   ├── background.js        # Screenshot capture + Supabase communication
│   └── popup.html/js/css    # Login + capture dashboard
├── supabase/
│   ├── migrations/          # Database schema, run these in order
│   └── functions/           # Edge function proxies that hold your API keys
├── scripts/import-posts.cjs # Bulk import from JSON
└── docs/DEPLOYMENT.md       # Full deployment guide
```

---

## Deploying

`docs/DEPLOYMENT.md` covers Vercel, Netlify, and static hosting, plus how the proxy architecture keeps API keys out of the browser.

## Claude Code

`CLAUDE.md` carries full project context. Open the repo and run `claude` to get an assistant that already understands the architecture, ML pipeline, and agent system.

## License

MIT. See [LICENSE](LICENSE). Do what you like with it.
