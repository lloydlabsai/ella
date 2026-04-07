# CLAUDE.md — Ella

## Product Vision

**Ella** is a LinkedIn content engine that uses ML to discover what makes posts go viral in any industry, then generates optimized drafts backed by real-time fact validation.

Named after an African Grey Parrot — she learns your industry's language and speaks it back better.

### Instant Value Philosophy

ML is a flywheel that makes Ella better over time, NOT a gate that blocks value. Users get value on first click. Every feature tier delivers incrementally better output, but the base experience is already good.

| Posts | What Ella Uses |
|-------|---------------|
| 0 | Profile + industry knowledge + algorithm rules + voice engineering |
| 1-19 | Above + early patterns from captured posts |
| 20-49 | Above + full ML (vocabulary, correlations, bigrams, comment themes) |
| 50+ | Above + statistically significant patterns + reaction analysis |

### User Flow

1. **Generate** → User generates a post immediately using profile + algorithm intelligence (works with 0 captures)
2. **Score** → User pastes any draft for instant free analysis (hooks, structure, CTAs, algorithm optimization)
3. **Capture** → User captures high-performing LinkedIn posts via Chrome extension or screenshot upload
4. **Analyze** → ML pipeline discovers engagement patterns as captures accumulate
5. **Generate (enhanced)** → Drafts get increasingly personalized and data-backed as ML improves
6. **Validate (Paid)** → Tavily + Perplexity APIs fact-check claims and inject real-time data

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
├── chrome-extension/
│   ├── manifest.json             # Manifest V3 config + permissions
│   ├── content.js                # LinkedIn DOM extraction + button injection
│   ├── content.css               # Injected button + toast styles
│   ├── background.js             # Service worker: tab capture, Supabase REST, Vision fallback
│   ├── popup.html                # Extension popup shell
│   ├── popup.js                  # Popup auth + dashboard logic
│   ├── popup.css                 # Popup styles
│   └── icons/                    # Extension icons (16/48/128px PNGs)
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

## ML Pipeline V2

The pipeline in `utils/pipeline.js` (schema_version: 2) is industry-agnostic and uses the full data the Chrome extension captures.

### Engagement Scoring (`calculateEngagementScore`)

Multi-dimensional scoring exported from pipeline.js:
- **Base**: reactions × 1 + comments × 4 + shares × 3
- **Comment quality multiplier**: avg comment word count > 15 → 1.5x, < 5 → 0.7x (deep comments > shallow "great post!")
- **Reaction quality multiplier** (experimental): insightful/love dominant → 1.3x, celebrate/support → 1.15x, funny-only → 0.9x
- **Audience-normalized rate**: reserved for when follower count data is available (engagement_score / followers × 1000)

### Feature Extraction (`utils/features.js`)

40+ features across 7 categories:

**Structural**: char_count, word_count, line_count, sentence_count, paragraph_count, avg_words_per_line, short_para_ratio, longest/shortest paragraph words, paragraph_variance, reading_time_seconds
**Hook**: hook_word_count, hook_char_count, hook_under_fold (≤210 chars), hook_has_number/question/colon, hook_is_bold_claim/story/question/number, hook_sentiment (-1/0/1)
**CTA**: cta_word_count, cta_is_question, cta_is_open_ended (what/how/why), cta_tags_someone, cta_invites_disagreement
**Content signals**: questions, exclamations, emojis, emoji_density, hashtags, hashtag_at_end, mentions, numbers_used, urls, has_external_link, has_linkedin_link, personal_pronouns
**Formatting**: uses_bullet_points, uses_numbered_list, uses_line_breaks, caps_word_count
**Media**: is_image, is_video, is_carousel, is_text_only (binary columns, set from post metadata)
**NLP**: TF-IDF differential (top 20% vs bottom 80%), bigram analysis, comment theme extraction with depth comparison

### Progressive Analysis Tiers

| Posts | Tier | Confidence | What Runs |
|-------|------|-----------|-----------|
| 5+    | Early | 15% | Basic stats, media type performance |
| 10+   | Basic | 30% | + Hook analysis (types, depth, sentiment, fold), optimal ranges |
| 15+   | Intermediate | 50% | + CTA analysis (open-ended vs yes/no, disagreement), formatting impact, hashtag analysis |
| 20+   | Full | 65-75% | + TF-IDF vocabulary, bigrams, feature correlations, content depth, comment themes with depth comparison |
| 50+   | Significant | 90% | + Per-hashtag performance, reaction type patterns (30+ posts with data required) |
| 100+  | Master | 100% | Full confidence badge |

