/* ═══════════════════════════════════════════════════════════
   ML PIPELINE — V2
   Progressive engagement scoring, multi-dimensional feature
   analysis, and tiered insight unlocking.
   schema_version: 2
   ═══════════════════════════════════════════════════════════ */

import { tokenize, getNgrams, computeTFIDF, pearsonCorrelation } from "./nlp.js";
import { extractFeatures, extractHashtagList } from "./features.js";

// ─── Confidence & Tier ────────────────────────────────────

export function getConfidenceScore(postCount) {
  if (postCount >= 100) return 100;
  if (postCount >= 50) return 90;
  if (postCount >= 25) return 75;
  if (postCount >= 20) return 65;
  if (postCount >= 15) return 50;
  if (postCount >= 10) return 30;
  if (postCount >= 5) return 15;
  return Math.round((postCount / 5) * 15);
}

export function getAnalysisTier(postCount) {
  if (postCount >= 100) return { id: "master", label: "Ella knows your industry cold", min: 100 };
  if (postCount >= 50) return { id: "significant", label: "Statistically significant patterns", min: 50 };
  if (postCount >= 20) return { id: "full", label: "Full analysis", min: 20 };
  if (postCount >= 15) return { id: "intermediate", label: "Intermediate patterns", min: 15 };
  if (postCount >= 10) return { id: "basic", label: "Basic patterns", min: 10 };
  if (postCount >= 5) return { id: "early", label: "Early patterns", min: 5 };
  return { id: "collecting", label: "Collecting data", min: 0 };
}

export const TIER_UNLOCKS = {
  collecting:   { basicStats: true },
  early:        { basicStats: true, mediaPerformance: true },
  basic:        { basicStats: true, mediaPerformance: true, hookAnalysis: true, optimalRanges: true },
  intermediate: { basicStats: true, mediaPerformance: true, hookAnalysis: true, optimalRanges: true, ctaAnalysis: true, formattingImpact: true, hashtagAnalysis: true },
  full:         { basicStats: true, mediaPerformance: true, hookAnalysis: true, optimalRanges: true, ctaAnalysis: true, formattingImpact: true, hashtagAnalysis: true, correlations: true, differentialTerms: true, bigramDiff: true, commentThemes: true, contentDepth: true },
  significant:  { basicStats: true, mediaPerformance: true, hookAnalysis: true, optimalRanges: true, ctaAnalysis: true, formattingImpact: true, hashtagAnalysis: true, correlations: true, differentialTerms: true, bigramDiff: true, commentThemes: true, contentDepth: true, reactionPatterns: true, perHashtagPerf: true },
  master:       { basicStats: true, mediaPerformance: true, hookAnalysis: true, optimalRanges: true, ctaAnalysis: true, formattingImpact: true, hashtagAnalysis: true, correlations: true, differentialTerms: true, bigramDiff: true, commentThemes: true, contentDepth: true, reactionPatterns: true, perHashtagPerf: true },
};

// ─── Engagement Scoring ──────────────────────────────────

/**
 * Multi-dimensional engagement scoring.
 * Returns { rawScore, normalizedRate, commentQualityMult, reactionQualityMult, finalScore }
 */
