/* ═══════════════════════════════════════════════════════════
   Ella — Background Service Worker
   Handles tab capture, Supabase auth/REST, and Vision fallback.
   All API keys stay server-side in edge functions — never
   exposed in the extension.
   ═══════════════════════════════════════════════════════════ */

// ─── CONFIG ───────────────────────────────────────────────
// Edit chrome-extension/config.js to point at your Supabase project.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

if (SUPABASE_URL.includes('YOUR_PROJECT') || SUPABASE_ANON_KEY.startsWith('YOUR_')) {
  console.error(
    '[Ella] Extension is not configured yet. Open chrome-extension/config.js ' +
    'and set SUPABASE_URL and SUPABASE_ANON_KEY to your own Supabase project, ' +
    'then reload the extension at chrome://extensions.'
  );
}

// ─── SESSION MANAGEMENT ──────────────────────────────────

async function getSession() {
  const { ellaSession } = await chrome.storage.local.get('ellaSession');
  return ellaSession || null;
}

async function saveSession(session) {
  await chrome.storage.local.set({ ellaSession: session });
}

async function clearSession() {
  await chrome.storage.local.remove('ellaSession');
}

/**
 * Refresh an expired access token using the refresh token.
 * Returns the new session or null on failure.
 */
async function refreshToken(session) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    };
    await saveSession(newSession);
    return newSession;
  } catch {
    return null;
  }
}

/**
 * Get a valid session, refreshing if needed.
 */
async function getValidSession() {
  const session = await getSession();
  if (!session) return null;

  // Decode JWT to check expiration
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now + 60) {
      // Token expired or about to expire — refresh
      const refreshed = await refreshToken(session);
      return refreshed;
    }
  } catch {
    // If we can't decode, try refreshing
    const refreshed = await refreshToken(session);
    return refreshed;
  }

  return session;
}

// ─── AUTH ─────────────────────────────────────────────────

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');

  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
  };
  await saveSession(session);
  return session;
}

async function signup(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Signup failed');

  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
  };
  await saveSession(session);
  return session;
}

async function logout() {
  await clearSession();
}

// ─── SUPABASE REST HELPERS ───────────────────────────────

/**
 * Authenticated fetch against Supabase REST or Storage APIs.
 * Automatically retries once with a refreshed token on 401.
 */
async function supabaseFetch(path, options = {}) {
  let session = await getValidSession();
  if (!session) throw new Error('Not authenticated');

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
    ...options.headers,
  };

  let res = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });

  // Retry once on 401
  if (res.status === 401) {
    session = await refreshToken(session);
    if (!session) throw new Error('Session expired — please log in again');
    headers.Authorization = `Bearer ${session.access_token}`;
    res = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
  }

  return res;
}

/**
 * Get the user's profile (for industry auto-fill).
 */
async function getUserProfile(userId) {
  const res = await supabaseFetch(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: { Accept: 'application/json' },
  });
  const rows = await res.json();
  return rows?.[0] || null;
}

/**
 * Insert a post into the database.
 * Returns the created row.
 */
async function insertPost(postData) {
  const res = await supabaseFetch('/rest/v1/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(postData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to insert post');
  }
  const rows = await res.json();
  return rows[0];
}

/**
 * Upload a screenshot to Supabase Storage.
 * Returns the storage path.
 */
