/* ═══════════════════════════════════════════════════════════
   FEATURE EXTRACTION — V2
   Structural, content depth, hook, CTA, formatting, media,
   and hashtag features from post text + metadata.
   ═══════════════════════════════════════════════════════════ */

const NEGATIVE_HOOK_WORDS = /\b(mistake|wrong|secret|truth|stop|never|fail|lose|problem|myth|lie|avoid|worst|broken|toxic|dead|dying)\b/i;
const POSITIVE_HOOK_WORDS = /\b(love|best|amazing|win|success|breakthrough|unlock|transform|powerful|brilliant)\b/i;
const CTA_DISAGREEMENT = /\b(agree or disagree|am i wrong|controversial|unpopular|debate|fight me|change my mind|prove me wrong|hot take)\b/i;

/**
 * Extract all features from a post's text.
 * Accepts the raw text string. Media/hashtag/engagement features
 * are added separately in the pipeline from the full post object.
 */
export function extractFeatures(text) {
  const lines = text.split(/\n/).filter((l) => l.trim());
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const firstLine = lines[0] || "";
  const lastLine = lines[lines.length - 1] || "";
  const lastParagraph = paragraphs[paragraphs.length - 1] || lastLine;

  // ─── Basic structural ─────────────────────────────────
  const charCount = text.length;
  const wordCount = words.length;
  const lineCount = lines.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;

  const wordsPerLine = lines.map((l) => l.split(/\s+/).filter(Boolean).length);
  const avgWordsPerLine = lineCount ? wordCount / lineCount : 0;
  const shortParas = lines.filter((l) => l.split(/\s+/).length <= 8).length;

  const paraWordCounts = paragraphs.map((p) => p.split(/\s+/).filter(Boolean).length);
  const longestParagraphWords = Math.max(...paraWordCounts, 0);
  const shortestParagraphWords = Math.min(...(paraWordCounts.length ? paraWordCounts : [0]));
  const avgParaWords = paraWordCounts.length ? paraWordCounts.reduce((a, b) => a + b, 0) / paraWordCounts.length : 0;
  const paragraphVariance = paraWordCounts.length > 1
    ? Math.sqrt(paraWordCounts.reduce((sum, w) => sum + (w - avgParaWords) ** 2, 0) / paraWordCounts.length)
    : 0;

  // ─── Content signals ──────────────────────────────────
  const questions = (text.match(/\?/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const emojiMatches = text.match(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F900}-\u{1F9FF}]/gu) || [];
  const emojis = emojiMatches.length;
  const emojiDensity = wordCount > 0 ? +((emojis / wordCount) * 100).toFixed(2) : 0;
  const hashtagMatches = text.match(/#[\w]+/g) || [];
  const hashtagCount = hashtagMatches.length;
  const mentions = (text.match(/@[\w]+/g) || []).length;
  const numbersUsed = (text.match(/\d+%?/g) || []).length;
  const allUrls = text.match(/https?:\/\/\S+/g) || [];
  const urls = allUrls.length;
  const hasExternalLink = allUrls.some((u) => !u.includes("lnkd.in")) ? 1 : 0;
  const hasLinkedinLink = allUrls.some((u) => u.includes("lnkd.in")) ? 1 : 0;
  const personalPronouns = (text.match(/\b(i|my|me|we|our|us)\b/gi) || []).length;
  const readingTimeSeconds = Math.round((wordCount / 238) * 60);
  const mentionCount = mentions;

  // ─── Formatting ───────────────────────────────────────
  const hasList = /^[\s]*[-•*]\s/m.test(text) ? 1 : 0;
  const usesBulletPoints = /^[\s]*[-•*]\s/m.test(text) ? 1 : 0;
  const usesNumberedList = /^[\s]*\d+[.)]\s/m.test(text) ? 1 : 0;
  const usesLineBreaks = paragraphCount > 1 ? 1 : 0;
  const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).filter((w) => w.length > 1).length;
  const whitespaceRatio = +(text.split(/\n\n+/).length / Math.max(lineCount, 1)).toFixed(2);

  // ─── Hashtag position ─────────────────────────────────
  const lastLineText = lastLine.trim();
  const hashtagsInLastLine = (lastLineText.match(/#[\w]+/g) || []).length;
  const hashtagAtEnd = hashtagCount > 0 && hashtagsInLastLine === hashtagCount ? 1 : 0;

  // ─── Hook features ────────────────────────────────────
  const hookWordCount = firstLine.split(/\s+/).filter(Boolean).length;
  const hookCharCount = firstLine.length;
  const hookUnderFold = hookCharCount <= 210 ? 1 : 0;
  const hookHasNumber = /\d/.test(firstLine) ? 1 : 0;
  const hookHasQuestion = /\?/.test(firstLine) ? 1 : 0;
  const hookHasColon = /:/.test(firstLine) ? 1 : 0;
  const hookIsBoldClaim = /^(most|every|nobody|the truth|here's what|stop|unpopular|hot take|controversial|i'm convinced|the real reason)/i.test(firstLine) ? 1 : 0;
  const hookIsStory = /^(last|yesterday|i was|i just|when i|a few|this morning|three years|two years|five years|i remember|story time|true story)/i.test(firstLine) ? 1 : 0;
  const hookIsQuestion = hookHasQuestion;
  const hookIsNumber = /^\d/.test(firstLine) ? 1 : 0;

  let hookSentiment = 0; // -1 negative, 0 neutral, 1 positive
  if (NEGATIVE_HOOK_WORDS.test(firstLine)) hookSentiment = -1;
  else if (POSITIVE_HOOK_WORDS.test(firstLine)) hookSentiment = 1;

  // ─── CTA features ────────────────────────────────────
  // Use the last 2 lines as CTA text — LinkedIn posts often end with a question
  // on the second-to-last line and hashtags on the last. Check both.
  const lastTwoLines = lines.slice(-2).join(" ");
  const ctaText = lastTwoLines || lastLine;
  const ctaWordCount = ctaText.split(/\s+/).filter(Boolean).length;
  // Check last line AND second-to-last for question marks (hashtag lines don't have ?)
  const ctaIsQuestion = (/\?/.test(lastLine) || (lines.length >= 2 && /\?/.test(lines[lines.length - 2]))) ? 1 : 0;
  const ctaIsOpenEnded = /\b(what|how|why|where|when|tell me|share your|describe)\b.*\?/i.test(ctaText) ? 1 : 0;
  const ctaTagsSomeone = /@\w+/.test(ctaText) ? 1 : 0;
  const ctaInvitesDisagreement = CTA_DISAGREEMENT.test(ctaText) ? 1 : 0;
  const lastLineHasQuestion = ctaIsQuestion;
  const lastLineHasCta = /comment|share|tag|follow|agree|disagree|thoughts|think|what do you|let me know|drop|tell me/i.test(ctaText) ? 1 : 0;

  // ─── Media (binary columns filled by pipeline) ────────
  // These default to 0 and get overridden from the post object
  const isImage = 0;
  const isVideo = 0;
  const isCarousel = 0;
  const isTextOnly = 1;

  return {
    // Structural
    char_count: charCount,
    word_count: wordCount,
    line_count: lineCount,
    sentence_count: sentenceCount,
    paragraph_count: paragraphCount,
    avg_words_per_line: +avgWordsPerLine.toFixed(1),
    short_paragraphs: shortParas,
    short_para_ratio: +(shortParas / Math.max(lineCount, 1)).toFixed(2),
    longest_paragraph_words: longestParagraphWords,
    shortest_paragraph_words: shortestParagraphWords,
    paragraph_variance: +paragraphVariance.toFixed(1),
    whitespace_ratio: whitespaceRatio,
    reading_time_seconds: readingTimeSeconds,

    // Content signals
    questions,
    exclamations,
    emojis,
    emoji_density: emojiDensity,
    hashtags: hashtagCount,
    hashtag_at_end: hashtagAtEnd,
    mentions: mentionCount,
    numbers_used: numbersUsed,
    urls,
    has_external_link: hasExternalLink,
    has_linkedin_link: hasLinkedinLink,
    has_list: hasList,
    personal_pronouns: personalPronouns,

    // Formatting
    uses_bullet_points: usesBulletPoints,
    uses_numbered_list: usesNumberedList,
    uses_line_breaks: usesLineBreaks,
    caps_word_count: capsWords,

    // Hook
    hook_word_count: hookWordCount,
    hook_char_count: hookCharCount,
    hook_under_fold: hookUnderFold,
    hook_has_number: hookHasNumber,
    hook_has_question: hookHasQuestion,
    hook_has_colon: hookHasColon,
    hook_is_bold_claim: hookIsBoldClaim,
    hook_is_story: hookIsStory,
    hook_is_question: hookIsQuestion,
    hook_is_number: hookIsNumber,
    hook_sentiment: hookSentiment,
    first_line_length: hookCharCount,
    first_line_words: hookWordCount,

    // CTA
    cta_word_count: ctaWordCount,
    cta_is_question: ctaIsQuestion,
    cta_is_open_ended: ctaIsOpenEnded,
    cta_tags_someone: ctaTagsSomeone,
    cta_invites_disagreement: ctaInvitesDisagreement,
    last_line_has_question: lastLineHasQuestion,
    last_line_has_cta: lastLineHasCta,

    // Media (overridden by pipeline)
    is_image: isImage,
    is_video: isVideo,
    is_carousel: isCarousel,
    is_text_only: isTextOnly,
  };
}

/**
 * Extract individual hashtags from post text as an array.
 */
export function extractHashtagList(text) {
  return (text.match(/#[\w\u00C0-\u024F]+/g) || []).map((h) => h.toLowerCase());
}