### Analysis Modules (20+ posts tier, the "wow" moment)

- **Media performance**: avg engagement by type (text_only, image, video, carousel)
- **Hook depth**: char count correlation, under/over fold comparison, sentiment performance (negative/contrarian hooks vs positive)
- **CTA depth**: open-ended vs yes/no vs disagreement-inviting, CTA length correlation
- **Formatting impact**: bullets vs prose vs numbered lists, emoji density sweet spot, paragraph variance correlation, ALL CAPS usage
- **Content depth**: reading time correlation (dwell time proxy), external link penalty
- **Hashtag analysis**: count correlation, position (end vs scattered), per-hashtag performance for tags used 3+ times
- **Comment depth**: avg comment word count on top 20% vs bottom 80%, separate comment theme extraction for viral posts
- **Reaction patterns** (50+): which content features correlate with insightful/love/celebrate reactions, do insightful-dominant posts get more comments

### NLP Stop Words

`nlp.js` has an expanded stop word list including LinkedIn-specific filler ("excited", "thrilled", "amazing", "incredible") and hashtag stripping during tokenization to prevent hashtag text from polluting TF-IDF results.

### ML Results Caching

Results include `schema_version: 2` so the UI can detect stale cached results. The Analyze page handles missing/null sections gracefully for backwards compatibility with older cached results.

### Generation Rate Limits

Client-side rate limiting in `Generate.jsx` (stored in localStorage):
- **Free tier**: 10 generations per day
- **Paid tier**: 50 generations per day
- Resets at midnight local time
- Server-side enforcement is a future task

## Instant-Value Features

### Post Scorer (`src/pages/Score.jsx`)
Paste any draft and get an instant scorecard — free, no API calls, runs entirely client-side via `extractFeatures()`:
- Hook analysis (type, length, fold visibility)
- Structure analysis (word count, reading time, paragraphs, emoji density)
- CTA analysis (question type, open-ended vs yes/no, disagreement inviting)
- Algorithm optimization (hashtag count, external links, engagement bait detection)
- Overall score 0-100 with color-coded gauge
- If ML results available: comparison against personal patterns
- "Optimize" button sends draft + score to Claude for a rewrite (1 API call)

### Guided Creation Workspace (`src/pages/Generate.jsx` — the home page)

The Generate page is a collaborative workspace, not a form-to-output pipeline. All sections live on one scrollable page, collapsible/expandable, and nothing locks — the user can jump between sections at any time.

**Philosophy**: The user's creative process is non-linear. They absorb everything, dismiss variables, circle back, connect dots across unrelated factors. The workspace accommodates this. The user's insight is the centerpiece — Ella structures and polishes their thinking, not replaces it.

**Section 1: Spark** — Three ways in:
- Ella's Picks: Sonnet + web search returns 6 topic cards (~$0.02)
- Your Spark: free text input
- From Captures: recent high-engagement captures as inspiration