export function calculateEngagementScore(post) {
  const reactions = post.likes || 0;
  const comments = post.comments_count || 0;
  const shares = post.shares || 0;

  // Base score: reactions × 1, comments × 4, shares × 3
  let baseScore = reactions + (comments * 4) + (shares * 3);

  // Comment quality multiplier
  let commentQualityMult = 1.0;
  if (post.comment_texts && comments > 0) {
    const commentList = post.comment_texts.split(/\s*\|\s*/).filter((c) => c.trim().length > 0);
    if (commentList.length > 0) {
      const avgWords = commentList.reduce((sum, c) => {
        // Strip "AuthorName: " prefix if present
        const text = c.replace(/^[^:]+:\s*/, "");
        return sum + text.split(/\s+/).filter(Boolean).length;
      }, 0) / commentList.length;
      if (avgWords > 15) commentQualityMult = 1.5;
      else if (avgWords > 10) commentQualityMult = 1.2;
      else if (avgWords < 5) commentQualityMult = 0.7;
    }
  }

  // Reaction quality multiplier (experimental)
  let reactionQualityMult = 1.0;
  const rb = post.reactions_breakdown;
  if (rb?.dominant_types?.length > 0) {
    const types = rb.dominant_types;
    if (types.includes("insightful") || types.includes("love")) reactionQualityMult = 1.3;
    else if (types.includes("celebrate") || types.includes("support")) reactionQualityMult = 1.15;
    else if (types.length === 1 && types[0] === "funny") reactionQualityMult = 0.9;
  }

  const commentPortion = comments * 4 * commentQualityMult;
  const rawScore = Math.round(reactions * reactionQualityMult + commentPortion + shares * 3);

  // Audience-normalized rate (if follower data available on author — future feature)
  // For now, use raw score as final
  const finalScore = rawScore;
  const normalizedRate = null; // placeholder for when follower count is available

  return { rawScore, normalizedRate, commentQualityMult, reactionQualityMult, finalScore };
}

// ─── Helpers ─────────────────────────────────────────────

