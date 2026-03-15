import { useEffect, useRef } from "react";
import * as d3 from "d3";

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
    g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", data.length * barH).attr("stroke", "#444");
    data.forEach((d, i) => {
      const val = d.correlation;
      const barW = Math.abs(x(val) - x(0));
      g.append("rect")
        .attr("x", val >= 0 ? x(0) : x(0) - barW)
        .attr("y", i * barH + 3).attr("width", barW).attr("height", barH - 6)
        .attr("fill", val >= 0 ? "#4CAF7D" : "#E85B5B").attr("rx", 3).attr("opacity", 0.8);
      g.append("text").attr("x", -6).attr("y", i * barH + barH / 2 + 1)
        .attr("text-anchor", "end").attr("fill", "#999").attr("font-size", "11px")
        .text(d.feature.replace(/_/g, " "));
      g.append("text")
        .attr("x", val >= 0 ? x(val) + 6 : x(val) - 6)
        .attr("y", i * barH + barH / 2 + 1)
        .attr("text-anchor", val >= 0 ? "start" : "end")
        .attr("fill", "#aaa").attr("font-size", "10px").text(val.toFixed(2));
    });
  }, [data]);
  return <div ref={ref} style={{ width: "100%" }} />;
}

function BarChart({ data, xKey, yKey, color = "#E8A838", height = 200 }) {
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
      .selectAll("text").attr("fill", "#888").attr("font-size", "10px").attr("transform", "rotate(-30)").attr("text-anchor", "end");
    g.append("g").call(d3.axisLeft(y).ticks(4)).selectAll("text").attr("fill", "#888").attr("font-size", "10px");
    g.selectAll(".domain, .tick line").attr("stroke", "#333");
    g.selectAll(".bar").data(data).join("rect")
      .attr("x", (d) => x(d[xKey])).attr("y", (d) => y(d[yKey]))
      .attr("width", x.bandwidth()).attr("height", (d) => h - y(d[yKey]))
      .attr("fill", color).attr("rx", 3).attr("opacity", 0.85);
  }, [data, xKey, yKey, color, height]);
  return <div ref={ref} style={{ width: "100%" }} />;
}

function Pill({ children, color = "#E8A838" }) {
  return (
    <span style={{
      display: "inline-block", background: color + "18", color, fontSize: 12,
      fontWeight: 700, padding: "3px 10px", borderRadius: 20, marginRight: 6, marginBottom: 6,
      fontFamily: "'JetBrains Mono', monospace",
    }}>{children}</span>
  );
}

export default function Analyze({ posts, mlAnalysis }) {
  const { results, analyzing, analyze } = mlAnalysis;

  const handleRun = () => {
    const mapped = posts.posts.map((p) => ({
      post_text: p.post_text || "",
      likes: p.likes || 0,
      comments_count: p.comments_count || 0,
      shares: p.shares || 0,
      comment_texts: p.comment_texts || "",
    }));
    analyze(mapped);
  };

  if (!results && !analyzing) {
    return (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>ML Analysis</h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 28 }}>
          Discover what engagement patterns exist in your captured posts.
        </p>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔬</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#ccc", marginBottom: 8 }}>
            {posts.count < 3
              ? `Need at least 3 posts (you have ${posts.count})`
              : `${posts.count} posts ready for analysis`}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            The ML pipeline will analyze structural patterns, vocabulary, hooks, CTAs, and correlate everything with engagement scores.
          </div>
          <button onClick={handleRun} disabled={posts.count < 3} style={{
            padding: "14px 32px", border: "none", borderRadius: 12,
            background: posts.count < 3 ? "#333" : "linear-gradient(135deg, #E8A838, #D4782F)",
            color: posts.count < 3 ? "#666" : "#111", fontSize: 14, fontWeight: 800,
            cursor: posts.count < 3 ? "not-allowed" : "pointer",
          }}>Run ML Analysis →</button>
        </div>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 1.5s infinite" }}>🔬</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#E8A838" }}>Running ML Pipeline...</div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Analyzing {posts.count} posts</div>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  const r = results;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>ML Engagement Patterns</h2>
          <p style={{ color: "#666", fontSize: 13 }}>{r.totalPosts} posts analyzed</p>
        </div>
        <button onClick={handleRun} style={{
          padding: "10px 20px", border: "1px solid #333", borderRadius: 10,
          background: "transparent", color: "#aaa", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Re-run Analysis</button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { l: "Posts", v: r.totalPosts, c: "#E8A838" },
          { l: "Avg Engagement", v: r.avgEngagement, c: "#4CAF7D" },
          { l: "Top 20% Threshold", v: r.p80Threshold, c: "#5B8DEF" },
          { l: "Top Posts", v: r.topCount, c: "#E85B5B" },
        ].map((s) => (
          <div key={s.l} style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid #1a1a1f",
            borderRadius: 10, padding: "14px 18px", flex: 1, minWidth: 120,
          }}>
            <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.c, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Correlations */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "#ddd" }}>Feature ↔ Engagement Correlations</h3>
        <p style={{ fontSize: 11, color: "#555", marginBottom: 14 }}>Green = positive correlation. Red = negative.</p>
        <CorrelationBars data={r.correlations} />
      </div>

      {/* Hook + CTA */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#ddd" }}>Hook Patterns</h3>
          <BarChart data={r.hookAnalysis} xKey="type" yKey="avgEngagement" color="#E8A838" />
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#ddd" }}>CTA Patterns</h3>
          <BarChart data={r.ctaAnalysis} xKey="type" yKey="avgEngagement" color="#5B8DEF" />
        </div>
      </div>

      {/* Terms */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#ddd" }}>High-Engagement Vocabulary</h3>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {r.differentialTerms.slice(0, 20).map((t) => (
            <Pill key={t.term} color={t.diff > 2 ? "#E8A838" : t.diff > 1 ? "#4CAF7D" : "#5B8DEF"}>
              {t.term} <span style={{ opacity: 0.6 }}>+{t.diff.toFixed(1)}</span>
            </Pill>
          ))}
        </div>
      </div>

      {/* Bigrams + Ranges */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#ddd" }}>Winning Bigrams</h3>
          {r.bigramDiff.slice(0, 10).map((b) => (
            <div key={b.bigram} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #181818" }}>
              <span style={{ fontSize: 12, color: "#bbb", fontFamily: "'JetBrains Mono', monospace" }}>"{b.bigram}"</span>
              <span style={{ fontSize: 11, color: "#E8A838", fontWeight: 600 }}>{b.ratio.toFixed(1)}x</span>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#ddd" }}>Optimal Structure</h3>
          {Object.entries(r.optimalRanges).map(([f, v]) => (
            <div key={f} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #181818" }}>
              <span style={{ fontSize: 12, color: "#999" }}>{f.replace(/_/g, " ")}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#4CAF7D" }}>
                {v.p25}–{v.p75} <span style={{ color: "#666" }}>med {v.median}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
