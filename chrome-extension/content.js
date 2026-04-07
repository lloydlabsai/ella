/* ═══════════════════════════════════════════════════════════
   Ella — Content Script
   Injects capture buttons on LinkedIn posts, extracts post
   data from the DOM, coordinates screenshot capture with the
   background service worker.
   ═══════════════════════════════════════════════════════════ */

console.log('[Ella] Content script loaded on:', location.href);

// ─── LINKEDIN SELECTORS ────────────────────────────────────
// All LinkedIn DOM selectors grouped here for easy updates.
// LinkedIn changes markup frequently — update these first
// when extraction breaks.
// ────────────────────────────────────────────────────────────
const SELECTORS = {
  // Post containers — supported on home feed and standalone post pages.
  // Other page types (search, profile activity) may work via structural fallback.
  post: [
    'div[role="listitem"]',
    '.feed-shared-update-v2',
    'div[data-urn^="urn:li:activity"]',
    'div[data-urn^="urn:li:ugcPost"]',
    'div[data-urn^="urn:li:share"]',
  ],

  // Author info — LinkedIn uses __title (not __name) for the author name wrapper.
  // The name span is inside span[dir="ltr"] > span[aria-hidden="true"].
  authorName: [
    '.update-components-actor__title span[dir="ltr"] span[aria-hidden="true"]',
    '.update-components-actor__title span[aria-hidden="true"]',
    'a.update-components-actor__meta-link .update-components-actor__title span[aria-hidden="true"]',
    '.feed-shared-actor__name span[aria-hidden="true"]',
    '.feed-shared-actor__name span[dir="ltr"] span[aria-hidden="true"]',
  ],
  authorTitle: [
    '.update-components-actor__description span[aria-hidden="true"]',
    'a.update-components-actor__meta-link .update-components-actor__description span[aria-hidden="true"]',
    '.feed-shared-actor__description span[aria-hidden="true"]',
  ],

  // Post text
  postText: [
    '.feed-shared-update-v2__description-wrapper .break-words',
    '.update-components-text .break-words',
    '.feed-shared-update-v2__description .break-words',
    '.feed-shared-text .break-words',
    '.feed-shared-update-v2__description-wrapper',
    '.update-components-text',
  ],

  // "See more" button
  seeMore: [
    'button.feed-shared-inline-show-more-text',
    '.feed-shared-inline-show-more-text',
    'button[aria-label*="see more"]',
    'button[aria-label*="See more"]',
  ],

  // Engagement — the social counts bar.
  // LinkedIn renders: [reaction icons] "Name and 286 others" ... "39 comments · 3 reposts"
  // Reactions and comments/reposts may be in separate sub-containers or one line.
  socialCountsBar: [
    '.social-details-social-counts',
    '[class*="social-details-social-counts"]',
  ],
  // The reactions part: contains "Name and X others" or just a number
  reactionsCountContainer: [
    '.social-details-social-counts__reactions-count',
    '.social-details-social-counts__item--with-social-proof button',
    '.social-details-social-counts__reactions',
  ],
  // The comments + reposts part: often a single line "39 comments · 3 reposts"
  commentsRepostsContainer: [
    '.social-details-social-counts__comments-and-reposts',
    '.social-details-social-counts__comments',
    '.social-details-social-counts__item:not(:first-child)',
  ],

  // Reaction type icons (visible next to the count: 👍🎉💡 22)
  reactionsArea: [
    '.social-details-social-counts__reactions',
    '.social-details-social-counts__item--with-social-proof:first-child',
    '[class*="social-counts"] [class*="reactions"]',
  ],
  reactionIcon: [
    'img[data-test-app-aware-image]',
    'img[aria-label]',
    'img[alt]',
    'svg[aria-label]',
  ],

  // Media detection
  imageMedia: [
    '.feed-shared-image',
    '.update-components-image',
    '.feed-shared-update-v2__content img:not(.feed-shared-actor__avatar)',
  ],
  videoMedia: [
    '.feed-shared-video',
    '.update-components-linkedin-video',
    'video',
    '.feed-shared-external-video',
  ],
  carouselMedia: [
    '.feed-shared-carousel',
    '.update-components-document',
    '.feed-shared-document',
  ],

  // Comments
  commentItems: [
    '.comments-comment-item',
    '.comments-comment-entity',
    '.comments-comment-item--expanded',
    '[class*="comments-comment-item"]',
  ],
  commentText: [
    '.comments-comment-item__main-content .break-words',
    '.comments-comment-entity .break-words',
    '[class*="comments-comment-item"] .break-words',
    '[class*="comment-item"] .update-components-text .break-words',
  ],
  commentAuthor: [
    '.comments-comment-item__post-meta .hoverable-link-text span[aria-hidden="true"]',
    '[class*="comments-comment-item"] a[class*="actor"] span[aria-hidden="true"]',
    '.comments-post-meta span[aria-hidden="true"]',
  ],

  // Comment expansion (for "capture comments" toggle)
  showCommentsBtn: [
    'button.comment-button',
    'button[aria-label*="Comment"]',
    'button[aria-label*="comment"]',
    '.social-details-social-counts__comments',
  ],
  loadMoreComments: [
    'button.comments-comments-list__load-more-comments-button',
    'button[aria-label*="Load more comments"]',
    'button[aria-label*="Load previous comments"]',
    'button[aria-label*="load more comments"]',
    'button[aria-label*="more comments"]',
    'button[aria-label*="View more comments"]',
    'button[aria-label*="previous comments"]',
  ],
  expandReplies: [
    'button[aria-label*="replies"]',
    'button[aria-label*="Replies"]',
    'button[aria-label*="previous replies"]',
    'button[aria-label*="See previous"]',
    'button.show-prev-replies',
  ],
  commentsSection: [
    '.comments-comments-list',
    '.comments-comment-list',
    'article.comments-container',
    '[class*="comments-comments-list"]',
  ],

  // Feed container (for MutationObserver)
  feedContainer: [
    '.scaffold-finite-scroll__content',
    'main .scaffold-layout__main',
    'main',
  ],

  // LinkedIn profile page (for "Capture My Profile")
  profileName: [
    'h1.text-heading-xlarge',
    'h1.inline.t-24',
    '.pv-top-card h1',
    'h1',
  ],
  profileHeadline: [
    '.text-body-medium.break-words',
    '.pv-top-card .text-body-medium',
    '.ph5 .mt2 .text-body-medium',
  ],
  profileAbout: [
    '#about ~ .display-flex .pv-shared-text-with-see-more span[aria-hidden="true"]',
    '#about + .display-flex .inline-show-more-text span[aria-hidden="true"]',
    '#about ~ div span.visually-hidden',
    'section.pv-about-section .pv-about__summary-text',
  ],
  profileAboutSeeMore: [
    '#about ~ .display-flex button[aria-expanded="false"]',
    '#about ~ div button.inline-show-more-text__button',
  ],
  profileLocation: [
    '.text-body-small.inline.t-black--light.break-words',
    '.pv-top-card .pb2 .text-body-small',
  ],
  profileExperience: [
    '#experience ~ .pvs-list__outer-container li.artdeco-list__item',
    '#experience ~ div .pvs-entity--padded',
  ],
  profileExperienceTitle: [
    '.t-bold span[aria-hidden="true"]',
    '.t-bold .visually-hidden',
  ],
  profileExperienceCompany: [
    '.t-normal span[aria-hidden="true"]',
    '.t-14.t-normal span[aria-hidden="true"]',
  ],
  profileFollowers: [
    '.pv-top-card .text-body-small span.t-bold',
    'span.t-bold + .t-black--light',
  ],
};

// ─── UTILITIES ─────────────────────────────────────────────

/**
 * Query using an array of fallback selectors.
 * Returns the first match or null.
 */
function q(parent, selectorList) {
  for (const sel of selectorList) {
    const el = parent.querySelector(sel);
    if (el) return el;
  }
  return null;
}

/** Query all matches across fallback selectors. */
function qAll(parent, selectorList) {
  for (const sel of selectorList) {
    const els = parent.querySelectorAll(sel);
    if (els.length > 0) return Array.from(els);
  }
  return [];
}

