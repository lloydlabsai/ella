import { useState } from "react";
import { extractFeatures } from "../utils/features";
import { callClaude } from "../lib/api";

function ScoreGauge({ score }) {
  const color = score >= 75 ? "#6B9E7D" : score >= 50 ? "#D4A853" : "#D4695A";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", border: `4px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace",
      }}>{score}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#2D2520" }}>
          {score >= 75 ? "Strong post" : score >= 50 ? "Good foundation" : "Needs work"}
        </div>
        <div style={{ fontSize: 12, color: "#8B7E74" }}>
          {score >= 75 ? "Algorithm-optimized and substantive" : score >= 50 ? "Some areas to improve" : "Several optimization opportunities"}
        </div>
      </div>
    </div>
  );
}

function Section({ title, items, color = "#2D2520" }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #EDE8E1", borderRadius: 12,
      padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
    }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>{title}</h4>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "4px 0", borderBottom: i < items.length - 1 ? "1px solid #F0EBE4" : "none" }}>
          <span style={{ fontSize: 12, color: "#5C534A" }}>{item.label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: item.good ? "#6B9E7D" : item.bad ? "#D4695A" : "#8B7E74", textAlign: "right", maxWidth: 200 }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function scorePost(text, mlResults) {
  const f = extractFeatures(text);
  let score = 50; // base
  const sections = [];

  // Hook
  const hookItems = [];
  hookItems.push({ label: "Hook length", value: `${f.hook_char_count} chars`, good: f.hook_char_count >= 40 && f.hook_char_count <= 210, bad: f.hook_char_count > 210 });
  hookItems.push({ label: "Under fold (≤210 chars)", value: f.hook_under_fold ? "Yes — fully visible" : "No — requires click to see", good: !!f.hook_under_fold, bad: !f.hook_under_fold });

  let hookType = "Other";
  if (f.hook_is_bold_claim) hookType = "Bold claim";
  else if (f.hook_is_story) hookType = "Story";
  else if (f.hook_is_question) hookType = "Question";
  else if (f.hook_is_number) hookType = "Number lead";
  hookItems.push({ label: "Hook type", value: hookType, good: hookType !== "Other" });

  if (f.hook_has_colon) hookItems.push({ label: "Uses colon pattern", value: "Yes (e.g. 'Hot take:')", good: true });
  if (f.hook_under_fold && hookType !== "Other") score += 10;
  else if (!f.hook_under_fold) score -= 5;
  if (hookType !== "Other") score += 5;

  let hookVerdict = hookType !== "Other"
    ? `${hookType} hook — pattern interrupt that stops scrolling`
    : "Generic opening — consider a bolder claim, question, or number";
  hookItems.push({ label: "Verdict", value: hookVerdict, good: hookType !== "Other", bad: hookType === "Other" });
  sections.push({ title: "Hook Analysis", items: hookItems, color: "#E8664A" });

  // Structure
  const structItems = [];
  const charCount = text.length;
  const goodLength = charCount >= 1200 && charCount <= 1900;
  structItems.push({ label: "Length", value: `${charCount} chars / ${f.word_count} words`, good: goodLength, bad: charCount < 400 || charCount > 2500 });
  structItems.push({ label: "Reading time", value: `${f.reading_time_seconds}s`, good: f.reading_time_seconds >= 30 && f.reading_time_seconds <= 90 });
  structItems.push({ label: "Paragraphs", value: `${f.paragraph_count}`, good: f.paragraph_count >= 3 && f.paragraph_count <= 8 });
  structItems.push({ label: "Short paragraph ratio", value: `${(f.short_para_ratio * 100).toFixed(0)}%`, good: f.short_para_ratio >= 0.3 && f.short_para_ratio <= 0.7 });
  if (f.uses_bullet_points) structItems.push({ label: "Bullet points", value: "Yes", good: true });
  if (f.uses_numbered_list) structItems.push({ label: "Numbered list", value: "Yes", good: true });
  structItems.push({ label: "Emoji density", value: `${f.emoji_density}/100 words`, good: f.emoji_density <= 3, bad: f.emoji_density > 5 });

  if (goodLength) score += 10;
  else if (charCount < 400) score -= 10;
  if (f.reading_time_seconds >= 30 && f.reading_time_seconds <= 90) score += 5;
  sections.push({ title: "Structure Analysis", items: structItems, color: "#7B9EC4" });

  // CTA
  const ctaItems = [];
  ctaItems.push({ label: "Ends with question", value: f.cta_is_question ? "Yes" : "No", good: !!f.cta_is_question, bad: !f.cta_is_question });
  if (f.cta_is_question) {
    ctaItems.push({ label: "Open-ended question", value: f.cta_is_open_ended ? "Yes — prompts detailed responses" : "No — yes/no question", good: !!f.cta_is_open_ended });
    score += f.cta_is_open_ended ? 10 : 5;
  } else {
    score -= 10;
  }
  ctaItems.push({ label: "Invites disagreement", value: f.cta_invites_disagreement ? "Yes — controversy drives comments" : "No", good: !!f.cta_invites_disagreement });
  if (f.cta_invites_disagreement) score += 5;

  const ctaVerdict = f.cta_is_open_ended ? "Strong — open-ended question invites 15+ word responses"
    : f.cta_is_question ? "Decent — but open-ended questions perform better than yes/no"
    : "Weak — add a question that draws on the reader's professional experience";
  ctaItems.push({ label: "Verdict", value: ctaVerdict, good: !!f.cta_is_open_ended, bad: !f.cta_is_question });
  sections.push({ title: "CTA Analysis", items: ctaItems, color: "#6B9E7D" });

  // Algorithm
  const algoItems = [];
  const goodHashtags = f.hashtags >= 3 && f.hashtags <= 5;
  algoItems.push({ label: "Hashtag count", value: `${f.hashtags} (optimal: 3-5)`, good: goodHashtags, bad: f.hashtags > 5 || f.hashtags === 0 });
  algoItems.push({ label: "Has external link", value: f.has_external_link ? "Yes — move to first comment for better reach" : "No — good", good: !f.has_external_link, bad: !!f.has_external_link });

  const hasBait = /like if you agree|comment yes|comment if you|share if you|repost if/i.test(text);
  algoItems.push({ label: "Engagement bait", value: hasBait ? "Detected — gets down-ranked" : "Clean", good: !hasBait, bad: hasBait });
  algoItems.push({ label: "Personal pronouns", value: `${f.personal_pronouns} — ${f.personal_pronouns >= 3 ? "personal and authentic" : "could be more personal"}`, good: f.personal_pronouns >= 3 });

  if (goodHashtags) score += 5;
  if (f.has_external_link) score -= 10;
  if (hasBait) score -= 15;
  sections.push({ title: "Algorithm Optimization", items: algoItems, color: "#D4A853" });

  // ML comparison
  if (mlResults?.optimalRanges?.word_count) {
    const mlItems = [];
    const r = mlResults.optimalRanges;
    if (r.word_count) mlItems.push({
      label: "Word count vs your top posts",
      value: `${f.word_count} (your top: ${r.word_count.p25}–${r.word_count.p75})`,
      good: f.word_count >= r.word_count.p25 && f.word_count <= r.word_count.p75,
    });
    if (mlResults.hookAnalysis?.length) {
      const bestHook = mlResults.hookAnalysis[0];
      mlItems.push({ label: "Best hook type in your data", value: `${bestHook.type} (avg ${bestHook.avgEngagement})`, good: hookType.toLowerCase().includes(bestHook.type) });
    }
    if (mlResults.ctaAnalysis?.length) {
      const bestCta = mlResults.ctaAnalysis[0];
      mlItems.push({ label: "Best CTA in your data", value: `${bestCta.type} (avg ${bestCta.avgEngagement})` });
    }
    if (mlItems.length) sections.push({ title: "Your Pattern Match", items: mlItems, color: "#E8664A" });
  }

  score = Math.max(0, Math.min(100, score));
  return { score, sections, features: f };
}