**Section 2: Landscape** — Auto-researches when topic is set (Sonnet + web search, ~$0.02). Returns structured data:
- Key Facts as toggleable pills (user turns off what doesn't matter)
- Angles as selectable cards (user picks their framing)
- Stakeholders as audience chips
- "What about...?" input adds new research threads (~$0.01 each)

**Section 3: Your Take** — Open text area with prompt pills. This is the human insight Ella can't generate. Even 1-2 sentences works.

**Section 4: Draft** — Opus generates ONE draft (~$0.25) using selected facts, angles, audience, and the user's take as the thesis. Output as editable paragraph blocks with per-block controls:
- Edit (inline), Sharpen (Sonnet, ~$0.01), Remove, Reorder, Insert between blocks

**Section 5: Visual Direction** — Client-side, zero API cost. Analyzes the draft content type (data-rich, framework, hot take, story, list, news reaction) and recommends visual approaches as selectable cards (data viz, bold stat graphic, carousel, bold text on color, authentic photo, text only). Selecting a direction generates a copyable visual brief for Canva/Figma. Includes best practices and ML media performance data when available. Future: Canva API integration to auto-generate graphics from the brief.

**Section 6: Final Check** — Auto-scores the draft (free, client-side extractFeatures), shows hashtag toggles, visual readiness indicator (selected direction or "add one?" prompt), LinkedIn image dimensions reference, character count, copy button.

### Navigation Order
Create (home) → Score → Capture → Database → Analyze → Settings.

## AI Agent Pipeline

### Model Strategy

- **Claude Sonnet** (`claude-sonnet-4-20250514`): Used for Vision extraction, Topic Scout (web search), Score optimization, and all utility tasks. Optimized for speed and cost.
- **Claude Opus** (`claude-opus-4-6`): Used ONLY for Draft Writer. Voice quality is the product — Opus produces distinctly better creative output with more natural sentence variation, fewer AI tells, and stronger opinions. Worth the cost premium for the user-facing output.

The `claude-proxy` edge function allows both models. The `callClaude()` function in `src/lib/api.js` accepts an optional `model` parameter.

### Agent 1: Topic Scout (Sonnet)
- Uses Anthropic web search tool to find trending topics in the user's industry
- Demands specific data points, company names, and numbers — not vague trend summaries
- Returns 3-5 topic ideas with "comment bait" angles

### Agent 2: Draft Writer (Opus)
- Takes patterns + trending topics + user's profile + brand voice
- Generates 2 drafts with genuinely different angles and stylistic fingerprints
- Applies optimal structure from ML data when available, algorithm rules always
- Extensive anti-AI-tell rules: bans em dash overuse, parallel threes, "landscape/navigate/robust", sentence fragment drama, and 20+ other AI writing patterns
- Each draft must read like a different human wrote it

### LinkedIn Algorithm Intelligence

The generation pipeline incorporates real LinkedIn algorithm signals (2025-2026) from `src/utils/linkedin-algorithm.js`. This data is injected into both the Topic Scout and Draft Writer prompts:

- **Topic Scout**: Favors topics that invite substantive debate and 15+ word comment responses, not just "great post!" reactions
- **Draft Writer**: Structures posts for algorithmic reach — hook in first 210 characters (before "see more" fold), 1200-1900 character optimal length, ending with questions that prompt long comments, no engagement bait, external links go in first comment not post body, 3-5 hashtags max

Key algorithm signals: dwell time is #1 (61+ seconds = ~15% engagement), conversation depth beats vanity metrics, expertise authority rewards consistent niche posting, golden window is first 60-90 minutes.

### Agent 3: Fact Validator (Paid Tier Only)
- Takes the draft text
- Tavily API: searches for claims, stats, quotes in the draft → returns source URLs
- Perplexity API: cross-references and provides additional context
- Returns validation report: which claims check out, which need revision, suggested corrections
- Enriches draft with current data points (latest stats, recent events)

## Chrome Extension

Manifest V3 extension for one-click LinkedIn post capture. Lives in `chrome-extension/`.

### Architecture

- **Content script** (`content.js`) — Injects "Capture with Ella" buttons on LinkedIn posts. Handles DOM extraction, "see more" expansion, and screenshot coordination. All LinkedIn selectors are grouped in a `SELECTORS` config object at the top of the file for easy updates when LinkedIn changes markup.
- **Background service worker** (`background.js`) — Handles `chrome.tabs.captureVisibleTab` (content scripts can't call this API), Supabase REST auth/CRUD, screenshot upload to Storage, and Vision fallback via `claude-proxy` edge function. No API keys are stored in the extension — all sensitive calls go through edge functions.
- **Popup** (`popup.html/js/css`) — Login with Supabase email/password auth, capture count, recent captures, link to web app. Session stored in `chrome.storage.local`.

### Capture Flow

1. User clicks "Capture" button on a LinkedIn post
2. Content script expands "see more" if truncated, then extracts post data from DOM (text, author, engagement numbers, media type, comments, hashtags)
3. Content script coordinates with background worker to capture a screenshot of the post element via `captureVisibleTab`, cropping to the post's bounding rect on a canvas
4. For posts taller than the viewport, scroll-captures section by section and stitches on canvas
5. If DOM extraction is incomplete (e.g., LinkedIn changed their markup), screenshot is sent to `claude-proxy` edge function for Vision extraction as fallback
6. Background worker uploads screenshot to Supabase Storage and inserts post record to `posts` table
7. Post appears in the user's Ella database immediately

### Engagement Number Parsing

`parseEngagementNumber()` in `content.js` handles all LinkedIn formats:
- `"1,234"` → 1234
- `"1.2K"` → 1200
- `"5M"` → 5000000
- `"847"` → 847

### Selector Maintenance

LinkedIn changes DOM selectors frequently. When extraction breaks:
1. Open the `SELECTORS` object at the top of `content.js`
2. Inspect the LinkedIn DOM for updated class names
3. Update the selector arrays — each entry has fallback selectors tried in order

### High-Performer Detection

As the content script injects Capture buttons, it checks each post's reaction count against a configurable threshold (default: 100, adjustable in popup settings). Posts above the threshold get an orange left-border glow and a fire icon on the Capture button. Purely visual — no extra API calls.

### Bulk Capture (Power Tool)

Triggered from the extension popup's "Power Tools" section. Shows a floating bar on the current LinkedIn page that captures all visible posts at once — text, engagement, media, hashtags — without comment expansion or screenshots. Posts saved with `capture_method: "bulk"`.

**Data quality note:** Single-post captures produce higher quality data than bulk captures. Bulk captures may have truncated text and miss comments. The recommended path is organic feed browsing with high-performer badges guiding attention. Bulk capture is best for building an initial database fast, then supplementing with full captures.

### Supported Page Types

Capture buttons are officially supported on:
- **Home feed** (`linkedin.com/feed`) — primary capture surface
- **Standalone post pages** (`linkedin.com/feed/update/*`) — full post with comments

Other page types (search results, profile activity, company pages, hashtag feeds) may work via the structural fallback detector but are not actively maintained. For unsupported pages, users can click into the standalone post or use screenshot upload.

SPA navigation is detected via pushState/replaceState interception and URL polling. Every URL change triggers re-scans.

### Loading the Extension (dev)

1. `chrome://extensions` → enable Developer mode
2. "Load unpacked" → select `chrome-extension/` folder
3. Log in via popup, browse LinkedIn, capture posts

## Cold Start & Data Import

### Seed Patterns (`src/utils/seed-patterns.js`)

Pre-built ML result objects per industry (CPG, SaaS, Healthcare, General) that give new users immediate value:
- Displayed on the Analyze page at 20% confidence when user has 0 posts, labeled "Industry Baseline"
- Used as fallback in the Generate page so even brand-new users can generate drafts (non-personalized)
- Blending: 0 posts = seed only, 1-19 posts = seed for locked tiers + personal for unlocked, 20+ = fully personal
- Contains: optimal ranges, hook/CTA/media performance patterns, correlations, placeholder vocabulary
- Easy to update — static JS export bundled with the app

### CSV Import (`src/components/CSVImport.jsx`)

Upload LinkedIn data exports or any CSV with post data:
- Auto-detects LinkedIn export column format + generic CSV headers
- Column mapping UI with dropdowns
- Posts without engagement data saved with `has_engagement_data: false` — included in text analysis but excluded from engagement correlations
- Saved with `capture_method: "csv_import"` or `"linkedin_export"`

### Partial Data Handling in ML Pipeline

The pipeline handles three types of incomplete data:
- **`capture_method: "bulk"`**: Text may be truncated. Still used for hook analysis (first ~200 chars are captured) and engagement correlations. Flagged in TF-IDF as potentially incomplete.
- **`has_engagement_data: false`**: Imported posts without engagement numbers. Included in vocabulary/text analysis but excluded from scoring, ranking, and engagement correlations.
- Pipeline logs: "Analyzing N posts (M with engagement data, K text-only)"

### Future: Community Patterns (not built yet)

- Settings toggle: "Contribute anonymized patterns to improve Ella for your industry"
- When opted in and 50+ posts captured, user's ML results (structural patterns and correlations only — NEVER post text, author names, or screenshots) get sent to a `community_patterns` Supabase table
- Periodically aggregate per-industry to update seed data
- Privacy: only statistical aggregates stored. Individual user patterns never identifiable.

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
7. ✅ Supabase Edge Function proxy for API calls
8. ✅ Chrome extension (DOM extraction + screenshot capture + Vision fallback)
9. Landing page + pricing
10. Stripe integration for paid tier
11. Polish: animations, onboarding flow, mobile responsive

## Privacy & Legal

- **Screenshots are private processing artifacts.** They are stored per-user in the `screenshots` Supabase Storage bucket with RLS policies enforcing `auth.uid() = folder owner`. They exist solely for Vision fallback extraction when DOM scraping fails.
- Screenshots must **never** be shared across users or displayed publicly. The Database page loads them via short-lived signed URLs (5 min expiry) only for the owning user.
- **Future**: Add auto-expiry to delete screenshots older than 30 days. Implement via a Supabase cron job or Edge Function that runs `DELETE FROM storage.objects WHERE bucket_id = 'screenshots' AND created_at < now() - interval '30 days'`.
- LinkedIn post text and engagement data are stored as user-collected research data. No LinkedIn credentials are accessed or stored — the extension reads only publicly visible DOM content.

## Code Style

- Functional React components with hooks
- ES modules
- Tailwind CSS for styling (migration from inline styles)
- No TypeScript yet (candidate for future migration)
- Supabase client in `lib/supabase.js`, accessed through custom hooks
