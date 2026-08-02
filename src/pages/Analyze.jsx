import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getConfidenceScore, getAnalysisTier, TIER_UNLOCKS } from "../utils/pipeline";
import { getSeedPatterns } from "../utils/seed-patterns";

function CorrelationBars({ data }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const el = ref.current;
    el.innerHTML = "";
    const margin = { top: 8, right: 16, bottom: 8, left: 140 };
    const barH = 22;
    const totalH = data.length * barH + margin.top + margin.bottom;
    const width = el.clientWidth - margin.left - margin.right;
    const svg = d3.select(el).append("svg").attr("width", el.clientWidth).attr("height", totalH);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([-1, 1]).range([0, width]);
    g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", data.length * barH).attr("stroke", "#E8E2DA");
    data.forEach((d, i) => {
      const val = d.correlation;
      const barW = Math.abs(x(val) - x(0));
      g.append("rect").attr("x", val >= 0 ? x(0) : x(0) - barW)
        .attr("y", i * barH + 3).attr("width", barW).attr("height", barH - 6)
        .attr("fill", val >= 0 ? "#6B9E7D" : "#D4695A").attr("rx", 3).attr("opacity", 0.8);
      g.append("text").attr("x", -6).attr("y", i * barH + barH / 2 + 1)
        .attr("text-anchor", "end").attr("fill", "#8B7E74").attr("font-size", "11px").text(d.feature.replace(/_/g, " "));
      g.append("text").attr("x", val >= 0 ? x(val) + 6 : x(val) - 6)
        .attr("y", i * barH + barH / 2 + 1).attr("text-anchor", val >= 0 ? "start" : "end")
        .attr("fill", "#5C534A").attr("font-size", "10px").text(val.toFixed(2));
    });
  }, [data]);
  return <div ref={ref} style={{ width: "100%" }} />;
}

function BarChart({ data, xKey, yKey, color = "#D4A853", height = 200 }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const el = ref.current;
    el.innerHTML = "";
    const margin = { top: 12, right: 12, bottom: 50, left: 50 };
    const w = el.clientWidth - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const svg = d3.select(el).append("svg").attr("width", el.clientWidth).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().domain(data.map((d) => d[xKey])).range([0, w]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d[yKey]) * 1.1]).range([h, 0]);
    g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x))
      .selectAll("text").attr("fill", "#8B7E74").attr("font-size", "10px").attr("transform", "rotate(-30)").attr("text-anchor", "end");
    g.append("g").call(d3.axisLeft(y).ticks(4)).selectAll("text").attr("fill", "#8B7E74").attr("font-size", "10px");
    g.selectAll(".domain, .tick line").attr("stroke", "#E8E2DA");
    g.selectAll(".bar").data(data).join("rect")
      .attr("x", (d) => x(d[xKey])).attr("y", (d) => y(d[yKey]))
      .attr("width", x.bandwidth()).attr("height", (d) => h - y(d[yKey]))
      .attr("fill", color).attr("rx", 3).attr("opacity", 0.85);
  }, [data, xKey, yKey, color, height]);
  return <div ref={ref} style={{ width: "100%" }} />;
}

function Pill({ children, color = "#E8664A" }) {
  return (
    <span style={{
      display: "inline-block", background: color + "12", color, fontSize: 12,
      fontWeight: 700, padding: "3px 10px", borderRadius: 20, marginRight: 6, marginBottom: 6,
      fontFamily: "'JetBrains Mono', monospace",
    }}>{children}</span>
  );
}

function LockedSection({ title, postsNeeded, currentPosts }) {
  const remaining = postsNeeded - currentPosts;
  return (
    <div style={{
      position: "relative", background: "#fff", border: "1px solid #EDE8E1",
      borderRadius: 14, padding: "20px 24px", marginBottom: 20,
      boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
    }}>
      <div style={{ filter: "blur(4px)", opacity: 0.3, pointerEvents: "none" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#2D2520", marginBottom: 8 }}>{title}</h3>
        <div style={{ height: 80, background: "#F7F3EE", borderRadius: 8 }} />
      </div>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center", borderRadius: 14,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2520" }}>{title}</div>
          <div style={{ fontSize: 12, color: "#8B7E74", marginTop: 4 }}>
            Capture {remaining} more post{remaining !== 1 ? "s" : ""} to unlock
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceRing({ score, size = 80 }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? "#6B9E7D" : score >= 50 ? "#D4A853" : "#E8664A";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F0EBE4" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 18, fontWeight: 800, color,
        fontFamily: "'JetBrains Mono', monospace",
      }}>{score}%</div>
    </div>
  );
}