async function uploadScreenshot(userId, dataUrl) {
  // Convert data URL to blob
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  const filename = `${Date.now()}.jpg`;
  const storagePath = `${userId}/${filename}`;

  const res = await supabaseFetch(`/storage/v1/object/screenshots/${storagePath}`, {
    method: 'POST',
    headers: {
      'Content-Type': blob.type || 'image/jpeg',
    },
    body: blob,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Screenshot upload failed');
  }

  return storagePath;
}

/**
 * Get count of posts for the user.
 */
async function getPostCount(userId) {
  const res = await supabaseFetch(
    `/rest/v1/posts?user_id=eq.${userId}&select=id`,
    {
      method: 'HEAD',
      headers: { Prefer: 'count=exact' },
    }
  );
  const range = res.headers.get('content-range');
  if (range) {
    const match = range.match(/\/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  return 0;
}

/**
 * Get recent posts for the user.
 */
async function getRecentPosts(userId, limit = 5) {
  const res = await supabaseFetch(
    `/rest/v1/posts?user_id=eq.${userId}&select=id,post_text,author_name,created_at&order=created_at.desc&limit=${limit}`,
    { headers: { Accept: 'application/json' } }
  );
  return res.json();
}

// ─── VISION FALLBACK ─────────────────────────────────────

async function visionExtract(imageDataUrl) {
  const session = await getValidSession();
  if (!session) throw new Error('Not authenticated');

  // Strip data URL prefix to get base64
  const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const mediaType = imageDataUrl.match(/^data:(image\/\w+);/)?.[1] || 'image/jpeg';

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `You extract LinkedIn post data from screenshots. Return ONLY valid JSON, no markdown fences, no preamble. Extract every visible field. For engagement numbers, parse "1.2K" as 1200, "5M" as 5000000, etc. If a field is not visible, use null.

Return this exact JSON structure:
{
  "post_text": "full post text verbatim, including line breaks",
  "author_name": "name or null",
  "author_title": "headline/title or null",
  "likes": number or 0,
  "comments_count": number or 0,
  "shares": number or 0,
  "hashtags": "comma separated or empty string",
  "has_image": true/false,
  "has_video": true/false,
  "has_carousel": true/false,
  "comment_texts": "visible comments separated by | or empty string"
}`,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: 'Extract all LinkedIn post data from this screenshot. Return ONLY the JSON object.',
          },
        ],
      },
    ],
  };

  const res = await supabaseFetch('/functions/v1/claude-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Vision API error');

  const text = data.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  return JSON.parse(text.replace(/```json\s?|```/g, '').trim());
}

// ─── SCREENSHOT CAPTURE ─────────────────────────────────

async function captureTab(tabId) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
    });
    return dataUrl;
  } catch (err) {
    console.warn('[Ella] captureVisibleTab failed:', err.message);
    // Try with the specific window ID as fallback
    try {
      const tab = await chrome.tabs.get(tabId);
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
      });
      return dataUrl;
    } catch {
      throw new Error('Screenshot capture failed — try clicking the Ella popup first to grant tab access');
    }
  }
}

// ─── SAVE POST (FULL PIPELINE) ──────────────────────────

async function savePost({ postData, screenshotDataUrl }) {
  const session = await getValidSession();
  if (!session) throw new Error('Not authenticated');
  const userId = session.user.id;

  // Get user profile for industry auto-fill
  let industry = '';
  try {
    const profile = await getUserProfile(userId);
    if (profile?.industry) industry = profile.industry;
  } catch {
    // Non-critical — continue without industry
  }

  // Upload screenshot if provided
  let screenshotUrl = '';
  if (screenshotDataUrl) {
    try {
      screenshotUrl = await uploadScreenshot(userId, screenshotDataUrl);
    } catch (err) {
      console.warn('[Ella] Screenshot upload failed:', err.message);
      // Continue without screenshot
    }
  }

  // Build post payload — always include core fields
  const postPayload = {
    user_id: userId,
    post_text: postData.post_text,
    author_name: postData.author_name || '',
    author_title: postData.author_title || '',
    likes: postData.likes || 0,
    comments_count: postData.comments_count || 0,
    shares: postData.shares || 0,
    hashtags: postData.hashtags || '',
    comment_texts: postData.comment_texts || '',
    has_image: postData.has_image || false,
    has_video: postData.has_video || false,
    has_carousel: postData.has_carousel || false,
    screenshot_url: screenshotUrl,
    industry,
    capture_method: postData.capture_method || 'extension',
  };

  // Try with reactions_breakdown first, retry without if column doesn't exist
  if (postData.reactions_breakdown) {
    postPayload.reactions_breakdown = postData.reactions_breakdown;
  }

  let row;
  try {
    row = await insertPost(postPayload);
  } catch (err) {
    // If it failed due to unknown column, retry without reactions_breakdown
    if (err.message && /reactions_breakdown|capture_method|has_engagement_data|column/i.test(err.message)) {
      console.warn('[Ella] Unknown column, retrying without optional fields');
      delete postPayload.reactions_breakdown;
      delete postPayload.capture_method;
      delete postPayload.has_engagement_data;
      row = await insertPost(postPayload);
    } else {
      throw err;
    }
  }

  return row;
}

