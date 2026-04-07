/**
 * Import seed-posts.json into Supabase for the specified user.
 * Usage: node scripts/import-seed-posts.js <email> <password>
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cpdppabgtlniunlcospd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-1ixcuHtEa9-wFTUCASa2g_TsRYCzou';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node scripts/import-seed-posts.js <email> <password>');
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

  // 3. Load seed posts
  const seedPath = path.join(__dirname, '..', 'seed-posts.json');
  const posts = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  console.log(`Loaded ${posts.length} seed posts`);

  // 4. Insert each post
  let success = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const reactions = p.reactions || {};
    const totalReactions = reactions.total || 0;
    const comments = p.comments || [];

    // Build reactions_breakdown
    const dominantTypes = [];
    for (const [type, count] of Object.entries(reactions)) {
      if (type !== 'total' && count > 0) dominantTypes.push(type);
    }
    // Sort by count descending
    dominantTypes.sort((a, b) => (reactions[b] || 0) - (reactions[a] || 0));

    const reactionsBreakdown = {
      ...reactions,
      dominant_types: dominantTypes.slice(0, 3),
    };

    const payload = {
      user_id: userId,
      post_text: p.text,
      author_name: p.author || 'Industry Post',
      author_title: p.title || '',
      likes: totalReactions,
      comments_count: comments.length,
      shares: p.shares || 0,
      hashtags: (p.text.match(/#[\w]+/g) || []).join(', '),
      comment_texts: comments.join(' | '),
      has_image: false,
      has_video: false,
      has_carousel: false,
      industry,
      capture_method: 'seed_import',
      has_engagement_data: true,
    };

    // Try with reactions_breakdown, fall back without
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
      // Retry without reactions_breakdown
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
      console.log(`  [${i + 1}/${posts.length}] ✓ "${p.title}"`);
    } else {
      failed++;
      const err = await res.json().catch(() => ({}));
      console.log(`  [${i + 1}/${posts.length}] ✗ "${p.title}" — ${err.message || res.status}`);
    }

    // 300ms delay between inserts
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone! ${success} imported, ${failed} failed.`);
  console.log('Refresh the Ella web app and run ML Analysis.');
}

main().catch((err) => { console.error(err); process.exit(1); });
