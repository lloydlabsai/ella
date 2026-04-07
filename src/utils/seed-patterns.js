/* ═══════════════════════════════════════════════════════════
   SEED PATTERNS — Industry Baseline Data
   Gives new users immediate value before they've captured
   enough posts for personal ML analysis. Based on LinkedIn
   algorithm research and general industry best practices.
   schema_version: 2, source: "seed"

   Replace placeholder values with real ML-derived patterns
   as you capture posts across industries.
   ═══════════════════════════════════════════════════════════ */

const BASE_PATTERNS = {
  schema_version: 2,
  source: "seed",
  confidence: 20,
  totalPosts: 0,
  topCount: 0,
  bottomCount: 0,
  p80Threshold: 0,
  engagementScores: [],
  avgEngagement: 0,
  topAvgEngagement: 0,
  commentDepth: null,
  reactionPatterns: null,
  contentDepth: null,
  topHashtags: [],
};

function makeSeed(overrides) {
  return { ...BASE_PATTERNS, ...overrides };
}

export const SEED_PATTERNS = {
  "CPG Food & Beverage": makeSeed({
    optimalRanges: {
      word_count: { p25: 120, median: 200, p75: 320 },
      line_count: { p25: 6, median: 10, p75: 16 },
      paragraph_count: { p25: 3, median: 5, p75: 8 },
      reading_time_seconds: { p25: 30, median: 50, p75: 80 },
      hashtags: { p25: 2, median: 3, p75: 5 },
    },
    hookAnalysis: [
      { type: "number", count: 0, avgEngagement: 180 },
      { type: "bold_claim", count: 0, avgEngagement: 160 },
      { type: "story", count: 0, avgEngagement: 140 },
      { type: "question", count: 0, avgEngagement: 120 },
      { type: "other", count: 0, avgEngagement: 80 },
    ],
    ctaAnalysis: [
      { type: "open_ended_question", count: 0, avgEngagement: 170 },
      { type: "call_to_action", count: 0, avgEngagement: 130 },
      { type: "yes_no_question", count: 0, avgEngagement: 110 },
      { type: "statement", count: 0, avgEngagement: 90 },
    ],
    mediaPerformance: [
      { type: "carousel", count: 0, avgEngagement: 200 },
      { type: "image", count: 0, avgEngagement: 160 },
      { type: "text_only", count: 0, avgEngagement: 130 },
      { type: "video", count: 0, avgEngagement: 120 },
    ],
    differentialTerms: [
      { term: "innovation", topScore: 2.1, bottomScore: 0.3, diff: 1.8 },
      { term: "consumer", topScore: 1.9, bottomScore: 0.4, diff: 1.5 },
      { term: "retail", topScore: 1.7, bottomScore: 0.5, diff: 1.2 },
      { term: "launch", topScore: 1.6, bottomScore: 0.4, diff: 1.2 },
      { term: "sustainability", topScore: 1.5, bottomScore: 0.5, diff: 1.0 },
    ],
    bigramDiff: [
      { bigram: "emerging brand", topCount: 4, bottomCount: 0, ratio: 8.0 },
      { bigram: "market share", topCount: 3, bottomCount: 0, ratio: 6.0 },
      { bigram: "private label", topCount: 3, bottomCount: 1, ratio: 3.0 },
    ],
    correlations: [
      { feature: "reading_time_seconds", correlation: 0.42 },
      { feature: "questions", correlation: 0.35 },
      { feature: "paragraph_variance", correlation: 0.28 },
      { feature: "hook_under_fold", correlation: 0.25 },
      { feature: "has_external_link", correlation: -0.31 },
    ],
  }),

  "SaaS / B2B Tech": makeSeed({
    optimalRanges: {
      word_count: { p25: 150, median: 250, p75: 400 },
      line_count: { p25: 8, median: 14, p75: 20 },
      paragraph_count: { p25: 3, median: 6, p75: 9 },
      reading_time_seconds: { p25: 38, median: 63, p75: 100 },
      hashtags: { p25: 2, median: 3, p75: 4 },
    },
    hookAnalysis: [
      { type: "bold_claim", count: 0, avgEngagement: 200 },
      { type: "number", count: 0, avgEngagement: 180 },
      { type: "question", count: 0, avgEngagement: 150 },
      { type: "story", count: 0, avgEngagement: 130 },
      { type: "other", count: 0, avgEngagement: 90 },
    ],
    ctaAnalysis: [
      { type: "open_ended_question", count: 0, avgEngagement: 190 },
      { type: "yes_no_question", count: 0, avgEngagement: 140 },
      { type: "call_to_action", count: 0, avgEngagement: 120 },
      { type: "statement", count: 0, avgEngagement: 80 },
    ],
    mediaPerformance: [
      { type: "carousel", count: 0, avgEngagement: 220 },
      { type: "text_only", count: 0, avgEngagement: 170 },
      { type: "image", count: 0, avgEngagement: 150 },
      { type: "video", count: 0, avgEngagement: 130 },
    ],
    differentialTerms: [
      { term: "revenue", topScore: 2.3, bottomScore: 0.4, diff: 1.9 },
      { term: "pipeline", topScore: 2.0, bottomScore: 0.3, diff: 1.7 },
      { term: "churn", topScore: 1.8, bottomScore: 0.3, diff: 1.5 },
      { term: "founder", topScore: 1.6, bottomScore: 0.4, diff: 1.2 },
      { term: "scaling", topScore: 1.5, bottomScore: 0.5, diff: 1.0 },
    ],
    bigramDiff: [
      { bigram: "product market", topCount: 5, bottomCount: 0, ratio: 10.0 },
      { bigram: "customer success", topCount: 4, bottomCount: 1, ratio: 4.0 },
      { bigram: "series funding", topCount: 3, bottomCount: 0, ratio: 6.0 },
    ],
    correlations: [
      { feature: "reading_time_seconds", correlation: 0.38 },
      { feature: "cta_is_open_ended", correlation: 0.33 },
      { feature: "hook_is_bold_claim", correlation: 0.30 },
      { feature: "personal_pronouns", correlation: 0.22 },
      { feature: "has_external_link", correlation: -0.28 },
    ],
  }),

  "Healthcare": makeSeed({
    optimalRanges: {
      word_count: { p25: 130, median: 210, p75: 300 },
      line_count: { p25: 6, median: 10, p75: 15 },
      paragraph_count: { p25: 3, median: 5, p75: 7 },
      reading_time_seconds: { p25: 33, median: 53, p75: 76 },
      hashtags: { p25: 2, median: 3, p75: 5 },
    },
    hookAnalysis: [
      { type: "story", count: 0, avgEngagement: 170 },
      { type: "number", count: 0, avgEngagement: 160 },
      { type: "bold_claim", count: 0, avgEngagement: 140 },
      { type: "question", count: 0, avgEngagement: 130 },
      { type: "other", count: 0, avgEngagement: 80 },
    ],
    ctaAnalysis: [
      { type: "open_ended_question", count: 0, avgEngagement: 160 },
      { type: "call_to_action", count: 0, avgEngagement: 130 },
      { type: "yes_no_question", count: 0, avgEngagement: 100 },
      { type: "statement", count: 0, avgEngagement: 85 },
    ],
    mediaPerformance: [
      { type: "image", count: 0, avgEngagement: 180 },
      { type: "carousel", count: 0, avgEngagement: 170 },
      { type: "text_only", count: 0, avgEngagement: 140 },
      { type: "video", count: 0, avgEngagement: 120 },
    ],
    differentialTerms: [
      { term: "patient", topScore: 2.0, bottomScore: 0.5, diff: 1.5 },
      { term: "clinical", topScore: 1.8, bottomScore: 0.4, diff: 1.4 },
      { term: "outcomes", topScore: 1.7, bottomScore: 0.5, diff: 1.2 },
    ],
    bigramDiff: [
      { bigram: "patient outcomes", topCount: 4, bottomCount: 0, ratio: 8.0 },
      { bigram: "health equity", topCount: 3, bottomCount: 0, ratio: 6.0 },
    ],
    correlations: [
      { feature: "reading_time_seconds", correlation: 0.40 },
      { feature: "hook_is_story", correlation: 0.32 },
      { feature: "questions", correlation: 0.28 },
      { feature: "has_external_link", correlation: -0.25 },
    ],
  }),

  "General / Other": makeSeed({
    optimalRanges: {
      word_count: { p25: 120, median: 220, p75: 350 },
      line_count: { p25: 6, median: 12, p75: 18 },
      paragraph_count: { p25: 3, median: 5, p75: 8 },
      reading_time_seconds: { p25: 30, median: 55, p75: 88 },
      hashtags: { p25: 2, median: 3, p75: 5 },
    },
    hookAnalysis: [
      { type: "bold_claim", count: 0, avgEngagement: 170 },
      { type: "number", count: 0, avgEngagement: 160 },
      { type: "story", count: 0, avgEngagement: 150 },
      { type: "question", count: 0, avgEngagement: 130 },
      { type: "other", count: 0, avgEngagement: 80 },
    ],
    ctaAnalysis: [
      { type: "open_ended_question", count: 0, avgEngagement: 170 },
      { type: "call_to_action", count: 0, avgEngagement: 130 },
      { type: "yes_no_question", count: 0, avgEngagement: 110 },
      { type: "statement", count: 0, avgEngagement: 85 },
    ],
    mediaPerformance: [
      { type: "carousel", count: 0, avgEngagement: 200 },
      { type: "image", count: 0, avgEngagement: 160 },
      { type: "text_only", count: 0, avgEngagement: 140 },
      { type: "video", count: 0, avgEngagement: 120 },
    ],
    differentialTerms: [],
    bigramDiff: [],
    correlations: [
      { feature: "reading_time_seconds", correlation: 0.38 },
      { feature: "questions", correlation: 0.30 },
      { feature: "hook_under_fold", correlation: 0.25 },
      { feature: "has_external_link", correlation: -0.30 },
    ],
  }),
};

/**
 * Get seed patterns for an industry. Falls back to "General / Other".
 */
export function getSeedPatterns(industry) {
  if (!industry) return SEED_PATTERNS["General / Other"];

  // Exact match
  if (SEED_PATTERNS[industry]) return SEED_PATTERNS[industry];

  // Fuzzy match
  const lower = industry.toLowerCase();
  for (const [key, patterns] of Object.entries(SEED_PATTERNS)) {
    if (lower.includes(key.toLowerCase().split("/")[0].trim()) || key.toLowerCase().includes(lower.split("/")[0].trim())) {
      return patterns;
    }
  }

  return SEED_PATTERNS["General / Other"];
}