export default function Score({ profile, mlResults }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState("");

  const handleScore = () => {
    if (text.trim().length < 20) return;
    setResult(scorePost(text, mlResults));
    setOptimized("");
  };

  const handleOptimize = async () => {
    if (!result) return;
    setOptimizing(true);
    try {
      const scoreReport = result.sections.map((s) =>
        `${s.title}:\n${s.items.map((i) => `  ${i.label}: ${i.value}`).join("\n")}`
      ).join("\n\n");

      const resp = await callClaude(
        `You are a LinkedIn post optimizer for a ${profile?.industry || "business"} professional. Rewrite the post to fix the weak areas while keeping the author's voice and core message intact. Return ONLY the rewritten post, nothing else.

CRITICAL RULES:
- Do NOT add em dashes (—) as a stylistic device. One maximum per post.
- Do NOT add single-sentence dramatic paragraphs or sentence fragments for emphasis.
- Do NOT add "Let that sink in", "Read that again", "Here's the thing", "The reality is..."
- Do NOT use: landscape, navigate, nuanced, robust, delve, foster, leverage, holistic, paradigm, synergy, unlock, double down, lean into
- Do NOT add faux vulnerability ("I'll be honest...", "Can I be real?")
- Do NOT stack parallel threes ("It's ambitious. It's bold. It's necessary.")
- USE contractions naturally (I'm, don't, isn't, can't, we're)
- KEEP the conversational tone — write like a person, not a consulting deck
- VARY sentence structure — mix long and short, start with different words`,
        `ORIGINAL POST:\n${text}\n\nSCORE ANALYSIS:\n${scoreReport}\n\nOverall score: ${result.score}/100. Fix the weak areas. Keep the same topic and voice.`
      );
      setOptimized(resp);
    } catch (err) {
      setOptimized("Optimization failed: " + err.message);
    }
    setOptimizing(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 4, fontFamily: "'DM Serif Display', serif", color: "#2D2520" }}>Score a Draft</h2>
      <p style={{ color: "#8B7E74", fontSize: 13, marginBottom: 24 }}>
        Paste a post and get instant feedback on structure, hooks, CTAs, and algorithm optimization. Free — no API calls.
      </p>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setResult(null); setOptimized(""); }}
        placeholder="Paste your LinkedIn post draft here..."
        style={{
          width: "100%", minHeight: 160, background: "#fff", border: "1.5px solid #E8E2DA",
          borderRadius: 12, padding: "16px", color: "#2D2520", fontSize: 13,
          fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box",
          lineHeight: 1.6,
        }}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 24 }}>
        <button onClick={handleScore} disabled={text.trim().length < 20} style={{
          padding: "12px 28px", border: "none", borderRadius: 24,
          background: text.trim().length < 20 ? "#E8E2DA" : "#E8664A",
          color: text.trim().length < 20 ? "#B5A698" : "#fff",
          fontSize: 14, fontWeight: 700, cursor: text.trim().length < 20 ? "not-allowed" : "pointer",
        }}>Score This Post</button>
        {text.length > 0 && <span style={{ fontSize: 12, color: "#B5A698", alignSelf: "center" }}>{text.length} characters</span>}
      </div>

      {result && (
        <div>
          <ScoreGauge score={result.score} />
          {result.sections.map((s, i) => (
            <Section key={i} title={s.title} items={s.items} color={s.color} />
          ))}

          {/* Optimize button */}
          <button onClick={handleOptimize} disabled={optimizing} style={{
            padding: "12px 24px", border: "1px solid #E8E2DA", borderRadius: 24,
            background: optimizing ? "#E8E2DA" : "#fff", color: optimizing ? "#B5A698" : "#5C534A",
            fontSize: 13, fontWeight: 600, cursor: optimizing ? "wait" : "pointer", marginTop: 8,
          }}>{optimizing ? "Optimizing..." : "Optimize with Ella"}</button>

          {optimized && (
            <div style={{
              background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14,
              padding: "20px 24px", marginTop: 16, boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6B9E7D" }}>Optimized Version</span>
                <button onClick={() => { navigator.clipboard.writeText(optimized); }} style={{
                  background: "#F7F3EE", border: "1px solid #E8E2DA", borderRadius: 20,
                  padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#5C534A", cursor: "pointer",
                }}>Copy</button>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "#2D2520", whiteSpace: "pre-wrap" }}>{optimized}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
