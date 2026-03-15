/* ═══════════════════════════════════════════════════════════
   ML PIPELINE
   Runs TF-IDF differential, correlation analysis,
   n-gram discovery, hook/CTA classification,
   optimal range detection, and comment theme extraction
   ═══════════════════════════════════════════════════════════ */

import { tokenize, getNgrams, computeTFIDF, pearsonCorrelation } from "./nlp.js";
import { extractFeatures } from "./features.js";

export function runMLPipeline(posts) {
  const engagementScores = posts.map(
    (p) => (p.likes || 0) + (p.comments_count || 0) * 3 + (p.shares || 0) * 2
  );
  const sorted = [...engagementScores].sort((a, b) => b - a);
  const p80 = sorted[Math.floor(sorted.length * 0.2)] || 0;
  const p20 = sorted[Math.floor(sorted.length * 0.8)] || 0;

  const topPosts = posts.filter((_, i) => engagementScores[i] >= p80);
  const bottomPosts = posts.filter((_, i) => engagementScores[i] <= p20);
  const allFeatures = posts.map((p) => extractFeatures(p.post_text || ""));

  // ─── Feature correlations with engagement ──────────────
  const featureNames = Object.keys(allFeatures[0] || {});
  const correlations = featureNames
    .map((f) => ({
      feature: f,
      correlation: pearsonCorrelation(
        allFeatures.map((af) => af[f]),
        engagementScores
      ),
    }))
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // ─── TF-IDF differential: top vs bottom ────────────────
  const topTokens = topPosts.map((p) => tokenize(p.post_text || ""));
  const bottomTokens = bottomPosts.map((p) => tokenize(p.post_text || ""));
  const topTFIDF = computeTFIDF(topTokens);
  const bottomTFIDF = computeTFIDF(bottomTokens);

  const topTermScores = {};
  topTFIDF.forEach((doc) =>
    Object.entries(doc).forEach(([t, s]) => (topTermScores[t] = (topTermScores[t] || 0) + s))
  );
  const bottomTermScores = {};
  bottomTFIDF.forEach((doc) =>
    Object.entries(doc).forEach(([t, s]) => (bottomTermScores[t] = (bottomTermScores[t] || 0) + s))
  );

  const differentialTerms = Object.keys(topTermScores)
    .map((t) => ({
      term: t,
      topScore: topTermScores[t] || 0,
      bottomScore: bottomTermScores[t] || 0,
      diff: (topTermScores[t] || 0) - (bottomTermScores[t] || 0),
    }))
    .filter((t) => t.topScore > 0.5)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 25);

  // ─── Bigram analysis ───────────────────────────────────
  const topBigrams = {};
  topPosts.forEach((p) =>
    getNgrams(tokenize(p.post_text || ""), 2).forEach((g) => (topBigrams[g] = (topBigrams[g] || 0) + 1))
  );
  const bottomBigrams = {};
  bottomPosts.forEach((p) =>
    getNgrams(tokenize(p.post_text || ""), 2).forEach((g) => (bottomBigrams[g] = (bottomBigrams[g] || 0) + 1))
  );
  const bigramDiff = Object.keys(topBigrams)
    .map((g) => ({
      bigram: g,
      topCount: topBigrams[g],
      bottomCount: bottomBigrams[g] || 0,
      ratio: topBigrams[g] / Math.max(bottomBigrams[g] || 0.5, 0.5),
    }))
    .filter((g) => g.topCount >= 2)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 15);

  // ─── Hook pattern classification ───────────────────────
  const hookTypes = { bold_claim: 0, story: 0, question: 0, number: 0, other: 0 };
  const hookEngagement = { bold_claim: [], story: [], question: [], number: [], other: [] };
  posts.forEach((p, i) => {
    const f = allFeatures[i];
    let type = "other";
    if (f.hook_is_bold_claim) type = "bold_claim";
    else if (f.hook_is_story) type = "story";
    else if (f.hook_is_question) type = "question";
    else if (f.hook_is_number) type = "number";
    hookTypes[type]++;
    hookEngagement[type].push(engagementScores[i]);
  });
  const hookAnalysis = Object.keys(hookTypes)
    .map((type) => ({
      type,
      count: hookTypes[type],
      avgEngagement: hookEngagement[type].length
        ? +(hookEngagement[type].reduce((a, b) => a + b, 0) / hookEngagement[type].length).toFixed(0)
        : 0,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  // ─── CTA pattern analysis ──────────────────────────────
  const ctaPatterns = { question: 0, call_to_action: 0, statement: 0 };
  const ctaEngagement = { question: [], call_to_action: [], statement: [] };
  posts.forEach((p, i) => {
    const f = allFeatures[i];
    let type = "statement";
    if (f.last_line_has_question) type = "question";
    else if (f.last_line_has_cta) type = "call_to_action";
    ctaPatterns[type]++;
    ctaEngagement[type].push(engagementScores[i]);
  });
  const ctaAnalysis = Object.keys(ctaPatterns)
    .map((type) => ({
      type,
      count: ctaPatterns[type],
      avgEngagement: ctaEngagement[type].length
        ? +(ctaEngagement[type].reduce((a, b) => a + b, 0) / ctaEngagement[type].length).toFixed(0)
        : 0,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  // ─── Optimal post structure ranges ─────────────────────
  const topFeatures = topPosts.map((p) => extractFeatures(p.post_text || ""));
  const optimalRanges = {};
  ["word_count", "line_count", "questions", "hashtags", "emojis", "short_para_ratio"].forEach((f) => {
    const vals = topFeatures.map((tf) => tf[f]).sort((a, b) => a - b);
    if (vals.length) {
      optimalRanges[f] = {
        p25: vals[Math.floor(vals.length * 0.25)],
        median: vals[Math.floor(vals.length * 0.5)],
        p75: vals[Math.floor(vals.length * 0.75)],
      };
    }
  });

  // ─── Comment theme extraction ──────────────────────────
  const allComments = posts.flatMap((p) =>
    (p.comment_texts || "").split(/[;|]/).filter((c) => c.trim().length > 10)
  );
  const commentTokens = allComments.map(tokenize);
  const commentTermFreq = {};
  commentTokens.forEach((tokens) =>
    tokens.forEach((t) => (commentTermFreq[t] = (commentTermFreq[t] || 0) + 1))
  );
  const topCommentTerms = Object.entries(commentTermFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([term, count]) => ({ term, count }));

  return {
    totalPosts: posts.length,
    topCount: topPosts.length,
    bottomCount: bottomPosts.length,
    p80Threshold: p80,
    engagementScores,
    correlations: correlations.slice(0, 15),
    differentialTerms,
    bigramDiff,
    hookAnalysis,
    ctaAnalysis,
    optimalRanges,
    topCommentTerms,
    avgEngagement: +(engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length).toFixed(0),
    topAvgEngagement: (() => {
      const topScores = engagementScores.filter((e) => e >= p80);
      return topScores.length
        ? +(topScores.reduce((a, b) => a + b, 0) / topScores.length).toFixed(0)
        : 0;
    })(),
  };
}

export function formatInsightsForPrompt(mlResults) {
  if (!mlResults) return "";
  let out = "=== ML-DISCOVERED ENGAGEMENT PATTERNS ===\n\n";
  out += `Dataset: ${mlResults.totalPosts} posts analyzed. Top 20% threshold: ${mlResults.p80Threshold} engagement score.\n\n`;

  out += "FEATURE CORRELATIONS WITH ENGAGEMENT:\n";
  mlResults.correlations.slice(0, 10).forEach((c) => {
    out += `  ${c.feature}: r=${c.correlation.toFixed(3)} (${c.correlation > 0 ? "positive" : "negative"})\n`;
  });

  out += "\nHIGH-ENGAGEMENT VOCABULARY (TF-IDF differential):\n";
  mlResults.differentialTerms.slice(0, 15).forEach((t) => {
    out += `  "${t.term}" — top-post score: ${t.topScore.toFixed(2)} vs bottom: ${t.bottomScore.toFixed(2)}\n`;
  });

  out += "\nWINNING BIGRAMS:\n";
  mlResults.bigramDiff.slice(0, 10).forEach((b) => {
    out += `  "${b.bigram}" — ${b.topCount}x in top posts (${b.ratio.toFixed(1)}x overrepresented)\n`;
  });

  out += "\nHOOK PATTERNS BY PERFORMANCE:\n";
  mlResults.hookAnalysis.forEach((h) => {
    out += `  ${h.type}: avg engagement ${h.avgEngagement} (${h.count} posts)\n`;
  });

  out += "\nCTA PATTERNS:\n";
  mlResults.ctaAnalysis.forEach((c) => {
    out += `  ${c.type}: avg engagement ${c.avgEngagement} (${c.count} posts)\n`;
  });

  out += "\nOPTIMAL STRUCTURE (top 20% medians):\n";
  Object.entries(mlResults.optimalRanges).forEach(([f, r]) => {
    out += `  ${f}: ${r.p25}–${r.p75} (median: ${r.median})\n`;
  });

  if (mlResults.topCommentTerms.length) {
    out += "\nCOMMENT THEMES (what readers talk about):\n";
    mlResults.topCommentTerms.slice(0, 10).forEach((t) => {
      out += `  "${t.term}" — ${t.count} mentions\n`;
    });
  }
  return out;
}