function avg(arr) {
  return arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function groupAvg(groups) {
  return Object.entries(groups).map(([key, scores]) => ({
    type: key,
    count: scores.length,
    avgEngagement: avg(scores),
  })).sort((a, b) => b.avgEngagement - a.avgEngagement);
}

// ─── Main Pipeline ───────────────────────────────────────

export function runMLPipeline(posts) {
  // Separate posts by data completeness
  const withEngagement = posts.filter((p) => p.has_engagement_data !== false);
  const textOnlyPosts = posts.filter((p) => p.has_engagement_data === false);

  console.log(`[Ella ML] Analyzing ${posts.length} posts (${withEngagement.length} with engagement data, ${textOnlyPosts.length} text-only${posts.filter((p) => p.capture_method === 'bulk').length ? `, ${posts.filter((p) => p.capture_method === 'bulk').length} bulk captures` : ''})`);

  // Score posts WITH engagement data (text-only posts get score 0 and are excluded from ranking)
  const scored = posts.map((p) => ({
    ...p,
    _score: p.has_engagement_data !== false ? calculateEngagementScore(p) : { rawScore: 0, finalScore: 0, commentQualityMult: 1, reactionQualityMult: 1, normalizedRate: null },
    _hasEngagement: p.has_engagement_data !== false,
  }));

  // Engagement ranking uses ONLY posts with engagement data
  const scoredWithEngagement = scored.filter((p) => p._hasEngagement);
  const engagementScores = scored.map((p) => p._score.finalScore);
  const rankedScores = scoredWithEngagement.map((p) => p._score.finalScore);
  const sorted = [...rankedScores].sort((a, b) => b - a);
  const p80 = sorted[Math.floor(sorted.length * 0.2)] || 0;

  const topPosts = scoredWithEngagement.filter((p) => p._score.finalScore >= p80);
  const bottomPosts = scoredWithEngagement.filter((p) => p._score.finalScore < p80);

  // Extract features with media overrides
  const allFeatures = scored.map((p) => {
    const f = extractFeatures(p.post_text || "");
    f.is_image = p.has_image ? 1 : 0;
    f.is_video = p.has_video ? 1 : 0;
    f.is_carousel = p.has_carousel ? 1 : 0;
    f.is_text_only = (!p.has_image && !p.has_video && !p.has_carousel) ? 1 : 0;
    return f;
  });

  const tier = getAnalysisTier(posts.length);
  const confidence = getConfidenceScore(posts.length);
  const unlocks = TIER_UNLOCKS[tier.id] || TIER_UNLOCKS.early;

  const avgEngagement = avg(engagementScores);
  const topAvgEngagement = avg(engagementScores.filter((e) => e >= p80));

  const result = {
    schema_version: 2,
    totalPosts: posts.length,
    tier,
    confidence,
    unlocks,
    topCount: topPosts.length,
    bottomCount: bottomPosts.length,
    p80Threshold: p80,
    engagementScores,
    avgEngagement,
    topAvgEngagement,
    // Sections — populated below based on tier
    mediaPerformance: [],
    hookAnalysis: [],
    hookDepth: null,
    ctaAnalysis: [],
    ctaDepth: null,
    optimalRanges: {},
    correlations: [],
    differentialTerms: [],
    bigramDiff: [],
    topCommentTerms: [],
    commentDepth: null,
    formattingImpact: null,
    hashtagAnalysis: null,
    topHashtags: [],
    contentDepth: null,
    reactionPatterns: null,
  };

  // ─── Media Performance (5+ posts) ─────────────────────
  if (unlocks.mediaPerformance) {
    const mediaGroups = { text_only: [], image: [], video: [], carousel: [] };
    scored.forEach((p, i) => {
      if (p.has_carousel) mediaGroups.carousel.push(engagementScores[i]);
      else if (p.has_video) mediaGroups.video.push(engagementScores[i]);
      else if (p.has_image) mediaGroups.image.push(engagementScores[i]);
      else mediaGroups.text_only.push(engagementScores[i]);
    });
    result.mediaPerformance = groupAvg(mediaGroups).filter((m) => m.count > 0);
  }

  // ─── Hook Analysis (10+ posts) ────────────────────────
  if (unlocks.hookAnalysis) {
    const hookGroups = { bold_claim: [], story: [], question: [], number: [], other: [] };
    scored.forEach((p, i) => {
      const f = allFeatures[i];
      let type = "other";
      if (f.hook_is_bold_claim) type = "bold_claim";
      else if (f.hook_is_story) type = "story";
      else if (f.hook_is_question) type = "question";
      else if (f.hook_is_number) type = "number";
      hookGroups[type].push(engagementScores[i]);
    });
    result.hookAnalysis = groupAvg(hookGroups);

    // Hook depth analysis
    const hookChars = allFeatures.map((f) => f.hook_char_count);
    const underFoldScores = scored.filter((_, i) => allFeatures[i].hook_under_fold).map((_, i) => engagementScores[i]);
    const overFoldScores = scored.filter((_, i) => !allFeatures[i].hook_under_fold).map((_, i) => engagementScores[i]);
    const sentimentGroups = { negative: [], neutral: [], positive: [] };
    scored.forEach((_, i) => {
      const s = allFeatures[i].hook_sentiment;
      const key = s < 0 ? "negative" : s > 0 ? "positive" : "neutral";
      sentimentGroups[key].push(engagementScores[i]);
    });

    result.hookDepth = {
      charCountCorrelation: +pearsonCorrelation(hookChars, engagementScores).toFixed(3),
      underFoldAvg: avg(underFoldScores),
      overFoldAvg: avg(overFoldScores),
      sentimentPerformance: groupAvg(sentimentGroups),
    };
  }

  // ─── Optimal Ranges (10+ posts) ───────────────────────
  if (unlocks.optimalRanges) {
    const topFeats = topPosts.map((p) => extractFeatures(p.post_text || ""));
    const rangeKeys = ["word_count", "line_count", "paragraph_count", "reading_time_seconds", "emoji_density", "hashtags", "short_para_ratio"];
    rangeKeys.forEach((f) => {
      const vals = topFeats.map((tf) => tf[f]).sort((a, b) => a - b);
      if (vals.length) {
        result.optimalRanges[f] = {
          p25: vals[Math.floor(vals.length * 0.25)],
          median: vals[Math.floor(vals.length * 0.5)],
          p75: vals[Math.floor(vals.length * 0.75)],
        };
      }
    });
  }

  // ─── CTA Analysis (15+ posts) ─────────────────────────
  if (unlocks.ctaAnalysis) {
    const ctaGroups = { open_ended_question: [], yes_no_question: [], call_to_action: [], statement: [] };
    scored.forEach((p, i) => {
      const f = allFeatures[i];
      let type = "statement";
      if (f.cta_is_open_ended) type = "open_ended_question";
      else if (f.cta_is_question) type = "yes_no_question";
      else if (f.last_line_has_cta) type = "call_to_action";
      ctaGroups[type].push(engagementScores[i]);
    });
    result.ctaAnalysis = groupAvg(ctaGroups);

    // CTA depth
    const disagreeScores = scored.filter((_, i) => allFeatures[i].cta_invites_disagreement).map((_, i) => engagementScores[i]);
    const agreeScores = scored.filter((_, i) => !allFeatures[i].cta_invites_disagreement && allFeatures[i].cta_is_question).map((_, i) => engagementScores[i]);
    result.ctaDepth = {
      disagreementAvg: avg(disagreeScores),
      agreementAvg: avg(agreeScores),
      disagreementCount: disagreeScores.length,
      ctaLengthCorrelation: +pearsonCorrelation(allFeatures.map((f) => f.cta_word_count), engagementScores).toFixed(3),
    };
  }

  // ─── Formatting Impact (15+ posts) ────────────────────
  if (unlocks.formattingImpact) {
    const bulletScores = scored.filter((_, i) => allFeatures[i].uses_bullet_points).map((_, i) => engagementScores[i]);
    const proseScores = scored.filter((_, i) => !allFeatures[i].uses_bullet_points && !allFeatures[i].uses_numbered_list).map((_, i) => engagementScores[i]);
    const numberedScores = scored.filter((_, i) => allFeatures[i].uses_numbered_list).map((_, i) => engagementScores[i]);

    result.formattingImpact = {
      bulletAvg: avg(bulletScores),
      bulletCount: bulletScores.length,
      proseAvg: avg(proseScores),
      proseCount: proseScores.length,
      numberedAvg: avg(numberedScores),
      numberedCount: numberedScores.length,
      emojiDensityCorrelation: +pearsonCorrelation(allFeatures.map((f) => f.emoji_density), engagementScores).toFixed(3),
      capsCorrelation: +pearsonCorrelation(allFeatures.map((f) => f.caps_word_count), engagementScores).toFixed(3),
      paragraphVarianceCorrelation: +pearsonCorrelation(allFeatures.map((f) => f.paragraph_variance), engagementScores).toFixed(3),
    };
  }

  // ─── Hashtag Analysis (15+ posts) ─────────────────────
  if (unlocks.hashtagAnalysis) {
    const hashCountCorr = +pearsonCorrelation(allFeatures.map((f) => f.hashtags), engagementScores).toFixed(3);
    const atEndScores = scored.filter((_, i) => allFeatures[i].hashtag_at_end).map((_, i) => engagementScores[i]);
    const scatteredScores = scored.filter((_, i) => allFeatures[i].hashtags > 0 && !allFeatures[i].hashtag_at_end).map((_, i) => engagementScores[i]);

    result.hashtagAnalysis = {
      countCorrelation: hashCountCorr,
      atEndAvg: avg(atEndScores),
      atEndCount: atEndScores.length,
      scatteredAvg: avg(scatteredScores),
      scatteredCount: scatteredScores.length,
    };
  }

  // ─── Content Depth (20+ posts) ────────────────────────
  if (unlocks.contentDepth) {
    result.contentDepth = {
      readingTimeCorrelation: +pearsonCorrelation(allFeatures.map((f) => f.reading_time_seconds), engagementScores).toFixed(3),
      externalLinkAvg: avg(scored.filter((_, i) => allFeatures[i].has_external_link).map((_, i) => engagementScores[i])),
      noLinkAvg: avg(scored.filter((_, i) => !allFeatures[i].has_external_link).map((_, i) => engagementScores[i])),
      externalLinkCount: scored.filter((_, i) => allFeatures[i].has_external_link).length,
    };
  }

  // ─── Feature Correlations (20+ posts) ─────────────────
  if (unlocks.correlations) {
    const featureNames = Object.keys(allFeatures[0] || {});
    result.correlations = featureNames
      .map((f) => ({
        feature: f,
        correlation: pearsonCorrelation(allFeatures.map((af) => af[f]), engagementScores),
      }))
      .filter((c) => !isNaN(c.correlation) && Math.abs(c.correlation) > 0.05)
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 20);
  }

  // ─── TF-IDF Differential (20+ posts) ──────────────────
  if (unlocks.differentialTerms && topPosts.length >= 3 && bottomPosts.length >= 3) {
    const topTokens = topPosts.map((p) => tokenize(p.post_text || ""));
    const bottomTokens = bottomPosts.map((p) => tokenize(p.post_text || ""));
    const topTFIDF = computeTFIDF(topTokens);
    const bottomTFIDF = computeTFIDF(bottomTokens);

    const topScores = {};
    topTFIDF.forEach((doc) => Object.entries(doc).forEach(([t, s]) => (topScores[t] = (topScores[t] || 0) + s)));
    const bottomScores = {};
    bottomTFIDF.forEach((doc) => Object.entries(doc).forEach(([t, s]) => (bottomScores[t] = (bottomScores[t] || 0) + s)));

    // topPosts is the top 20% while bottomPosts is everything else, so the two
    // groups have very different sizes. Comparing summed TF-IDF would make the
    // larger group win every term, so compare the per-post mean instead.
    const nTop = Math.max(topTokens.length, 1);
    const nBottom = Math.max(bottomTokens.length, 1);

    result.differentialTerms = Object.keys(topScores)
      .map((t) => {
        const topSum = topScores[t] || 0;
        const bottomSum = bottomScores[t] || 0;
        return {
          term: t,
          topScore: topSum / nTop,
          bottomScore: bottomSum / nBottom,
          diff: topSum / nTop - bottomSum / nBottom,
          topSum,
        };
      })
      .filter((t) => t.topSum > 0.3)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 30);
  }

  // ─── Bigram Analysis (20+ posts) ──────────────────────
  if (unlocks.bigramDiff && topPosts.length >= 3) {
    const topBigrams = {};
    topPosts.forEach((p) =>
      getNgrams(tokenize(p.post_text || ""), 2).forEach((g) => (topBigrams[g] = (topBigrams[g] || 0) + 1))
    );
    const bottomBigrams = {};
    bottomPosts.forEach((p) =>
      getNgrams(tokenize(p.post_text || ""), 2).forEach((g) => (bottomBigrams[g] = (bottomBigrams[g] || 0) + 1))
    );
    // Same group-size problem as differentialTerms: compare per-post rates,
    // not raw counts, or the larger bottom group inflates every denominator.
    const nTopPosts = Math.max(topPosts.length, 1);
    const nBottomPosts = Math.max(bottomPosts.length, 1);

    result.bigramDiff = Object.keys(topBigrams)
      .map((g) => {
        const topRate = topBigrams[g] / nTopPosts;
        const bottomRate = (bottomBigrams[g] || 0) / nBottomPosts;
        return {
          bigram: g,
          topCount: topBigrams[g],
          bottomCount: bottomBigrams[g] || 0,
          ratio: topRate / Math.max(bottomRate, 0.5 / nBottomPosts),
        };
      })
      .filter((g) => g.topCount >= 2)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 20);
  }

  // ─── Comment Themes (20+ posts) ───────────────────────
  if (unlocks.commentThemes) {
    const parseComments = (postList) =>
      postList.flatMap((p) => (p.comment_texts || "").split(/\s*\|\s*/).filter((c) => c.trim().length > 10));

    const allComments = parseComments(scored);
    const topComments = parseComments(topPosts);
    const commentTokens = allComments.map(tokenize);
    const freq = {};
    commentTokens.forEach((tokens) => tokens.forEach((t) => (freq[t] = (freq[t] || 0) + 1)));
    result.topCommentTerms = Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 25)
      .map(([term, count]) => ({ term, count }));

    // Comment depth comparison
    const topCommentLengths = topComments.map((c) => c.replace(/^[^:]+:\s*/, "").split(/\s+/).length);
    const bottomComments = parseComments(bottomPosts);
    const bottomCommentLengths = bottomComments.map((c) => c.replace(/^[^:]+:\s*/, "").split(/\s+/).length);

    result.commentDepth = {
      topAvgLength: avg(topCommentLengths),
      bottomAvgLength: avg(bottomCommentLengths),
      topCommentCount: topComments.length,
      bottomCommentCount: bottomComments.length,
    };
  }

  // ─── Per-Hashtag Performance (50+ posts) ──────────────
  if (unlocks.perHashtagPerf) {
    const hashPerf = {};
    scored.forEach((p, i) => {
      const tags = extractHashtagList(p.post_text || "");
      tags.forEach((tag) => {
        if (!hashPerf[tag]) hashPerf[tag] = [];
        hashPerf[tag].push(engagementScores[i]);
      });
    });
    result.topHashtags = Object.entries(hashPerf)
      .filter(([, scores]) => scores.length >= 3)
      .map(([tag, scores]) => ({ tag, count: scores.length, avgEngagement: avg(scores) }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 15);
  }

  // ─── Reaction Type Patterns (50+ posts with data) ────
  if (unlocks.reactionPatterns) {
    const withReactions = scored.filter((p) => p.reactions_breakdown?.dominant_types?.length > 0);
    if (withReactions.length >= 30) {
      const typeGroups = {};
      withReactions.forEach((p) => {
        const types = p.reactions_breakdown.dominant_types;
        const score = p._score.finalScore;
        types.forEach((t) => {
          if (!typeGroups[t]) typeGroups[t] = { scores: [], commentCounts: [] };
          typeGroups[t].scores.push(score);
          typeGroups[t].commentCounts.push(p.comments_count || 0);
        });
      });

      result.reactionPatterns = Object.entries(typeGroups).map(([type, data]) => ({
        type,
        count: data.scores.length,
        avgEngagement: avg(data.scores),
        avgComments: avg(data.commentCounts),
      })).sort((a, b) => b.avgEngagement - a.avgEngagement);
    }
  }

  return result;
}