/**
 * Parse LinkedIn engagement number strings.
 * Handles: "1,234", "1.2K", "5M", "847", "12K", "4 reposts", "56 comments"
 * Caps at 999,999 — no LinkedIn engagement metric exceeds this in practice.
 *
 * IMPORTANT: Only matches a SINGLE contiguous number (with optional K/M suffix).
 * Does NOT concatenate digits from different parts of the string.
 */
function parseEngagementNumber(raw) {
  if (!raw) return 0;

  // Match a single number with optional K/M suffix.
  // The number must be: digits with optional commas/dots for thousands, followed by optional K or M.
  // We use word boundary / whitespace to ensure we don't grab partial matches.
  const match = raw.match(/(?:^|[\s(])(\d[\d,.]*)\s*([KkMm])(?:\b|[\s)]|$)/)   // "1.2K", "12K"
    || raw.match(/(?:^|[\s(])(\d[\d,.]*)\s*(?:reaction|like|comment|repost|share|view|impression)/i)  // "4 reposts"
    || raw.match(/(?:^|[\s(])(\d[\d,.]*)(?:\s*$|\s*[)\s])/)  // trailing number: "  22  "
    || raw.match(/^(\d[\d,.]*)$/);  // entire string is a number
  if (!match) return 0;

  const cleaned = match[1].replace(/,/g, '');
  const suffix = (match[2] || '').toUpperCase();

  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return 0;

  let result = num;
  if (suffix === 'K') result = num * 1_000;
  else if (suffix === 'M') result = num * 1_000_000;

  return Math.min(Math.round(result), 999_999);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── TOAST NOTIFICATIONS ──────────────────────────────────

function showToast(message, type = 'info') {
  const existing = document.querySelectorAll('.ella-toast');
  existing.forEach((t) => t.remove());

  const toast = document.createElement('div');
  toast.className = `ella-toast ella-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('ella-toast--removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── DOM EXTRACTION ────────────────────────────────────────

/** Click "see more" / "…more" to expand truncated post text. */
async function expandSeeMore(postEl) {
  // Strategy 1: Legacy selectors
  let btn = q(postEl, SELECTORS.seeMore);

  // Strategy 2: Find by text content — LinkedIn 2026+ uses "…more" or "... more"
  if (!btn) {
    const candidates = postEl.querySelectorAll('button, span[role="button"], a, span');
    for (const el of candidates) {
      const text = (el.textContent || '').trim().toLowerCase();
      if (
        text === '…more' || text === '... more' || text === '...more' ||
        text === 'more' || text === 'see more' ||
        text === '…\nmore' || text === '… more' ||
        /^\.{2,3}\s*more$/i.test(text) ||
        /^…\s*more$/i.test(text)
      ) {
        btn = el;
        console.log('[Ella] Found "see more" via text match:', JSON.stringify(text));
        break;
      }
    }
  }

  // Strategy 3: aria-label fallback
  if (!btn) {
    btn = postEl.querySelector('[aria-label*="more"]');
    if (btn) {
      const aria = btn.getAttribute('aria-label').toLowerCase();
      if (!aria.includes('see more') && !aria.includes('show more') && !aria.includes('expand')) {
        btn = null;
      }
    }
  }

  if (btn) {
    console.log('[Ella] Clicking "see more":', btn.textContent.trim().slice(0, 30));
    btn.click();
    await delay(500);
  }
}

/**
 * Walk DOM nodes and extract text, inserting spaces at element boundaries
 * to prevent "https://link.comNextWord" concatenation.
 * Also strips visually-hidden / sr-only screen-reader spans.
 */
function getCleanText(node) {
  if (!node) return '';

  // Skip hidden screen-reader elements
  if (node.nodeType === Node.ELEMENT_NODE) {
    const cls = (node.className || '').toString().toLowerCase();
    if (cls.includes('visually-hidden') || cls.includes('sr-only') || cls.includes('a11y-text')) {
      return '';
    }
  }

  // Text node — return content directly
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  // Element node — recurse into children
  if (node.nodeType === Node.ELEMENT_NODE) {
    const tag = node.tagName.toLowerCase();
    let result = '';

    for (const child of node.childNodes) {
      result += getCleanText(child);
    }

    // Add spacing after block-level and inline-replaced elements
    // <br> → newline, <p>/<div>/<li> → newline, <a>/<span> → space (if not already spaced)
    if (tag === 'br') {
      return '\n';
    } else if (['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'].includes(tag)) {
      return result + '\n';
    } else if (tag === 'a') {
      // Add a space after links to prevent URL+word concatenation
      return result + ' ';
    }

    return result;
  }

  return '';
}

function extractPostText(postEl) {
  // Strategy 1: Legacy selectors
  let el = q(postEl, SELECTORS.postText);

  // Strategy 2: New DOM (2026+) — find the post body text
  // LinkedIn posts have: [author area] [post text] [media] [engagement bar] [action buttons]
  // We want the post text block, which is the main prose content.
  if (!el) {
    // First, find the author profile link to know where the author area ends
    const authorLink = postEl.querySelector('a[href*="/in/"]');
    const authorContainer = authorLink?.closest('div')?.parentElement;

    // Find the reaction button to know where the engagement area starts
    const reactionBtn = postEl.querySelector('button[aria-label*="Reaction"], button[aria-label*="reaction"]');
    const engagementArea = reactionBtn?.closest('div')?.parentElement;

    const candidates = postEl.querySelectorAll('div, span');
    let bestEl = null;
    let bestLen = 0;
    for (const c of candidates) {
      // Skip elements that contain buttons (action bar, engagement)
      if (c.querySelector('button')) continue;
      // Skip elements that contain profile links (author area)
      if (c.querySelector('a[href*="/in/"]')) continue;
      // Skip if inside the author container
      if (authorContainer && authorContainer.contains(c)) continue;
      // Skip if inside the engagement area
      if (engagementArea && engagementArea.contains(c)) continue;

      const text = c.innerText?.trim() || '';
      // Post text is typically 30+ chars
      if (text.length > bestLen && text.length > 30) {
        // Skip if text contains engagement patterns ("likes", "comments", "repost")
        if (/^\d+\s*(like|comment|repost|reaction|share|send)/i.test(text)) continue;
        // Skip if text looks like a profile badge ("Premium", "Verified", "1st", "2nd")
        if (/^(Premium|Verified|1st|2nd|3rd|Follow|Connect)/i.test(text)) continue;
        // Make sure this isn't a huge container
        const childDivs = c.querySelectorAll('div, span');
        if (childDivs.length < 15) {
          bestEl = c;
          bestLen = text.length;
        }
      }
    }
    el = bestEl;
  }

  if (!el) return '';

  // Walk the DOM to get clean text with proper spacing
  const text = getCleanText(el);

  // Normalize whitespace: collapse multiple spaces (but keep newlines)
  return text
    .split('\n')
    .map((line) => line.replace(/  +/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractAuthorInfo(postEl) {
  // The actor section may be OUTSIDE the .feed-shared-update-v2 container.
  // Search within postEl first, then walk up to a broader parent.
  const searchRoots = [postEl];
  const broader = postEl.closest('[data-urn]') || postEl.parentElement?.closest('[data-id]') || postEl.parentElement;
  if (broader && broader !== postEl) searchRoots.push(broader);

  let nameEl = null;
  let titleEl = null;

  // Find ALL meta-links in the broader container.
  // Skip the first one if it's a context header like "Krista Arnold reposted this"
  // The LAST update-components-actor__meta-link is the actual post author.
  for (const root of searchRoots) {
    const metaLinks = root.querySelectorAll('a.update-components-actor__meta-link');
    // Use the last meta-link — that's the actual post author, not the resharer
    const authorLink = metaLinks.length > 1 ? metaLinks[metaLinks.length - 1] : metaLinks[0];

    if (authorLink) {
      // Extract name from within this specific link
      const nameSpan = authorLink.querySelector('.update-components-actor__title span[dir="ltr"] span[aria-hidden="true"]')
        || authorLink.querySelector('.update-components-actor__title span[aria-hidden="true"]');
      const titleSpan = authorLink.querySelector('.update-components-actor__description span[aria-hidden="true"]');

      if (nameSpan) nameEl = nameSpan;
      if (titleSpan) titleEl = titleSpan;
      if (nameEl) break;
    }
  }

  // If class-based selectors failed, try any meta-link we can find
  if (!nameEl) {
    for (const root of searchRoots) {
      if (!nameEl) nameEl = q(root, SELECTORS.authorName);
      if (!titleEl) titleEl = q(root, SELECTORS.authorTitle);
      if (nameEl) break;
    }
  }

  // Fallback: parse the meta-link's aria-label
  // Use the LAST meta-link (actual author, not resharer).
  // Format: "View: Jake Battcock, AICP Premium • 3rd+ AI Deal Generation | RevOps"
  if (!nameEl) {
    for (const root of searchRoots) {
      const metaLinks = root.querySelectorAll('a.update-components-actor__meta-link, a[aria-label^="View:"], a[aria-label^="View "]');
      const metaLink = metaLinks.length > 1 ? metaLinks[metaLinks.length - 1] : metaLinks[0];
      if (metaLink) {
        const aria = metaLink.getAttribute('aria-label') || '';
        const match = aria.match(/^View:?\s*(.+?)(?:\s+Premium|\s+•|\s+\d)/)
          || aria.match(/^View:?\s*(.+)/);
        if (match) {
          const tmp = document.createElement('span');
          tmp.textContent = match[1].trim();
          nameEl = tmp;
        }
        if (!titleEl) {
          const titleMatch = aria.match(/•\s*\S+\s+(.+)$/);
          if (titleMatch) {
            const tmp = document.createElement('span');
            tmp.textContent = titleMatch[1].trim();
            titleEl = tmp;
          }
        }
        break;
      }
    }
  }

  // Strategy 4: New DOM (2026+) — find author via profile links
  // LinkedIn posts with reshare/comment context: "X commented on this" / "X reposted"
  // followed by the actual author. The ACTUAL author typically has a job title nearby.
  // Heuristic: collect all profile links, skip ones in context headers (text containing
  // "commented", "reposted", "likes this", "celebrates this"), pick the best remaining.
  if (!nameEl) {
    const profileLinks = postEl.querySelectorAll('a[href*="/in/"]');
    let bestLink = null;
    let bestScore = 0;
    for (const link of profileLinks) {
      const text = link.textContent.trim();
      if (text.length < 3 || text.length > 50 || text.includes('http')) continue;
      const lower = text.toLowerCase();
      if (lower.includes('view') || lower.includes('follow') || lower.includes('connect')) continue;

      // Check if this link is inside a context header ("X commented on this")
      const parentText = (link.parentElement?.textContent || '').toLowerCase();
      const isContext = /commented|reposted|likes?\s+this|celebrates?\s+this|shared\s+this|suggested|loves?\s+this|supports?\s+this|finds?\s+this\s+funny|finds?\s+this\s+insightful/i.test(parentText) && parentText.length < 100;

      // Score: prefer links NOT in context headers, prefer links with nearby title text
      let score = isContext ? 1 : 10;
      // Check if there's a job title/headline near this link (sibling or nearby element)
      const container = link.closest('div')?.parentElement;
      if (container) {
        const nearbyText = container.textContent || '';
        // Job titles typically contain: |, @, CEO, Founder, Director, Manager, etc.
        if (/\b(CEO|Founder|Director|VP|Manager|Head of|Partner|Lead|Engineer|Consultant|President)\b/i.test(nearbyText)) {
          score += 5;
        }
        // Also boost if there's a "Follow" button nearby — that's the main author area
        if (container.querySelector('button') && /follow/i.test(container.querySelector('button')?.textContent || '')) {
          score += 5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestLink = link;
      }
    }
    if (bestLink) {
      const tmp = document.createElement('span');
      tmp.textContent = bestLink.textContent.trim();
      nameEl = tmp;
      console.log('[Ella] Author from profile link (score=' + bestScore + '):', bestLink.textContent.trim());
    }
  }

  // Strategy 5: aria-label on profile links often contains name
  if (!nameEl) {
    const ariaLinks = postEl.querySelectorAll('a[aria-label]');
    for (const link of ariaLinks) {
      const aria = link.getAttribute('aria-label') || '';
      const href = link.getAttribute('href') || '';
      if (href.includes('/in/')) {
        const match = aria.match(/^(?:View\s+)?(.+?)(?:'s?\s+profile|\s+Premium|\s*$)/i);
        if (match && match[1].length >= 3 && match[1].length <= 50) {
          const tmp = document.createElement('span');
          tmp.textContent = match[1].trim();
          nameEl = tmp;
          break;
        }
      }
    }
  }

  let authorName = nameEl ? nameEl.innerText.trim() : '';
  let authorTitle = titleEl ? titleEl.innerText.trim() : '';

  // Clean up: strip connection degree from name ("Natalie Lemons • 2nd" → "Natalie Lemons")
  authorName = authorName.replace(/\s*•\s*(1st|2nd|3rd|3rd\+|\d+th).*$/i, '').trim();
  // Strip "Premium" badge text if it leaked into the name
  authorName = authorName.replace(/\s*Premium\s*$/i, '').trim();
  // Strip "Verified Profile" and similar badges
  authorName = authorName.replace(/\s*Verified\s*Profile\s*/gi, '').trim();
  // Strip connection degree at the start ("1st", "2nd", etc.)
  authorName = authorName.replace(/^(1st|2nd|3rd|3rd\+|\d+th)\s*/i, '').trim();

  return { author_name: authorName, author_title: authorTitle };
}

/**
 * Parse reaction count from LinkedIn's social counts.
 * Handles: "Zach Newton and 286 others" → 287 (286 + 1)
 *          "22" → 22
 *          "1,234 reactions" → 1234
 */
function parseReactionCount(text) {
  if (!text) return 0;
  console.log(`[Ella] reactions raw: "${text.replace(/\n/g, '\\n').slice(0, 120)}"`);

  // "Name and X others" → X + 1
  const othersMatch = text.match(/and\s+([\d,.]+[KkMm]?)\s+other/i);
  if (othersMatch) {
    const num = parseEngagementNumber(othersMatch[1]);
    console.log(`[Ella] reactions: "and ${othersMatch[1]} others" → ${num} + 1 = ${num + 1}`);
    return num + 1;
  }

  // Plain number or "X reactions"
  const num = parseEngagementNumber(text);
  console.log(`[Ella] reactions: parsed → ${num}`);
  return num;
}

/**
 * Parse comments and reposts from the social counts bar text.
 * The text might be:
 *   "1 comment · 10 reposts"
 *   "39 comments\n3 reposts"
 *   "Zach Newton and 286 others\n1 comment · 10 reposts"
 * We use regex to find "N comment(s)" and "N repost(s)" anywhere in the text.
 */
function parseCommentsReposts(text) {
  const result = { comments: 0, reposts: 0 };
  if (!text) return result;
  console.log(`[Ella] comments/reposts raw: "${text.replace(/\n/g, '\\n').slice(0, 200)}"`);

  // Match "N comment(s)" anywhere in the text
  const commentMatch = text.match(/([\d,.]+[KkMm]?)\s*comment/i);
  if (commentMatch) {
    result.comments = parseEngagementNumber(commentMatch[1]);
    console.log(`[Ella]   → comments: "${commentMatch[0]}" → ${result.comments}`);
  }

  // Match "N repost(s)" anywhere in the text
  const repostMatch = text.match(/([\d,.]+[KkMm]?)\s*repost/i);
  if (repostMatch) {
    result.reposts = parseEngagementNumber(repostMatch[1]);
    console.log(`[Ella]   → reposts: "${repostMatch[0]}" → ${result.reposts}`);
  }

  // Also try "N shares" in case LinkedIn uses that term
  if (result.reposts === 0) {
    const shareMatch = text.match(/([\d,.]+[KkMm]?)\s*share/i);
    if (shareMatch) {
      result.reposts = parseEngagementNumber(shareMatch[1]);
      console.log(`[Ella]   → shares: "${shareMatch[0]}" → ${result.reposts}`);
    }
  }

  return result;
}

function extractEngagement(postEl) {
  console.log('[Ella] ─── Extracting engagement ───');

  let likes = 0;
  let comments_count = 0;
  let shares = 0;

  // Strategy 1: Legacy social counts bar
  const countsBar = q(postEl, SELECTORS.socialCountsBar);
  if (countsBar) {
    console.log(`[Ella] Social counts bar innerText: "${countsBar.innerText.replace(/\n/g, '\\n').slice(0, 200)}"`);
    const reactionsEl = q(countsBar, SELECTORS.reactionsCountContainer);
    if (reactionsEl) {
      const aria = reactionsEl.getAttribute('aria-label') || '';
      likes = parseReactionCount(aria || reactionsEl.innerText);
    } else {
      likes = parseReactionCount(countsBar.innerText);
    }
    const fullBarText = countsBar.innerText || '';
    const parsed = parseCommentsReposts(fullBarText);
    comments_count = parsed.comments;
    shares = parsed.reposts;
  }

  // Strategy 2: New DOM (2026+) — scan the post's full text for engagement patterns
  if (likes === 0 && comments_count === 0) {
    console.log('[Ella] Legacy selectors failed, scanning post text for engagement...');
    const fullText = postEl.innerText || '';

    // Reactions: "Name and X others" or "X reactions"
    const othersMatch = fullText.match(/and\s+([\d,.]+[KkMm]?)\s+other/i);
    const reactionsMatch = fullText.match(/([\d,.]+[KkMm]?)\s*reaction/i);
    if (othersMatch) {
      likes = parseEngagementNumber(othersMatch[1]) + 1;
      console.log(`[Ella] Reactions from text: "and ${othersMatch[1]} others" → ${likes}`);
    } else if (reactionsMatch) {
      likes = parseEngagementNumber(reactionsMatch[1]);
      console.log(`[Ella] Reactions from text: "${reactionsMatch[0]}" → ${likes}`);
    }

    // Comments
    const commentMatch = fullText.match(/([\d,.]+[KkMm]?)\s*comment/i);
    if (commentMatch) {
      comments_count = parseEngagementNumber(commentMatch[1]);
      console.log(`[Ella] Comments from text: "${commentMatch[0]}" → ${comments_count}`);
    }

    // Reposts
    const repostMatch = fullText.match(/([\d,.]+[KkMm]?)\s*repost/i);
    if (repostMatch) {
      shares = parseEngagementNumber(repostMatch[1]);
      console.log(`[Ella] Reposts from text: "${repostMatch[0]}" → ${shares}`);
    }
  }

  console.log(`[Ella] ─── Final: likes=${likes}, comments=${comments_count}, shares=${shares} ───`);
  return { likes, comments_count, shares };
}

/**
 * Detect which reaction type icons are visible next to the reaction count.
 * LinkedIn shows the top 2-3 reaction types as small icons (img/svg with aria-label).
 * Returns { dominant_types: ["like", "insightful"], total: 22 }
 */
function extractReactionsBreakdown(postEl, totalLikes) {
  const REACTION_TYPES = ['like', 'celebrate', 'support', 'love', 'insightful', 'funny'];
  const dominant_types = [];

  // Find the reactions area (the button/link with the reaction icons + count)
  const reactionsArea = q(postEl, SELECTORS.reactionsArea);
  if (!reactionsArea) return { dominant_types, total: totalLikes };

  // Find all icon elements within the reactions area
  const icons = reactionsArea.querySelectorAll('img[aria-label], img[alt], svg[aria-label]');
  for (const icon of icons) {
    const label = (icon.getAttribute('aria-label') || icon.getAttribute('alt') || '').toLowerCase();
    for (const type of REACTION_TYPES) {
      if (label.includes(type) && !dominant_types.includes(type)) {
        dominant_types.push(type);
      }
    }
  }

  // Also check for reaction type in data attributes or class names
  if (dominant_types.length === 0) {
    const allImgs = reactionsArea.querySelectorAll('img');
    for (const img of allImgs) {
      const src = (img.getAttribute('src') || '').toLowerCase();
      // LinkedIn CDN URLs sometimes contain the reaction type name
      for (const type of REACTION_TYPES) {
        if (src.includes(type) && !dominant_types.includes(type)) {
          dominant_types.push(type);
        }
      }
    }
  }

  return { dominant_types, total: totalLikes };
}

function detectMediaType(postEl) {
  return {
    has_image: !!q(postEl, SELECTORS.imageMedia),
    has_video: !!q(postEl, SELECTORS.videoMedia),
    has_carousel: !!q(postEl, SELECTORS.carouselMedia),
  };
}

function extractHashtags(text) {
  const tags = text.match(/#[\w\u00C0-\u024F]+/g);
  return tags ? tags.join(', ') : '';
}

/**
 * Find a "load more comments" button by checking all buttons in the post
 * for text content that matches common patterns. This is more resilient
 * than relying on specific selectors since LinkedIn changes markup often.
 */
function findLoadMoreButton(container) {
  // First try our known selectors
  const bySelector = q(container, SELECTORS.loadMoreComments);
  if (bySelector) return bySelector;

  // Broader search: find any button whose text suggests loading more comments
  const buttons = container.querySelectorAll('button');
  for (const btn of buttons) {
    const text = (btn.innerText || '').toLowerCase().trim();
    const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
    if (
      /load\s*(more|previous)\s*comment/i.test(text) ||
      /load\s*(more|previous)\s*comment/i.test(aria) ||
      /view\s*(more|previous)\s*comment/i.test(text) ||
      /more\s*comment/i.test(text) ||
      /previous\s*comment/i.test(text)
    ) {
      return btn;
    }
  }
  return null;
}

/**
 * Expand the comments section on a post.
 * The "N comments" text in the social counts bar IS the button that opens
 * comments. We click it, wait for comments to load, then load more.
 */
async function expandComments(postEl) {
  // Build a list of containers to search, from narrow to broad.
  // The social counts bar and comments section may be siblings of postEl,
  // not descendants — so we MUST search broader containers.
  const containers = [postEl];
  const dataUrnParent = postEl.closest('[data-urn]');
  if (dataUrnParent && dataUrnParent !== postEl) containers.push(dataUrnParent);
  // Go one more level up — some LinkedIn layouts nest the data-urn inside another wrapper
  const grandParent = dataUrnParent?.parentElement || postEl.parentElement;
  if (grandParent && !containers.includes(grandParent)) containers.push(grandParent);

  console.log(`[Ella] ─── Comment expansion ───`);
  console.log(`[Ella] Search containers: ${containers.map(c => c.tagName + '.' + (c.className || '').toString().slice(0, 30)).join(' → ')}`);

  const findIn = (sel) => {
    for (const c of containers) {
      const el = c.querySelector(sel);
      if (el) return el;
    }
    return null;
  };

  const findAllIn = (sel) => {
    const set = new Set();
    for (const c of containers) c.querySelectorAll(sel).forEach((e) => set.add(e));
    return [...set];
  };

  const countVisible = () => {
    for (const c of containers) {
      const count = qAll(c, SELECTORS.commentText).length;
      if (count > 0) return count;
    }
    return 0;
  };

  // Step 1: Are comments already in the DOM?
  let preCount = countVisible();
  console.log(`[Ella] Step 1: ${preCount} comments already in DOM`);

  // Step 2: If no comments visible, find and click the "N comments" trigger
  if (preCount === 0) {
    console.log('[Ella] Step 2: Looking for comments trigger to click...');

    // Log the social counts bar HTML so we can see the exact structure
    const countsBar = findIn('.social-details-social-counts') || findIn('[class*="social-details-social-counts"]');
    if (countsBar) {
      console.log(`[Ella] Social counts bar innerHTML (first 500 chars):\n${countsBar.innerHTML.slice(0, 500)}`);
    } else {
      console.log('[Ella] WARNING: No social counts bar found in any container');
    }

    // Strategy A: Find element whose text matches "N comments"
    let trigger = null;
    const allClickables = findAllIn('button, a, span[role="button"], [tabindex="0"]');
    console.log(`[Ella] Found ${allClickables.length} clickable elements to scan`);

    for (const el of allClickables) {
      const text = (el.innerText || '').trim();
      const aria = (el.getAttribute('aria-label') || '').trim();
      if (/\d+\s*comment/i.test(text) || /\d+\s*comment/i.test(aria)) {
        console.log(`[Ella] Step 3: Found comment trigger: <${el.tagName.toLowerCase()}> text="${text.slice(0, 50)}" aria="${aria.slice(0, 50)}"`);
        trigger = el;
        break;
      }
    }

    // Strategy B: Direct selector
    if (!trigger) {
      trigger = findIn('.social-details-social-counts__comments');
      if (trigger) console.log(`[Ella] Step 3: Found via __comments class: "${(trigger.innerText || '').trim().slice(0, 40)}"`);
    }

    // Strategy C: The Comment action button in the toolbar
    if (!trigger) {
      trigger = findIn('button[aria-label="Comment"]') || findIn('button[aria-label="comment"]');
      if (trigger) console.log('[Ella] Step 3: Using Comment toolbar button as fallback');
    }

    if (trigger) {
      console.log('[Ella] Step 4: Clicking trigger...');
      trigger.scrollIntoView({ behavior: 'instant', block: 'center' });
      trigger.click();

      console.log('[Ella] Step 5: Waiting 1500ms for comments to load...');
      await delay(1500);

      preCount = countVisible();
      console.log(`[Ella] Step 6: After click+wait: ${preCount} comments now visible`);

      // If still 0, wait a bit more — LinkedIn can be slow
      if (preCount === 0) {
        console.log('[Ella] Still 0, waiting another 1500ms...');
        await delay(1500);
        preCount = countVisible();
        console.log(`[Ella] After extra wait: ${preCount} comments`);
      }
    } else {
      console.log('[Ella] Step 3: NO comment trigger found anywhere');
      return;
    }
  }

  // Step 7: Click "Load more comments" up to 10 times
  console.log('[Ella] Step 7: Loading more comments...');
  for (let i = 0; i < 10; i++) {
    const beforeCount = countVisible();

    // Re-query DOM each time — LinkedIn replaces the button after each click
    let loadMore = null;
    for (const c of containers) {
      loadMore = findLoadMoreButton(c);
      if (loadMore) break;
    }

    if (!loadMore) {
      console.log(`[Ella] No "load more" button found (after ${i} clicks, ${beforeCount} comments visible)`);
      break;
    }

    console.log(`[Ella] Load more (${i + 1}/10): "${(loadMore.innerText || '').trim().slice(0, 50)}"`);
    loadMore.scrollIntoView({ behavior: 'instant', block: 'center' });
    loadMore.click();
    await delay(1000);

    const afterCount = countVisible();
    console.log(`[Ella] ${beforeCount} → ${afterCount} comments`);

    if (afterCount <= beforeCount) {
      await delay(800);
      if (countVisible() <= beforeCount) break;
    }
  }

  // Step 8: Expand reply threads
  for (let round = 0; round < 3; round++) {
    const replyBtns = new Set();
    for (const sel of SELECTORS.expandReplies) {
      findAllIn(sel).forEach((b) => replyBtns.add(b));
    }
    findAllIn('button').forEach((btn) => {
      const text = (btn.innerText || '').toLowerCase();
      if (/\d+\s*repl(y|ies)/i.test(text) || /see\s*previous/i.test(text)) {
        replyBtns.add(btn);
      }
    });

    if (replyBtns.size === 0) break;
    console.log(`[Ella] Expanding ${replyBtns.size} reply threads (round ${round + 1}/3)`);
    for (const btn of replyBtns) {
      btn.click();
      await delay(600);
    }
  }

  console.log(`[Ella] ─── Comment expansion done — ${countVisible()} comments captured ───`);
}

/**
 * Clean tracking params from LinkedIn URLs in text.
 * "https://lnkd.in/abc?utm_source=share&utm_medium=member_desktop" → "https://lnkd.in/abc"
 */
function cleanTrackingUrls(text) {
  return text.replace(
    /https?:\/\/[^\s)]+/g,
    (url) => {
      try {
        const u = new URL(url);
        // Strip all utm_ params and LinkedIn tracking params
        for (const key of [...u.searchParams.keys()]) {
          if (/^utm_|^li_|^trk|^midToken|^midSig|^origin/i.test(key)) {
            u.searchParams.delete(key);
          }
        }
        const cleaned = u.toString();
        // If we stripped everything, drop the trailing "?"
        return cleaned.replace(/\?$/, '');
      } catch {
        return url;
      }
    }
  );
}

/**
 * Extract comment texts with optional commenter names.
 * Returns "AuthorName: comment text | AuthorName2: comment text2"
 */
function extractCommentTexts(postEl) {
  // Search postEl and broader containers for comment text elements
  let commentEls = qAll(postEl, SELECTORS.commentText);
  if (commentEls.length === 0) {
    const dataUrnParent = postEl.closest('[data-urn]');
    if (dataUrnParent && dataUrnParent !== postEl) {
      commentEls = qAll(dataUrnParent, SELECTORS.commentText);
    }
  }
  if (commentEls.length === 0) {
    const grandParent = postEl.closest('[data-urn]')?.parentElement || postEl.parentElement;
    if (grandParent) commentEls = qAll(grandParent, SELECTORS.commentText);
  }
  if (commentEls.length === 0) return '';

  const comments = [];
  for (const textEl of commentEls) {
    let text = textEl.innerText.trim();
    if (!text) continue;

    // Clean tracking URLs
    text = cleanTrackingUrls(text);

    // Try to find the commenter name near this comment
    const commentItem = textEl.closest('[class*="comments-comment-item"], [class*="comment-entity"]');
    let authorName = '';
    if (commentItem) {
      const authorEl = q(commentItem, SELECTORS.commentAuthor);
      if (authorEl) authorName = authorEl.innerText.trim();
    }

    comments.push(authorName ? `${authorName}: ${text}` : text);
  }

  console.log(`[Ella] Captured ${comments.length} comments`);
  return comments.join(' | ');
}

/**
 * Full DOM extraction. Returns an object matching the posts table schema.
 */
async function extractPostData(postEl) {
  await expandSeeMore(postEl);

  const postText = extractPostText(postEl);
  const author = extractAuthorInfo(postEl);
  const engagement = extractEngagement(postEl);
  const reactionsBreakdown = extractReactionsBreakdown(postEl, engagement.likes);
  const media = detectMediaType(postEl);
  const hashtags = extractHashtags(postText);

  // Always expand and capture comments if there are any
  if (engagement.comments_count > 0) {
    await expandComments(postEl);
  }
  const commentTexts = extractCommentTexts(postEl);

  return {
    post_text: postText,
    ...author,
    ...engagement,
    ...media,
    hashtags,
    comment_texts: commentTexts,
    reactions_breakdown: reactionsBreakdown,
  };
}

/**
 * Check if DOM extraction got enough data, or if we need Vision fallback.
 */
function isExtractionComplete(data) {
  return data.post_text && data.post_text.length > 10;
}

// ─── LINKEDIN PROFILE EXTRACTION ──────────────────────────

/**
 * Extract the current user's LinkedIn profile data.
 * Must be called when the user is viewing their own profile page.
 */
async function extractLinkedInProfile() {
  console.log('[Ella Profile] Starting extraction on:', location.href);

  // Scroll down to trigger lazy-loading of About, Experience, etc.
  console.log('[Ella Profile] Scrolling to load sections...');
  for (let y = 0; y <= 3000; y += 500) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await delay(300);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  await delay(500);

  // Expand "about" section if truncated
  const aboutSeeMore = q(document, SELECTORS.profileAboutSeeMore);
  if (aboutSeeMore) {
    console.log('[Ella Profile] Clicking About "see more"');
    aboutSeeMore.click();
    await delay(400);
  }

  // Name — try selectors, then fall back to page title
  let nameEl = q(document, SELECTORS.profileName);
  console.log('[Ella Profile] Name:', nameEl ? `"${nameEl.innerText.trim()}"` : 'NOT FOUND with selectors');
  if (!nameEl) {
    // Fallback: h1 on the page
    const h1s = document.querySelectorAll('h1');
    for (const h1 of h1s) {
      const text = h1.innerText.trim();
      if (text && text.length > 2 && text.length < 60 && !text.includes('LinkedIn')) {
        nameEl = h1;
        console.log('[Ella Profile] Name from h1 fallback:', `"${text}"`);
        break;
      }
    }
  }

  // Headline
  let headlineEl = q(document, SELECTORS.profileHeadline);
  console.log('[Ella Profile] Headline:', headlineEl ? `"${headlineEl.innerText.trim()}"` : 'NOT FOUND');
  if (!headlineEl) {
    // Fallback: look for text-body-medium near the name
    const candidates = document.querySelectorAll('.text-body-medium, [class*="text-body-medium"]');
    for (const el of candidates) {
      const text = el.innerText.trim();
      if (text && text.length > 5 && text.length < 200 && text !== nameEl?.innerText?.trim()) {
        headlineEl = el;
        console.log('[Ella Profile] Headline from fallback:', `"${text.slice(0, 60)}"`);
        break;
      }
    }
  }

  // About
  let aboutEl = q(document, SELECTORS.profileAbout);
  console.log('[Ella Profile] About:', aboutEl ? `"${aboutEl.innerText.trim().slice(0, 60)}..."` : 'NOT FOUND');
  if (!aboutEl) {
    // Fallback: find the about section by its heading
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      const container = aboutSection.closest('section') || aboutSection.parentElement?.parentElement;
      if (container) {
        const spans = container.querySelectorAll('span[aria-hidden="true"], .break-words');
        for (const span of spans) {
          const text = span.innerText.trim();
          if (text.length > 50) { aboutEl = span; console.log('[Ella Profile] About from #about section fallback'); break; }
        }
      }
    }
  }

  // Location
  const locationEl = q(document, SELECTORS.profileLocation);
  console.log('[Ella Profile] Location:', locationEl ? `"${locationEl.innerText.trim()}"` : 'NOT FOUND');

  // Experience
  let experienceEls = qAll(document, SELECTORS.profileExperience).slice(0, 5);
  console.log('[Ella Profile] Experience items:', experienceEls.length);
  if (experienceEls.length === 0) {
    // Fallback: find experience section
    const expSection = document.querySelector('#experience');
    if (expSection) {
      const container = expSection.closest('section') || expSection.parentElement?.parentElement;
      if (container) {
        experienceEls = Array.from(container.querySelectorAll('li[class*="artdeco-list__item"], [class*="pvs-entity"]')).slice(0, 5);
        console.log('[Ella Profile] Experience from #experience fallback:', experienceEls.length);
      }
    }
  }

  const experience = experienceEls.map((el) => {
    const title = q(el, SELECTORS.profileExperienceTitle);
    const company = q(el, SELECTORS.profileExperienceCompany);
    return {
      title: title ? title.innerText.trim() : '',
      company: company ? company.innerText.trim() : '',
    };
  }).filter((e) => e.title || e.company);
  console.log('[Ella Profile] Parsed experience:', experience.length, 'entries');

  // Followers
  let followers = '';
  const followerEl = q(document, SELECTORS.profileFollowers);
  if (followerEl) {
    const parentText = followerEl.closest('span, div')?.innerText || '';
    if (/follower/i.test(parentText)) {
      followers = followerEl.innerText.trim();
    }
  }
  // Fallback: search for "followers" text anywhere in the top card
  if (!followers) {
    const allSmallText = document.querySelectorAll('.text-body-small, [class*="text-body-small"]');
    for (const el of allSmallText) {
      const text = el.innerText || '';
      const match = text.match(/([\d,.]+[KkMm]?)\s*follower/i);
      if (match) { followers = match[1]; console.log('[Ella Profile] Followers from text scan:', followers); break; }
    }
  }
  console.log('[Ella Profile] Followers:', followers || 'NOT FOUND');

  const result = {
    name: nameEl ? nameEl.innerText.trim() : '',
    headline: headlineEl ? headlineEl.innerText.trim() : '',
    about: aboutEl ? aboutEl.innerText.trim() : '',
    location: locationEl ? locationEl.innerText.trim() : '',
    experience,
    followers,
    captured_at: new Date().toISOString(),
  };

  console.log('[Ella Profile] Final result:', JSON.stringify(result).slice(0, 300));
  return result;
}

// ─── SCREENSHOT CAPTURE ───────────────────────────────────

const LINKEDIN_NAV_HEIGHT = 52; // Fixed top nav bar

/**
 * Capture a screenshot of a post element.
 * For posts taller than the viewport, scroll-captures and stitches sections.
 */
async function capturePostScreenshot(postEl) {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  // Scroll post into view first
  postEl.scrollIntoView({ behavior: 'instant', block: 'start' });
  await delay(300);

  const postRect = postEl.getBoundingClientRect();
  const postAbsTop = postRect.top + window.scrollY;
  const postHeight = postRect.height;
  const postWidth = postRect.width;
  const postLeft = postRect.left;

  // Effective viewport area below the fixed nav
  const effectiveTop = LINKEDIN_NAV_HEIGHT;
  const effectiveHeight = viewportHeight - effectiveTop;

  // Single capture if post fits in viewport
  const needsScrollCapture = postHeight > effectiveHeight;

  const sections = [];

  if (!needsScrollCapture) {
    // Scroll so post is fully visible below nav
    window.scrollTo({
      top: postAbsTop - effectiveTop - 8,
      behavior: 'instant',
    });
    await delay(200);

    const resp = await chrome.runtime.sendMessage({ action: 'captureTab' });
    if (!resp?.dataUrl) throw new Error('Screenshot capture failed');

    const rect = postEl.getBoundingClientRect();
    sections.push({
      dataUrl: resp.dataUrl,
      cropX: rect.left,
      cropY: rect.top,
      cropWidth: rect.width,
      cropHeight: rect.height,
      destY: 0,
    });
  } else {
    // Scroll-capture: capture the post in sections
    let captured = 0;
    let safety = 0;
    const maxIterations = Math.ceil(postHeight / effectiveHeight) + 2;

    while (captured < postHeight && safety < maxIterations) {
      safety++;

      // Scroll so the next uncaptured portion aligns with the top of the effective area
      const scrollTarget = postAbsTop + captured - effectiveTop;
      window.scrollTo({ top: scrollTarget, behavior: 'instant' });
      await delay(200);

      const rect = postEl.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, effectiveTop);
      const visibleBottom = Math.min(rect.bottom, viewportHeight);
      const visibleHeight = visibleBottom - visibleTop;

      if (visibleHeight <= 0) break;

      const resp = await chrome.runtime.sendMessage({ action: 'captureTab' });
      if (!resp?.dataUrl) break;

      sections.push({
        dataUrl: resp.dataUrl,
        cropX: rect.left,
        cropY: visibleTop,
        cropWidth: rect.width,
        cropHeight: visibleHeight,
        destY: captured,
      });

      captured += visibleHeight;
    }
  }

  if (sections.length === 0) throw new Error('No sections captured');

  // Stitch sections on a canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(postWidth * dpr);
  canvas.height = Math.round(postHeight * dpr);
  const ctx = canvas.getContext('2d');

  for (const section of sections) {
    const img = await loadImage(section.dataUrl);
    ctx.drawImage(
      img,
      Math.round(section.cropX * dpr),
      Math.round(section.cropY * dpr),
      Math.round(section.cropWidth * dpr),
      Math.round(section.cropHeight * dpr),
      0,
      Math.round(section.destY * dpr),
      Math.round(section.cropWidth * dpr),
      Math.round(section.cropHeight * dpr)
    );
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

// ─── CAPTURE FLOW ─────────────────────────────────────────

async function handleCapture(postEl, button) {
  // Check auth
  const authResp = await chrome.runtime.sendMessage({ action: 'getAuthState' });
  if (!authResp?.loggedIn) {
    showToast('Log in to Ella first (click the extension icon)', 'error');
    return;
  }

  // Set loading state
  const originalHTML = button.innerHTML;
  button.innerHTML = '<span class="ella-spinner"></span> Capturing…';
  button.classList.add('ella-capture-btn--loading');

  try {
    // 1. DOM extraction
    let postData = await extractPostData(postEl);

    // 2. Capture screenshot
    let screenshotDataUrl = null;
    try {
      screenshotDataUrl = await capturePostScreenshot(postEl);
    } catch (err) {
      console.warn('[Ella] Screenshot capture failed:', err.message);
    }

    // 3. Vision fallback if DOM extraction is incomplete
    if (!isExtractionComplete(postData) && screenshotDataUrl) {
      showToast('DOM extraction incomplete — using Vision fallback…', 'info');
      try {
        const visionResp = await chrome.runtime.sendMessage({
          action: 'visionExtract',
          data: { imageDataUrl: screenshotDataUrl },
        });
        if (visionResp?.success && visionResp.postData) {
          // Merge: prefer Vision data for empty fields, keep DOM data where available
          const vision = visionResp.postData;
          for (const key of Object.keys(vision)) {
            if (vision[key] && (!postData[key] || postData[key] === '' || postData[key] === 0)) {
              postData[key] = vision[key];
            }
          }
        }
      } catch (err) {
        console.warn('[Ella] Vision fallback failed:', err.message);
      }
    }

    // 4. Final check — must have post text
    if (!postData.post_text || postData.post_text.length < 10) {
      throw new Error('Could not extract post text. LinkedIn may have changed their markup.');
    }

    // 5. Save to Supabase
    const saveResp = await chrome.runtime.sendMessage({
      action: 'savePost',
      data: { postData, screenshotDataUrl },
    });

    if (!saveResp?.success) {
      throw new Error(saveResp?.error || 'Failed to save post');
    }

    // Success
    button.innerHTML = '&#10003; Captured!';
    button.classList.remove('ella-capture-btn--loading');
    button.classList.add('ella-capture-btn--success');
    showToast('Post captured and saved to Ella!', 'success');

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('ella-capture-btn--success');
    }, 3000);
  } catch (err) {
    console.error('[Ella] Capture failed:', err);
    button.innerHTML = 'Retry';
    button.classList.remove('ella-capture-btn--loading');
    button.classList.add('ella-capture-btn--error');
    showToast(`Capture failed: ${err.message}`, 'error');

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('ella-capture-btn--error');
    }, 4000);
  }
}

// ─── BUTTON INJECTION ─────────────────────────────────────

function injectCaptureButton(postEl) {
  if (postEl.dataset.ellaProcessed) return;
  postEl.dataset.ellaProcessed = 'true';

  // Ensure the post container is positioned for absolute button placement
  const style = window.getComputedStyle(postEl);
  if (style.position === 'static') {
    postEl.style.position = 'relative';
  }

  // Check engagement for high-performer detection
  // Strategy 1: Legacy social counts bar
  let reactionCount = 0;
  const countsBar = postEl.querySelector('.social-details-social-counts')
    || postEl.closest('[data-urn]')?.querySelector('.social-details-social-counts');
  if (countsBar) {
    const barText = countsBar.innerText || '';
    const othersMatch = barText.match(/and\s+([\d,.]+[KkMm]?)\s+other/i);
    const directMatch = barText.match(/([\d,.]+[KkMm]?)\s*reaction/i);
    if (othersMatch) {
      const cleaned = othersMatch[1].replace(/,/g, '');
      reactionCount = parseFloat(cleaned) + 1;
      if (/[Kk]/.test(othersMatch[1])) reactionCount = parseFloat(cleaned) * 1000 + 1;
    } else if (directMatch) {
      const cleaned = directMatch[1].replace(/,/g, '');
      reactionCount = parseFloat(cleaned);
      if (/[Kk]/.test(directMatch[1])) reactionCount = parseFloat(cleaned) * 1000;
    }
  }
  // Strategy 2: New DOM — scan post text for "X reactions" or "and X others"
  if (reactionCount === 0) {
    const postText = postEl.innerText || '';
    const othersMatch = postText.match(/and\s+([\d,.]+[KkMm]?)\s+other/i);
    const reactMatch = postText.match(/([\d,.]+[KkMm]?)\s*reaction/i);
    if (othersMatch) reactionCount = parseEngagementNumber(othersMatch[1]) + 1;
    else if (reactMatch) reactionCount = parseEngagementNumber(reactMatch[1]);
  }
  // Apply hot styling
  chrome.storage.local.get('hotThreshold').then(({ hotThreshold }) => {
    const threshold = hotThreshold || 100;
    if (reactionCount >= threshold) {
      postEl.classList.add('ella-post--hot');
      btn.classList.add('ella-capture-btn--hot');
      btn.innerHTML = '&#x1F525; Capture';
    }
  });

  const btn = document.createElement('button');
  btn.className = 'ella-capture-btn';
  btn.innerHTML = '&#x1F99C; Capture';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleCapture(postEl, btn);
  });

  postEl.appendChild(btn);
}

function findAllPosts() {
  const found = new Set();

  // Strategy 1: Find posts via reaction buttons (LinkedIn 2026+ obfuscated DOM)
  // Each post has a button with aria-label containing "Reaction button" or "reaction"
  // Walk up to the nearest role="listitem" ancestor — that's the post container.
  const reactionBtns = document.querySelectorAll('button[aria-label*="Reaction button"], button[aria-label*="reaction"]');
  for (const btn of reactionBtns) {
    const listItem = btn.closest('[role="listitem"]');
    if (listItem) found.add(listItem);
  }

  // Strategy 2: Legacy selectors (pre-2026 LinkedIn DOM)
  for (const sel of SELECTORS.post) {
    document.querySelectorAll(sel).forEach((el) => found.add(el));
  }

  // Strategy 3: Structural fallback — social counts bar
  const socialCountBars = document.querySelectorAll('.social-details-social-counts');
  for (const bar of socialCountBars) {
    let container = bar.closest('[data-urn]') || bar.closest('.feed-shared-update-v2') || bar.closest('[role="listitem"]');
    if (!container) {
      let el = bar.parentElement;
      for (let depth = 0; depth < 6 && el; depth++) {
        if (el.querySelector('.update-components-actor')) { container = el; break; }
        el = el.parentElement;
      }
    }
    if (container) found.add(container);
  }

  return [...found];
}

function processNewPosts() {
  const posts = findAllPosts();
  const unprocessed = posts.filter((p) => !p.dataset.ellaProcessed);
  if (unprocessed.length > 0) {
    console.log(`[Ella] Found ${posts.length} posts, ${unprocessed.length} new — injecting buttons`);
  }
  unprocessed.forEach(injectCaptureButton);

  // Show bulk capture bar on pages with many posts
  maybeShowBulkBar();
}

// ─── MUTATION OBSERVER + SPA NAVIGATION ───────────────────

let debounceTimer = null;
const DEBOUNCE_MS = 300;

function debouncedProcess() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(processNewPosts, DEBOUNCE_MS);
}

function init() {
  console.log(`[Ella] Content script init @ ${location.href}`);

  // Process posts already on the page
  processNewPosts();

  // Watch the entire document for new nodes
  const observer = new MutationObserver((mutations) => {
    let hasNewNodes = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        hasNewNodes = true;
        break;
      }
    }
    if (hasNewNodes) debouncedProcess();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // SPA navigation detection — LinkedIn uses pushState/replaceState.
  // Fire aggressive re-scans on ALL URL changes. LinkedIn has too many
  // page types to enumerate — posts can appear anywhere.
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log(`[Ella] SPA navigation: ${lastUrl}`);

      // Always do aggressive re-scanning — posts can appear on any page
      [500, 1000, 1500, 2500, 4000].forEach((ms) => setTimeout(() => {
        processNewPosts();
      }, ms));
    }
  }, 500);

  // Also intercept pushState/replaceState for immediate detection
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    setTimeout(processNewPosts, 500);
  };
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    setTimeout(processNewPosts, 500);
  };
  window.addEventListener('popstate', () => setTimeout(processNewPosts, 500));
}

// ─── BULK CAPTURE ─────────────────────────────────────────

let bulkBar = null;

function showBulkBar() {
  if (bulkBar) return; // already showing

  const posts = findAllPosts();
  const uncaptured = posts.filter((p) => !p.dataset.ellaCaptured);
  if (uncaptured.length < 2) return;

  bulkBar = document.createElement('div');
  bulkBar.className = 'ella-bulk-bar';
  bulkBar.innerHTML = `
    <span>Ella found <span class="ella-bulk-bar__count">${uncaptured.length}</span> posts on this page</span>
    <button class="ella-bulk-bar__btn ella-bulk-bar__btn--capture" id="ella-bulk-go">Capture All</button>
    <button class="ella-bulk-bar__btn ella-bulk-bar__btn--close" id="ella-bulk-close">×</button>
    <span class="ella-bulk-bar__progress" id="ella-bulk-progress" style="display:none"></span>
  `;
  document.body.appendChild(bulkBar);

  document.getElementById('ella-bulk-close').addEventListener('click', () => {
    bulkBar.remove();
    bulkBar = null;
  });

  document.getElementById('ella-bulk-go').addEventListener('click', async () => {
    const goBtn = document.getElementById('ella-bulk-go');
    const progressEl = document.getElementById('ella-bulk-progress');
    goBtn.disabled = true;
    goBtn.textContent = 'Capturing...';
    progressEl.style.display = 'inline';

    // Check auth first
    const authResp = await chrome.runtime.sendMessage({ action: 'getAuthState' });
    if (!authResp?.loggedIn) {
      showToast('Log in to Ella first', 'error');
      goBtn.disabled = false;
      goBtn.textContent = 'Capture All';
      return;
    }

    const allPosts = findAllPosts();
    const toCap = allPosts.filter((p) => !p.dataset.ellaCaptured);
    let captured = 0;
    let failed = 0;

    for (const postEl of toCap) {
      progressEl.textContent = `${captured + 1} of ${toCap.length}...`;
      try {
        // Quick extraction — no comment expansion, no screenshot (bulk mode)
        await expandSeeMore(postEl);
        const postText = extractPostText(postEl);
        if (!postText || postText.length < 10) { failed++; continue; }

        const author = extractAuthorInfo(postEl);
        const engagement = extractEngagement(postEl);
        const reactionsBreakdown = extractReactionsBreakdown(postEl, engagement.likes);
        const media = detectMediaType(postEl);
        const hashtags = extractHashtags(postText);

        const postData = {
          post_text: postText,
          ...author,
          ...engagement,
          ...media,
          hashtags,
          comment_texts: '',
          reactions_breakdown: reactionsBreakdown,
          capture_method: 'bulk',
        };

        const saveResp = await chrome.runtime.sendMessage({
          action: 'savePost',
          data: { postData, screenshotDataUrl: null },
        });

        if (saveResp?.success) {
          captured++;
          postEl.dataset.ellaCaptured = 'true';
          // Update the button on this post
          const btn = postEl.querySelector('.ella-capture-btn');
          if (btn) {
            btn.innerHTML = '&#10003; Captured';
            btn.classList.add('ella-capture-btn--success');
          }
        } else {
          failed++;
        }
      } catch (err) {
        console.warn('[Ella] Bulk capture failed for post:', err.message);
        failed++;
      }
      // Small delay between saves to avoid rate limiting
      await delay(300);
    }

    showToast(`Captured ${captured} posts${failed ? ` (${failed} failed)` : ''}`, 'success');
    progressEl.style.display = 'none';
    goBtn.textContent = `Done (${captured})`;

    // Remove bar after 3s
    setTimeout(() => { if (bulkBar) { bulkBar.remove(); bulkBar = null; } }, 3000);
  });
}

// Bulk bar is now triggered from the extension popup, not auto-shown.
function maybeShowBulkBar() {
  // No-op — kept for compatibility. Bulk capture triggered via popup.
}

// ─── MESSAGE LISTENER ─────────────────────────────────────
// Background worker sends messages to trigger profile extraction.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'extractProfile') {
    // Scroll to load everything, expand sections, then extract raw text from the page
    (async () => {
      try {
        // Deep scroll — LinkedIn lazy-loads aggressively on profile pages
        // Profiles can be 5000-8000px tall. Scroll 700px at a time with 1000ms waits.
        console.log('[Ella Profile] Starting deep scroll...');
        let scrollStep = 0;
        let lastHeight = 0;
        // First pass: scroll the entire page
        for (let y = 0; y <= 10000; y += 700) {
          window.scrollTo({ top: y, behavior: 'instant' });
          scrollStep++;
          await delay(1000);
        }
        console.log(`[Ella Profile] First pass: ${scrollStep} scrolls, page height: ${document.body.scrollHeight}px`);

        // Second pass: page may have grown, scroll any new content
        let currentHeight = document.body.scrollHeight;
        while (currentHeight > lastHeight) {
          lastHeight = currentHeight;
          for (let y = lastHeight - 700; y <= currentHeight + 700; y += 700) {
            window.scrollTo({ top: y, behavior: 'instant' });
            scrollStep++;
            await delay(1000);
          }
          currentHeight = document.body.scrollHeight;
        }
        console.log(`[Ella Profile] Total: ${scrollStep} scrolls, final height: ${document.body.scrollHeight}px`);

        // Click all expand buttons — "Show all X experiences", "see more", etc.
        console.log('[Ella Profile] Expanding sections...');
        let clicked = 0;
        for (let pass = 0; pass < 4; pass++) {
          const buttons = document.querySelectorAll(
            'button[aria-expanded="false"], a[id*="show-all"], button[class*="inline-show-more"], a[class*="show-all"], button[class*="see-more"], button[aria-label*="Show all"], a[href*="details/experience"], a[href*="details/education"], a[href*="details/skills"], a[href*="details/certifications"]'
          );
          let passClicks = 0;
          for (const btn of buttons) {
            const text = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase();
            if (text.includes('see more') || text.includes('show all') || text.includes('experience') || text.includes('education') || text.includes('skill') || text.includes('certification') || text.includes('license') || text.includes('more role') || text.includes('more position') || text.includes('show') || btn.matches('a[href*="details/"]')) {
              btn.click();
              clicked++;
              passClicks++;
              await delay(600);
            }
          }
          console.log(`[Ella Profile] Expand pass ${pass + 1}: clicked ${passClicks} buttons`);
          if (passClicks === 0 && pass > 0) break;
          // Scroll again to load expanded content
          for (let y = 0; y <= document.body.scrollHeight; y += 700) {
            window.scrollTo({ top: y, behavior: 'instant' });
            await delay(500);
          }
        }
        console.log(`[Ella Profile] Total expand clicks: ${clicked}`);

        window.scrollTo({ top: 0, behavior: 'instant' });
        await delay(300);

        // Extract raw text from the main profile column
        // Find the main content area (left column, not the sidebar)
        const mainContent = document.querySelector('main') || document.querySelector('.scaffold-layout__main') || document.body;

        // Extract text section by section using known section IDs
        const sections = {};

        // Name + headline from the top card
        const h1 = mainContent.querySelector('h1');
        sections.name = h1 ? h1.innerText.trim() : '';

        // Headline — usually .text-body-medium near the h1
        const headlineEl = mainContent.querySelector('.text-body-medium.break-words') || mainContent.querySelector('[class*="text-body-medium"]');
        sections.headline = headlineEl ? headlineEl.innerText.trim() : '';

        // Location
        const locEl = mainContent.querySelector('.text-body-small.inline.t-black--light.break-words');
        sections.location = locEl ? locEl.innerText.trim() : '';

        // Get the full text content of each profile section by its anchor ID
        const sectionIds = ['about', 'experience', 'education', 'licenses_and_certifications', 'skills', 'projects'];
        for (const secId of sectionIds) {
          const anchor = document.getElementById(secId);
          if (anchor) {
            const section = anchor.closest('section') || anchor.parentElement?.closest('section') || anchor.parentElement?.parentElement;
            if (section) {
              // Get all visible text, filtering out hidden elements
              const clone = section.cloneNode(true);
              clone.querySelectorAll('.visually-hidden, .sr-only').forEach(el => el.remove());
              sections[secId] = clone.innerText.trim();
              console.log(`[Ella Profile] Found #${secId}: ${sections[secId].length} chars`);
            }
          }
        }

        // Follower/connection counts
        const allSmall = mainContent.querySelectorAll('.text-body-small, [class*="text-body-small"]');
        for (const el of allSmall) {
          const text = el.innerText || '';
          if (/follower/i.test(text)) {
            const match = text.match(/([\d,.]+[KkMm]?)\s*follower/i);
            if (match) sections.followers = match[1];
          }
          if (/connection/i.test(text)) {
            const match = text.match(/([\d,.]+)\s*connection/i);
            if (match) sections.connections = match[1];
          }
        }

        const totalHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        console.log(`[Ella Profile] Extracted sections:`, Object.keys(sections).filter(k => sections[k]).join(', '));
        console.log(`[Ella Profile] Name: "${sections.name}", Headline: "${sections.headline?.slice(0, 50)}..."`);

        sendResponse({
          success: true,
          pageHeight: totalHeight,
          rawSections: sections,
        });
      } catch (err) {
        console.error('[Ella Profile]', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
  if (msg.action === 'triggerBulkCapture') {
    showBulkBar();
    sendResponse({ success: true });
    return false;
  }
});

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
