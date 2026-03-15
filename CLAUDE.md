# CLAUDE.md — Ella

## Product Vision

**Ella** is a LinkedIn content engine that uses ML to discover what makes posts go viral in any industry, then generates optimized drafts backed by real-time fact validation.

Named after an African Grey Parrot — she learns your industry's language and speaks it back better.

### User Flow

1. **Screenshot** → User screenshots a high-performing LinkedIn post from their industry
2. **Extract** → Claude Vision reads the screenshot: post text, author, engagement numbers, media type
3. **Store** → Post data saved to their personal database (Supabase)
4. **Analyze** → ML pipeline runs on their accumulated posts, discovering engagement patterns specific to their niche
5. **Generate** → AI agent drafts a new post using those patterns + user's brand voice
6. **Validate (Paid)** → Tavily + Perplexity APIs fact-check claims, inject real-time data, and enrich the draft with current context

### Business Model

- **Free tier**: Screenshot capture, ML analysis, basic post generation
- **Paid tier**: Real-time fact validation via Tavily/Perplexity, enriched drafts with current data, larger post database

## Architecture

```
ella/
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Router + auth wrapper
│   ├── lib/
│   │   ├── supabase.js           # Supabase client init
│   │   ├── api.js                # Anthropic API wrapper (Vision + text)
│   │   ├── tavily.js             # Tavily search API client
│   │   └── perplexity.js         # Perplexity API client
│   ├── utils/
│   │   ├── nlp.js                # Tokenization, TF-IDF, n-grams, Pearson correlation
│   │   ├── features.js           # 25+ structural/content feature extraction
│   │   ├── pipeline.js           # Core ML pipeline + formatInsightsForPrompt()
│   │   ├── prompts.js            # AI agent system prompt templates
│   │   └── vision-prompts.js     # Claude Vision extraction prompts
│   ├── hooks/
│   │   ├── useAuth.js            # Supabase auth hook
│   │   ├── usePosts.js           # CRUD operations for post database
│   │   └── useMLAnalysis.js      # ML pipeline hook with caching
│   ├── components/
│   │   ├── Layout.jsx            # App shell with nav
│   │   ├── ScreenshotUpload.jsx  # Drop zone + camera/paste, sends to Vision
│   │   ├── PostReview.jsx        # Review/edit extracted data before saving
│   │   ├── PostDatabase.jsx      # Grid/list of captured posts with search/filter
│   │   ├── AnalysisDashboard.jsx # ML results: correlations, terms, hooks, CTAs
│   │   ├── GeneratePanel.jsx     # Tone select, context input, agent pipeline
│   │   ├── DraftOutput.jsx       # Final drafts with copy/edit
│   │   ├── ValidationBadge.jsx   # Paid tier: fact-check status indicators
│   │   ├── Charts.jsx            # D3 bar chart + correlation bars
│   │   ├── AgentCard.jsx         # Agent status/progress display
│   │   ├── AuthForm.jsx          # Login/signup
│   │   └── PricingGate.jsx       # Paywall component for paid features
│   ├── pages/
│   │   ├── Dashboard.jsx         # Main app page (capture + database + analysis)
│   │   ├── Generate.jsx          # Post generation page
│   │   ├── Settings.jsx          # User profile, industry, brand voice, API keys
│   │   └── Landing.jsx           # Marketing landing page
│   └── styles/
│       └── globals.css           # Base styles, CSS variables, fonts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Tables: profiles, posts, ml_results, drafts
├── public/
├── scripts/
│   └── setup.sh                  # Local setup script
├── package.json
├── vite.config.js
├── .env.example
└── index.html
```

## Tech Stack

- **Frontend**: React 18 + Vite + D3.js
- **Auth & Database**: Supabase (Postgres + Auth + Storage)
- **Screenshot Processing**: Anthropic Claude Vision API (claude-sonnet-4-20250514)
- **ML Pipeline**: Client-side NLP (TF-IDF, Pearson correlation, feature extraction)
- **Content Generation**: Anthropic Claude API (claude-sonnet-4-20250514) with web search
- **Fact Validation (Paid)**: Tavily Search API + Perplexity API
- **Routing**: React Router v6

## Key Development Commands

```bash
npm install
npm run dev          # Start dev server on :3000
npm run build        # Production build
```

## Database Schema (Supabase)

### profiles
- `id` UUID (FK → auth.users.id)
- `display_name` TEXT
- `industry` TEXT — user's industry (e.g., "SaaS", "Healthcare", "CPG Food & Bev")
- `brand_voice` TEXT — description of their writing style/brand
- `product_name` TEXT — optional product to subtly mention in drafts
- `product_description` TEXT
- `tier` TEXT — 'free' or 'paid'
- `created_at` TIMESTAMPTZ