// ─── Format for Prompt ───────────────────────────────────

export function formatInsightsForPrompt(mlResults) {
  if (!mlResults) return "";
  const r = mlResults;
  let out = `=== ML-DISCOVERED ENGAGEMENT PATTERNS ===\n\nDataset: ${r.totalPosts} posts (confidence: ${r.confidence}%). Top 20% threshold: ${r.p80Threshold}.\nScoring: reactions×1 + comments×4 + shares×3, adjusted for comment quality and reaction type.\n\n`;

  // Media
  if (r.mediaPerformance?.length) {
    out += "MEDIA TYPE PERFORMANCE:\n";
    r.mediaPerformance.forEach((m) => { out += `  ${m.type}: avg ${m.avgEngagement} (${m.count} posts)\n`; });
    out += "\n";
  }

  // Correlations
  if (r.correlations?.length) {
    out += "TOP FEATURE CORRELATIONS WITH ENGAGEMENT:\n";
    r.correlations.slice(0, 12).forEach((c) => {
      out += `  ${c.feature}: r=${c.correlation.toFixed(3)} (${c.correlation > 0 ? "+" : "−"})\n`;
    });
    out += "\n";
  }

  // Hook depth
  if (r.hookDepth) {
    out += "HOOK ANALYSIS:\n";
    out += `  Hook length correlation: ${r.hookDepth.charCountCorrelation} (${r.hookDepth.charCountCorrelation > 0 ? "longer hooks perform better" : "shorter hooks perform better"})\n`;
    out += `  Under fold (≤210 chars): avg ${r.hookDepth.underFoldAvg} vs over fold: avg ${r.hookDepth.overFoldAvg}\n`;
    r.hookDepth.sentimentPerformance.forEach((s) => {
      out += `  ${s.type} hooks: avg ${s.avgEngagement} (${s.count} posts)\n`;
    });
    out += "\n";
  } else if (r.hookAnalysis?.length) {
    out += "HOOK PATTERNS:\n";
    r.hookAnalysis.forEach((h) => { out += `  ${h.type}: avg ${h.avgEngagement} (${h.count} posts)\n`; });
    out += "\n";
  }

  // CTA
  if (r.ctaAnalysis?.length) {
    out += "CTA PATTERNS:\n";
    r.ctaAnalysis.forEach((c) => { out += `  ${c.type}: avg ${c.avgEngagement} (${c.count} posts)\n`; });
    if (r.ctaDepth) {
      if (r.ctaDepth.disagreementCount > 0) out += `  Disagreement-inviting CTAs: avg ${r.ctaDepth.disagreementAvg} (${r.ctaDepth.disagreementCount} posts)\n`;
      out += `  CTA length correlation: ${r.ctaDepth.ctaLengthCorrelation}\n`;
    }
    out += "\n";
  }

  // Formatting
  if (r.formattingImpact) {
    const fi = r.formattingImpact;
    out += "FORMATTING IMPACT:\n";
    if (fi.bulletCount) out += `  Bullet points: avg ${fi.bulletAvg} (${fi.bulletCount} posts)\n`;
    if (fi.numberedCount) out += `  Numbered lists: avg ${fi.numberedAvg} (${fi.numberedCount} posts)\n`;
    if (fi.proseCount) out += `  Prose: avg ${fi.proseAvg} (${fi.proseCount} posts)\n`;
    out += `  Emoji density correlation: ${fi.emojiDensityCorrelation}\n`;
    out += `  Paragraph variety correlation: ${fi.paragraphVarianceCorrelation}\n`;
    out += "\n";
  }

  // Content depth
  if (r.contentDepth) {
    out += "CONTENT DEPTH:\n";
    out += `  Reading time correlation: ${r.contentDepth.readingTimeCorrelation} (${r.contentDepth.readingTimeCorrelation > 0 ? "longer = better" : "shorter = better"})\n`;
    if (r.contentDepth.externalLinkCount > 0) out += `  With external link: avg ${r.contentDepth.externalLinkAvg} (${r.contentDepth.externalLinkCount}) vs without: avg ${r.contentDepth.noLinkAvg}\n`;
    out += "\n";
  }

  // Optimal ranges
  if (Object.keys(r.optimalRanges || {}).length) {
    out += "OPTIMAL STRUCTURE (top 20%):\n";
    Object.entries(r.optimalRanges).forEach(([f, v]) => {
      out += `  ${f}: ${v.p25}–${v.p75} (median: ${v.median})\n`;
    });
    out += "\n";
  }

  // Vocabulary
  if (r.differentialTerms?.length) {
    out += "HIGH-ENGAGEMENT VOCABULARY (top posts vs bottom):\n";
    r.differentialTerms.slice(0, 20).forEach((t) => {
      out += `  "${t.term}" — top: ${t.topScore.toFixed(2)} vs bottom: ${t.bottomScore.toFixed(2)}\n`;
    });
    out += "\n";
  }

  // Bigrams
  if (r.bigramDiff?.length) {
    out += "WINNING BIGRAMS:\n";
    r.bigramDiff.slice(0, 12).forEach((b) => {
      out += `  "${b.bigram}" — ${b.ratio.toFixed(1)}x overrepresented in top posts\n`;
    });
    out += "\n";
  }

  // Hashtags
  if (r.hashtagAnalysis) {
    out += `HASHTAG INSIGHTS: count correlation ${r.hashtagAnalysis.countCorrelation}`;
    if (r.hashtagAnalysis.atEndCount > 0) out += `, at end: avg ${r.hashtagAnalysis.atEndAvg}`;
    if (r.hashtagAnalysis.scatteredCount > 0) out += `, scattered: avg ${r.hashtagAnalysis.scatteredAvg}`;
    out += "\n";
  }
  if (r.topHashtags?.length) {
    out += "TOP PERFORMING HASHTAGS:\n";
    r.topHashtags.slice(0, 8).forEach((h) => {
      out += `  ${h.tag}: avg ${h.avgEngagement} (${h.count} uses)\n`;
    });
    out += "\n";
  }

  // Comment themes
  if (r.topCommentTerms?.length) {
    out += "COMMENT THEMES:\n";
    r.topCommentTerms.slice(0, 12).forEach((t) => { out += `  "${t.term}" — ${t.count} mentions\n`; });
    if (r.commentDepth) {
      out += `  Top 20% post comments avg ${r.commentDepth.topAvgLength} words vs bottom: ${r.commentDepth.bottomAvgLength} words\n`;
    }
    out += "\n";
  }

  return out;
}
