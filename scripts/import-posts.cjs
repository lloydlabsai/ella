/**
 * Bulk-import posts into Ella from a JSON file.
 *
 * Usage:
 *   node scripts/import-posts.cjs <email> <password> [path/to/posts.json]
 *
 * Config is read from your .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY),
 * or from real environment variables if those are set.
 *
 * Expected JSON shape — an array of objects:
 *   [
 *     {
 *       "title":     "Short label, used for console output only",
 *       "text":      "The full post body (required)",
 *       "author":    "Post author name",
 *       "authorTitle": "Author headline",
 *       "shares":    12,
 *       "reactions": { "total": 340, "like": 200, "insightful": 90 },
 *       "comments":  ["First comment", "Second comment"]
 *     }
 *   ]
 *
 * Only `text` is required. Everything else falls back to a sane default.
 */

const fs = require('fs');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────
// Prefer real env vars, otherwise parse .env so this works right
// after `cp .env.example .env` with no extra dependencies.
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

const fileEnv = loadEnv();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY;

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const postsArg = process.argv[4] || 'posts.json';

  if (!email || !password) {
    console.error('Usage: node scripts/import-posts.cjs <email> <password> [path/to/posts.json]');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      'Missing Supabase config.\n' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).'
    );
    process.exit(1);
  }

  const postsPath = path.isAbsolute(postsArg) ? postsArg : path.join(process.cwd(), postsArg);
  if (!fs.existsSync(postsPath)) {
    console.error(`No such file: ${postsPath}`);
    console.error('Pass a path to a JSON array of posts. See the header of this file for the shape.');
    process.exit(1);
  }

  let posts;
  try {
    posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  } catch (err) {
    console.error(`Could not parse ${postsPath} as JSON: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(posts)) {
    console.error('Expected the JSON file to contain an array of posts.');
    process.exit(1);
  }

  // 1. Authenticate
  console.log(`Authenticating as ${email}...`);
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const authData = await authRes.json();
  if (!authRes.ok) {
    console.error('Auth failed:', authData.error_description || authData.msg);
    process.exit(1);
  }
  const token = authData.access_token;
  const userId = authData.user.id;
  console.log(`Authenticated. User ID: ${userId}`);

  // 2. Get user profile for industry
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=industry`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  const profiles = await profileRes.json();
  const industry = profiles?.[0]?.industry || '';
  console.log(`Industry: ${industry || '(not set)'}`);
  console.log(`Loaded ${posts.length} posts from ${postsPath}`);

  // 3. Insert each post
  let success = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const label = p.title || `post ${i + 1}`;

    if (!p.text) {
      failed++;
      console.log(`  [${i + 1}/${posts.length}] ✗ "${label}" — missing required "text" field`);
      continue;
    }

    const reactions = p.reactions || {};
    const totalReactions = reactions.total || 0;
    const comments = p.comments || [];

    // Build reactions_breakdown, most common reaction type first
    const dominantTypes = [];
    for (const [type, count] of Object.entries(reactions)) {
      if (type !== 'total' && count > 0) dominantTypes.push(type);
    }
    dominantTypes.sort((a, b) => (reactions[b] || 0) - (reactions[a] || 0));

    const reactionsBreakdown = {
      ...reactions,
      dominant_types: dominantTypes.slice(0, 3),
    };

    const payload = {
      user_id: userId,
      post_text: p.text,
      author_name: p.author || 'Industry Post',
      author_title: p.authorTitle || p.title || '',
      likes: totalReactions,
      comments_count: comments.length,
      shares: p.shares || 0,
      hashtags: (p.text.match(/#[\w]+/g) || []).join(', '),
      comment_texts: comments.join(' | '),
      has_image: false,
      has_video: false,
      has_carousel: false,
      industry,
      capture_method: 'bulk_import',
      has_engagement_data: totalReactions > 0,
    };

    // Try with reactions_breakdown, fall back without it for older schemas
    let res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ ...payload, reactions_breakdown: reactionsBreakdown }),
    });

    if (!res.ok) {
      res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      success++;
      console.log(`  [${i + 1}/${posts.length}] ✓ "${label}"`);
    } else {
      failed++;
      const err = await res.json().catch(() => ({}));
      console.log(`  [${i + 1}/${posts.length}] ✗ "${label}" — ${err.message || res.status}`);
    }

    // Small delay so bulk imports don't trip rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone. ${success} imported, ${failed} failed.`);
  console.log('Refresh the Ella web app and run ML Analysis.');
}

main().catch((err) => { console.error(err); process.exit(1); });