// ─── MESSAGE HANDLER ─────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handle = async () => {
    switch (msg.action) {
      // ── Auth ──
      case 'login': {
        const session = await login(msg.data.email, msg.data.password);
        return { success: true, user: session.user };
      }
      case 'signup': {
        const session = await signup(msg.data.email, msg.data.password);
        return { success: true, user: session.user };
      }
      case 'logout': {
        await logout();
        return { success: true };
      }
      case 'getAuthState': {
        const session = await getValidSession();
        if (!session) return { loggedIn: false };
        return { loggedIn: true, user: session.user };
      }

      // ── Status ──
      case 'getStatus': {
        const session = await getValidSession();
        if (!session) return { loggedIn: false };
        const count = await getPostCount(session.user.id);
        let linkedinContext = null;
        try {
          const prof = await getUserProfile(session.user.id);
          linkedinContext = prof?.linkedin_context || null;
        } catch { /* non-critical */ }
        return { loggedIn: true, user: session.user, captureCount: count, linkedinContext };
      }
      case 'getRecentCaptures': {
        const session = await getValidSession();
        if (!session) return { posts: [] };
        const posts = await getRecentPosts(session.user.id);
        return { posts };
      }

      // ── Capture ──
      case 'captureTab': {
        const dataUrl = await captureTab(sender.tab?.id);
        return { dataUrl };
      }
      case 'savePost': {
        const row = await savePost(msg.data);
        return { success: true, postId: row.id };
      }
      case 'visionExtract': {
        const postData = await visionExtract(msg.data.imageDataUrl);
        return { success: true, postData };
      }

      // ── Profile Capture (text-based — no screenshots needed) ──
      case 'captureProfile': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url?.includes('linkedin.com/in/')) {
          throw new Error('Navigate to your LinkedIn profile page first');
        }

        // Step 1: Content script scrolls, expands, and extracts raw text
        // Retry up to 3 times — content script may not be injected yet
        console.log('[Ella] Profile capture: extracting page text...');
        let extraction = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            extraction = await chrome.tabs.sendMessage(tab.id, { action: 'extractProfile' });
            break;
          } catch (sendErr) {
            console.log(`[Ella] sendMessage attempt ${attempt} failed:`, sendErr.message);
            if (attempt < 3) {
              // Inject the content script manually and retry
              try {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ['content.js'],
                });
                await chrome.scripting.insertCSS({
                  target: { tabId: tab.id },
                  files: ['content.css'],
                });
                console.log('[Ella] Manually injected content script, retrying...');
              } catch (injectErr) {
                console.log('[Ella] Manual injection failed:', injectErr.message);
              }
              await new Promise(r => setTimeout(r, 800));
            } else {
              throw new Error('Content script not responding. Refresh the LinkedIn page and try again.');
            }
          }
        }
        if (!extraction?.success) {
          throw new Error(extraction?.error || 'Profile extraction failed');
        }

        const raw = extraction.rawSections || {};
        console.log('[Ella] Profile capture: got sections:', Object.keys(raw).filter(k => raw[k]).join(', '));

        // Step 2: Send raw text to Claude (Sonnet, not Vision) to structure it
        const session = await getValidSession();
        if (!session) throw new Error('Not authenticated');

        const rawText = [
          raw.name ? `NAME: ${raw.name}` : '',
          raw.headline ? `HEADLINE: ${raw.headline}` : '',
          raw.location ? `LOCATION: ${raw.location}` : '',
          raw.followers ? `FOLLOWERS: ${raw.followers}` : '',
          raw.connections ? `CONNECTIONS: ${raw.connections}` : '',
          raw.about ? `ABOUT SECTION:\n${raw.about}` : '',
          raw.experience ? `EXPERIENCE SECTION:\n${raw.experience}` : '',
          raw.education ? `EDUCATION SECTION:\n${raw.education}` : '',
          raw.licenses_and_certifications ? `CERTIFICATIONS SECTION:\n${raw.licenses_and_certifications}` : '',
          raw.skills ? `SKILLS SECTION:\n${raw.skills}` : '',
          raw.projects ? `PROJECTS SECTION:\n${raw.projects}` : '',
        ].filter(Boolean).join('\n\n');

        console.log(`[Ella] Profile text: ${rawText.length} chars`);

        let finalText = rawText;
        if (rawText.length < 50) {
          // Fallback: grab the entire main content as raw text
          console.log('[Ella] Section extraction found little — using full page text fallback');
          const [fullTextResult] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const main = document.querySelector('main') || document.body;
              const clone = main.cloneNode(true);
              clone.querySelectorAll('.visually-hidden, .msg-overlay-list-bubble, aside, nav, .msg-overlay').forEach(el => el.remove());
              return clone.innerText.trim().slice(0, 10000);
            },
          });
          finalText = fullTextResult?.result || '';
          console.log(`[Ella] Full page text fallback: ${finalText.length} chars`);
          if (finalText.length < 50) {
            throw new Error('Could not extract profile text. Make sure you are on your LinkedIn profile page and the page has fully loaded.');
          }
          finalText = 'FULL LINKEDIN PROFILE PAGE TEXT (parse all sections):\n\n' + finalText;
        }

        const visionBody = {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: `You parse raw text extracted from a LinkedIn profile page into structured JSON. Return ONLY valid JSON, no markdown fences, no preamble.

Parse ALL information from the raw text. The text includes section headers and content extracted from the HTML. Parse experience entries, education entries, certifications, and skills into their respective arrays.

Return this exact JSON structure:
{
  "name": "full name",
  "headline": "professional headline",
  "about": "full About section text — all paragraphs — or null",
  "location": "city/region or null",
  "current_role": "most recent job title and company",
  "experience": [
    {"title": "job title", "company": "company name", "duration": "date range if visible", "description": "role description if visible"}
  ],
  "education": [
    {"school": "school name", "degree": "degree if visible"}
  ],
  "certifications": [
    {"name": "cert name", "issuer": "issuing organization"}
  ],
  "followers": "follower count or null",
  "connections": "connection count or null",
  "skills": ["skill1", "skill2", ...]
}

Include ALL entries for experience, education, certifications. Parse durations, companies, schools from the raw text.`,
          messages: [{
            role: 'user',
            content: `Parse this LinkedIn profile text into structured JSON:\n\n${finalText}`,
          }],
        };

        const visionRes = await supabaseFetch('/functions/v1/claude-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visionBody),
        });

        const visionData = await visionRes.json();
        if (visionData.error) throw new Error(visionData.error.message || 'Profile parsing failed');

        const text = visionData.content
          .filter((b) => b.type === 'text')
          .map((b) => b.text)
          .join('');
        const profileData = JSON.parse(text.replace(/```json\s?|```/g, '').trim());

        console.log('[Ella] Parsed profile:', JSON.stringify(profileData).slice(0, 300));

        if (!profileData.name) {
          throw new Error('Could not extract profile name from page text');
        }

        profileData.captured_at = new Date().toISOString();

        // Step 4: Save to Supabase — linkedin_context + display_name (don't overwrite industry)
        const update = {
          linkedin_context: profileData,
          display_name: profileData.name,
        };

        const saveRes = await supabaseFetch(`/rest/v1/profiles?id=eq.${session.user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify(update),
        });
        if (!saveRes.ok) {
          const err = await saveRes.json();
          throw new Error(err.message || 'Failed to save profile');
        }

        console.log('[Ella] Profile saved successfully');

        // Show success toast on the LinkedIn tab (popup is already closed)
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (name) => {
              const toast = document.createElement('div');
              toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;padding:14px 22px;background:#059669;color:#fff;border-radius:12px;font-family:-apple-system,sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.25);animation:fadeIn 0.3s ease';
              toast.textContent = 'Profile captured: ' + name;
              document.body.appendChild(toast);
              const style = document.createElement('style');
              style.textContent = '@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
              document.head.appendChild(style);
              setTimeout(() => toast.remove(), 4000);
            },
            args: [profileData.name || 'Profile saved'],
          });
        } catch { /* toast is non-critical */ }

        return { success: true, profile: profileData };
      }

      // ── Settings ──
      case 'getSettings': {
        const settings = await chrome.storage.local.get(['captureComments']);
        return { captureComments: settings.captureComments || false };
      }
      case 'setSetting': {
        await chrome.storage.local.set({ [msg.data.key]: msg.data.value });
        return { success: true };
      }

      default:
        return { error: 'Unknown action' };
    }
  };

  handle()
    .then(sendResponse)
    .catch(async (err) => {
      sendResponse({ success: false, error: err.message });
      // If profile capture failed, show error toast on the active tab
      if (msg.action === 'captureProfile') {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (errMsg) => {
                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;padding:14px 22px;background:#dc2626;color:#fff;border-radius:12px;font-family:-apple-system,sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.25)';
                toast.textContent = 'Profile capture failed: ' + errMsg;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 5000);
              },
              args: [err.message],
            });
          }
        } catch { /* non-critical */ }
      }
    });

  // Return true to indicate async sendResponse
  return true;
});