### posts
- `id` UUID (PK)
- `user_id` UUID (FK → profiles.id)
- `post_text` TEXT (required)
- `author_name` TEXT
- `author_title` TEXT
- `date_posted` DATE
- `likes` INT
- `comments_count` INT
- `shares` INT
- `impressions` INT
- `comment_texts` TEXT — pipe-delimited
- `hashtags` TEXT
- `has_image` BOOLEAN
- `has_video` BOOLEAN
- `has_carousel` BOOLEAN
- `category` TEXT
- `screenshot_url` TEXT — Supabase Storage path
- `industry` TEXT — auto-filled from user profile
- `created_at` TIMESTAMPTZ

### ml_results
- `id` UUID (PK)
- `user_id` UUID (FK)
- `results_json` JSONB — full ML pipeline output
- `post_count` INT — how many posts were analyzed
- `created_at` TIMESTAMPTZ

### drafts
- `id` UUID (PK)
- `user_id` UUID (FK)
- `draft_text` TEXT
- `tone` TEXT
- `ml_result_id` UUID (FK → ml_results.id)
- `validated` BOOLEAN — whether Tavily/Perplexity ran
- `validation_notes` TEXT
- `created_at` TIMESTAMPTZ

## Screenshot → Post Extraction Flow

1. User uploads screenshot (drag-drop, paste, or file picker)
2. Image sent to Claude Vision (claude-sonnet-4-20250514) with structured extraction prompt
3. Claude returns JSON: `{ post_text, author_name, author_title, likes, comments_count, shares, hashtags, has_image, has_video, has_carousel }`
4. User reviews extracted data in `PostReview.jsx` — can edit any field, toggle fields on/off
5. On confirm, screenshot uploaded to Supabase Storage, post record created in `posts` table

### Vision Prompt Strategy

The extraction prompt in `vision-prompts.js` asks Claude to:
- Extract the full post text verbatim
- Parse engagement numbers (handling "1.2K", "847", etc.)
- Identify the author name and title/headline
- Detect media type (image, video, carousel, text-only)
- Extract visible hashtags
- Return as clean JSON

Edge cases to handle: partial screenshots, cropped engagement bars, "see more" truncated text, multiple posts in one screenshot.

## ML Pipeline (same as previous version, industry-agnostic now)

The pipeline in `utils/pipeline.js` is industry-agnostic — it works on whatever posts the user feeds it. Features extracted:

**Structural**: word count, line count, sentence count, avg words per line, short paragraph ratio, whitespace ratio
**Engagement hooks**: hook type classification (bold claim, story, question, number, other), first line length
**CTAs**: last line question detection, CTA keyword detection
**Content signals**: questions, exclamations, emojis, hashtags, mentions, numbers used, URLs, list format, personal pronouns
**NLP**: TF-IDF differential (top 20% vs bottom 20%), bigram analysis, comment theme extraction

## AI Agent Pipeline

### Agent 1: Topic Scout
- Uses Anthropic web search tool to find trending topics in the user's industry
- Informed by ML patterns (what vocabulary/topics drive engagement)
- Returns 3-5 topic ideas with "comment bait" angles

### Agent 2: Draft Writer
- Takes ML patterns + trending topics + user's brand voice
- Generates 2 draft options
- Applies optimal structure (word count, hook type, CTA type) from ML data
- Weaves in user's product mention if configured

### Agent 3: Fact Validator (Paid Tier Only)
- Takes the draft text
- Tavily API: searches for claims, stats, quotes in the draft → returns source URLs
- Perplexity API: cross-references and provides additional context
- Returns validation report: which claims check out, which need revision, suggested corrections
- Enriches draft with current data points (latest stats, recent events)

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ANTHROPIC_API_KEY=         # For Vision + generation (needs proxy for CORS)
VITE_TAVILY_API_KEY=            # Paid tier
VITE_PERPLEXITY_API_KEY=        # Paid tier
```

**Important**: Anthropic API doesn't support browser CORS. For production, you need either:
1. A Supabase Edge Function as proxy (recommended)
2. A lightweight Express/Cloudflare Worker proxy
3. Run inside Claude.ai artifacts (no key needed, CORS handled)

## Priority Build Order

1. ✅ Supabase schema + auth
2. ✅ Screenshot upload + Claude Vision extraction
3. ✅ Post review + database CRUD
4. ✅ ML pipeline integration
5. ✅ Agent pipeline (Topic Scout + Draft Writer)
6. ✅ Tavily/Perplexity validation (paid tier)
7. Landing page + pricing
8. Supabase Edge Function proxy for API calls
9. Stripe integration for paid tier
10. Polish: animations, onboarding flow, mobile responsive

## Code Style

- Functional React components with hooks
- ES modules
- Tailwind CSS for styling (migration from inline styles)
- No TypeScript yet (candidate for future migration)
- Supabase client in `lib/supabase.js`, accessed through custom hooks
