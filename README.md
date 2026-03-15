# 🦜 Ella — LinkedIn Content Engine

Ella learns what makes LinkedIn posts go viral in your industry, then writes you one.

## How It Works

1. **Screenshot** → Snap a high-performing LinkedIn post from your feed
2. **Extract** → Ella reads it with AI Vision — text, engagement numbers, everything
3. **Store** → Added to your personal post database (Supabase)
4. **Analyze** → ML pipeline discovers engagement patterns across your captured posts
5. **Generate** → AI agents draft optimized posts using your patterns + trending topics
6. **Validate** *(Pro)* → Tavily & Perplexity fact-check claims and inject real-time data

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Fill in your Supabase + Anthropic keys

# Run Supabase migration (see supabase/migrations/)

# Start dev server
npm run dev
```

## Stack

- **Frontend**: React 18 + Vite + D3.js + React Router
- **Database & Auth**: Supabase (Postgres + Auth + Storage)
- **Vision**: Anthropic Claude (screenshot → structured data)
- **ML**: Client-side NLP (TF-IDF, Pearson correlation, feature extraction)
- **Generation**: Anthropic Claude with web search
- **Validation (Pro)**: Tavily Search + Perplexity AI

## Project Structure

```
├── src/
│   ├── App.jsx              # Router + auth wrapper
│   ├── lib/                 # API clients (Supabase, Anthropic, Tavily, Perplexity)
│   ├── utils/               # ML pipeline, NLP, prompts
│   ├── hooks/               # useAuth, usePosts, useMLAnalysis
│   ├── components/          # UI components
│   └── pages/               # Capture, Database, Analyze, Generate, Settings
├── supabase/migrations/     # Database schema
├── CLAUDE.md                # Full project context for Claude Code
└── package.json
```

## Claude Code

This repo includes a `CLAUDE.md` file optimized for Claude Code. Open the project and run `claude` — it has full context on the architecture, ML pipeline, agent system, and build priorities.

## License

MIT