export default function Analyze({ posts, mlAnalysis, profile }) {
  const { results, analyzing, analyze } = mlAnalysis;
  const postCount = posts.count;
  const tier = getAnalysisTier(postCount);
  const confidence = getConfidenceScore(postCount);
  const canRun = postCount >= 5;

  const handleRun = () => {
    const mapped = posts.posts.map((p) => ({
      post_text: p.post_text || "",
      likes: p.likes || 0,
      comments_count: p.comments_count || 0,
      shares: p.shares || 0,
      comment_texts: p.comment_texts || "",
      reactions_breakdown: p.reactions_breakdown || null,
      has_image: p.has_image || false,
      has_video: p.has_video || false,
      has_carousel: p.has_carousel || false,
      capture_method: p.capture_method || "extension",
      has_engagement_data: p.has_engagement_data !== false,
    }));
    analyze(mapped);
  };

  // Show seed patterns for users with 0 posts
  const seedPatterns = getSeedPatterns(profile?.industry);
  const showSeed = !results && !analyzing && postCount === 0 && seedPatterns;

  // ─── Pre-analysis state ────────────────────────────────
  if (!results && !analyzing && !showSeed) {
    return (
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 4, fontFamily: "'DM Serif Display', serif", color: "#2D2520" }}>What's Working</h2>
        <p style={{ color: "#8B7E74", fontSize: 14, marginBottom: 28 }}>
          Discover what engagement patterns exist in your captured posts.
        </p>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <ConfidenceRing score={confidence} size={100} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "#2D2520", marginTop: 16, marginBottom: 4 }}>
            {canRun ? `${postCount} posts ready — ${tier.label}` : `${postCount}/5 posts captured`}
          </div>
          <div style={{ fontSize: 12, color: "#8B7E74", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            {!canRun
              ? `Capture ${5 - postCount} more posts to unlock early pattern analysis.`
              : postCount < 20
                ? "Ella is learning. Capture more posts to unlock deeper analysis."
                : "Ella will analyze structural patterns, vocabulary, hooks, CTAs, and correlate everything with engagement scores."}
          </div>
          <button onClick={handleRun} disabled={!canRun} style={{
            padding: "14px 32px", border: "none", borderRadius: 24,
            background: !canRun ? "#E8E2DA" : "#E8664A",
            color: !canRun ? "#B5A698" : "#fff", fontSize: 14, fontWeight: 700,
            cursor: !canRun ? "not-allowed" : "pointer",
          }}>Find My Patterns</button>
        </div>
      </div>
    );
  }

  // ─── Seed patterns for 0-post users ──────────────────
  if (showSeed) {
    const sp = seedPatterns;
    const industry = profile?.industry || "your industry";
    return (
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 4, fontFamily: "'DM Serif Display', serif", color: "#2D2520" }}>Industry Baseline</h2>
        <div style={{
          padding: "12px 16px", background: "rgba(212,168,83,0.08)",
          border: "1px solid rgba(212,168,83,0.2)", borderRadius: 10,
          fontSize: 12, color: "#8B7E74", marginBottom: 24, lineHeight: 1.5,
        }}>
          Industry baseline — what typically works in <strong style={{ color: "#2D2520" }}>{industry}</strong>.
          Capture your own posts for personalized patterns.
        </div>

        <ConfidenceRing score={20} size={64} />

        {sp.optimalRanges && Object.keys(sp.optimalRanges).length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", marginTop: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#2D2520", marginBottom: 12 }}>Sweet Spots (Industry Baseline)</h3>
            {Object.entries(sp.optimalRanges).map(([f, v]) => (
              <div key={f} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F0EBE4" }}>
                <span style={{ fontSize: 12, color: "#8B7E74" }}>{f.replace(/_/g, " ")}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6B9E7D" }}>
                  {v.p25}–{v.p75} <span style={{ color: "#B5A698" }}>med {v.median}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {sp.hookAnalysis?.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#2D2520", marginBottom: 12 }}>Best Opening Styles (Industry Baseline)</h3>
            <BarChart data={sp.hookAnalysis} xKey="type" yKey="avgEngagement" color="#D4A853" />
          </div>
        )}

        {sp.mediaPerformance?.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#2D2520", marginBottom: 12 }}>Media Type Performance (Industry Baseline)</h3>
            <BarChart data={sp.mediaPerformance} xKey="type" yKey="avgEngagement" color="#7B9EC4" />
          </div>
        )}

        <LockedSection title="Winning Vocabulary" postsNeeded={20} currentPosts={0} />
        <LockedSection title="What Drives Engagement" postsNeeded={20} currentPosts={0} />
      </div>
    );
  }

  if (analyzing) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#E8664A", animation: "pulse 1.5s infinite" }}>Finding your patterns...</div>
        <div style={{ fontSize: 12, color: "#8B7E74", marginTop: 6 }}>Analyzing {postCount} posts</div>
      </div>
    );
  }

  // ─── Results state ─────────────────────────────────────
  const r = results;
  const u = r.unlocks || TIER_UNLOCKS[r.tier?.id] || TIER_UNLOCKS.early;
  const rc = r.confidence || confidence;
  const strengthWord = rc >= 90 ? "Definitive" : rc >= 75 ? "Very Strong" : rc >= 50 ? "Strong" : rc >= 30 ? "Growing" : "Emerging";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ConfidenceRing score={rc} size={64} />
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 2, fontFamily: "'DM Serif Display', serif", color: "#2D2520" }}>
              {strengthWord} Patterns
            </h2>
            <p style={{ color: "#8B7E74", fontSize: 13 }}>Ella studied {r.totalPosts} posts</p>
          </div>
        </div>
        <button onClick={handleRun} style={{
          padding: "10px 20px", border: "1px solid #E8E2DA", borderRadius: 20,
          background: "#fff", color: "#5C534A", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Refresh Patterns</button>
      </div>

      {/* Stats — always visible */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { l: "Posts", v: r.totalPosts, c: "#E8664A" },
          { l: "Avg Engagement", v: r.avgEngagement, c: "#6B9E7D" },
          { l: "Top 20% Threshold", v: r.p80Threshold, c: "#7B9EC4" },
          { l: "Top Posts", v: r.topCount, c: "#D4695A" },
        ].map((s) => (
          <div key={s.l} style={{
            background: "#fff", border: "1px solid #EDE8E1", borderRadius: 10,
            padding: "14px 18px", flex: 1, minWidth: 120,
            boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
          }}>
            <div style={{ fontSize: 10, color: "#B5A698", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.c, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Hook Patterns — 10+ posts */}
      {u.hookAnalysis && r.hookAnalysis.length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#2D2520" }}>Best Opening Styles</h3>
          <BarChart data={r.hookAnalysis} xKey="type" yKey="avgEngagement" color="#D4A853" />
        </div>
      ) : (
        <LockedSection title="Best Opening Styles" postsNeeded={10} currentPosts={r.totalPosts} />
      )}

      {/* Optimal Structure — 10+ posts */}
      {u.optimalRanges && Object.keys(r.optimalRanges).length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#2D2520" }}>Sweet Spots</h3>
          {Object.entries(r.optimalRanges).map(([f, v]) => (
            <div key={f} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F0EBE4" }}>
              <span style={{ fontSize: 12, color: "#8B7E74" }}>{f.replace(/_/g, " ")}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6B9E7D" }}>
                {v.p25}–{v.p75} <span style={{ color: "#B5A698" }}>med {v.median}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <LockedSection title="Sweet Spots" postsNeeded={10} currentPosts={r.totalPosts} />
      )}

      {/* CTA Patterns — 15+ posts */}
      {u.ctaAnalysis && r.ctaAnalysis.length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#2D2520" }}>Best Closing Styles</h3>
          <BarChart data={r.ctaAnalysis} xKey="type" yKey="avgEngagement" color="#7B9EC4" />
        </div>
      ) : (
        <LockedSection title="Best Closing Styles" postsNeeded={15} currentPosts={r.totalPosts} />
      )}

      {/* Correlations — 20+ posts */}
      {u.correlations && r.correlations.length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "#2D2520" }}>What Drives Engagement</h3>
          <p style={{ fontSize: 11, color: "#B5A698", marginBottom: 14 }}>Green = boosts engagement. Red = hurts engagement.</p>
          <CorrelationBars data={r.correlations} />
        </div>
      ) : (
        <LockedSection title="What Drives Engagement" postsNeeded={20} currentPosts={r.totalPosts} />
      )}

      {/* Vocabulary + Bigrams — 20+ posts */}
      {u.differentialTerms && r.differentialTerms.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#2D2520" }}>Winning Vocabulary</h3>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {(() => {
                const terms = r.differentialTerms.slice(0, 20);
                // diff is a per-post mean, so shade relative to the strongest
                // term in this set rather than against fixed magnitudes.
                const strongest = Math.max(...terms.map((t) => Math.abs(t.diff)), 1e-6);
                return terms.map((t) => (
                  <Pill
                    key={t.term}
                    color={t.diff <= 0 ? "#7B9EC4" : t.diff > strongest * 0.6 ? "#E8664A" : "#6B9E7D"}
                  >
                    {t.term}{" "}
                    <span style={{ opacity: 0.6 }}>
                      {t.diff >= 0 ? "+" : ""}{t.diff.toFixed(2)}
                    </span>
                  </Pill>
                ));
              })()}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#2D2520" }}>Winning Phrases</h3>
            {r.bigramDiff.slice(0, 10).map((b) => (
              <div key={b.bigram} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F0EBE4" }}>
                <span style={{ fontSize: 12, color: "#5C534A", fontFamily: "'JetBrains Mono', monospace" }}>"{b.bigram}"</span>
                <span style={{ fontSize: 11, color: "#E8664A", fontWeight: 600 }}>{b.ratio.toFixed(1)}x</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <LockedSection title="Winning Vocabulary" postsNeeded={20} currentPosts={r.totalPosts} />
          <LockedSection title="Winning Phrases" postsNeeded={20} currentPosts={r.totalPosts} />
        </div>
      )}

      {/* Reaction Patterns — 50+ posts with data */}
      {u.reactionPatterns ? (
        <div style={{ background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(45,37,32,0.04)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "#2D2520" }}>Reaction Patterns</h3>
          <p style={{ fontSize: 11, color: "#B5A698" }}>Which content triggers which emotions</p>
        </div>
      ) : (
        <LockedSection title="Reaction Patterns" postsNeeded={50} currentPosts={r.totalPosts} />
      )}
    </div>
  );
}
