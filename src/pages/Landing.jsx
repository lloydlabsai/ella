import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const STEPS = [
    { icon: "📸", title: "Screenshot", desc: "Snap any LinkedIn post that's crushing it in your industry" },
    { icon: "🧠", title: "Ella Reads It", desc: "AI Vision extracts text, engagement numbers, author — everything" },
    { icon: "🔬", title: "ML Discovers Patterns", desc: "As your database grows, Ella finds what actually drives engagement" },
    { icon: "✍️", title: "Draft Optimized Posts", desc: "AI agents apply your patterns + trending topics to write posts that hit" },
  ];

  const FEATURES = [
    { title: "Any Industry", desc: "SaaS, healthcare, fintech, real estate, CPG — Ella learns YOUR niche", icon: "🌍" },
    { title: "Real ML, Not Guessing", desc: "TF-IDF, correlation analysis, n-gram discovery on your actual data", icon: "📊" },
    { title: "Screenshot-First", desc: "No scraping, no APIs, no risk. Just screenshot and go", icon: "📱" },
    { title: "Your Voice", desc: "Configure brand voice, writing style, and optional product mentions", icon: "🎙️" },
    { title: "Fact Validation", desc: "Pro tier: Tavily + Perplexity verify every claim with live sources", icon: "✅", pro: true },
    { title: "Private Database", desc: "Your posts, your patterns, your data. Row-level security by default", icon: "🔒" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c10", color: "#e0e0e0", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

      {/* Hero */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 28px 60px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🦜</div>
        <h1 style={{
          fontSize: 52, fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: "-1.5px",
          background: "linear-gradient(135deg, #E8A838, #D4782F)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Ella
        </h1>
        <p style={{ fontSize: 22, color: "#999", maxWidth: 520, margin: "0 auto 12px", lineHeight: 1.4, fontWeight: 500 }}>
          She learns what makes LinkedIn posts go viral in your industry. Then writes you one.
        </p>
        <p style={{ fontSize: 14, color: "#555", marginBottom: 40 }}>
          ML-powered engagement pattern discovery → AI-generated drafts → fact validation
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <button onClick={() => navigate("/signup")} style={{
            padding: "16px 36px", border: "none", borderRadius: 12,
            background: "linear-gradient(135deg, #E8A838, #D4782F)",
            color: "#111", fontSize: 16, fontWeight: 800, cursor: "pointer",
          }}>Get Started Free</button>
          <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} style={{
            padding: "16px 28px", border: "1px solid #333", borderRadius: 12,
            background: "transparent", color: "#aaa", fontSize: 16, fontWeight: 600, cursor: "pointer",
          }}>See How It Works</button>
        </div>
      </div>

      {/* How it works */}
      <div id="how" style={{ maxWidth: 800, margin: "0 auto", padding: "60px 28px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E8A838", textTransform: "uppercase", letterSpacing: 2, textAlign: "center", marginBottom: 40 }}>
          How Ella Works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, margin: "0 auto 14px",
                background: "rgba(232,168,56,0.08)", border: "1px solid #E8A83822",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>{step.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ddd", marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{step.desc}</div>
              {i < 3 && (
                <div style={{ position: "absolute", right: -10, top: "50%", color: "#333", fontSize: 18 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 28px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E8A838", textTransform: "uppercase", letterSpacing: 2, textAlign: "center", marginBottom: 40 }}>
          Features
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f",
              borderRadius: 14, padding: "22px 20px",
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ddd", marginBottom: 4 }}>
                {f.title}
                {f.pro && <span style={{ fontSize: 10, color: "#E8A838", marginLeft: 6, background: "rgba(232,168,56,0.1)", padding: "2px 6px", borderRadius: 8 }}>PRO</span>}
              </div>
              <div style={{ fontSize: 12, color: "#777", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 28px 100px", textAlign: "center" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(232,168,56,0.08), rgba(212,120,47,0.08))",
          border: "1px solid #E8A83822", borderRadius: 20, padding: "48px 32px",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🦜</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f0f0f0", marginBottom: 8 }}>
            Start building your playbook
          </h2>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            10 screenshots in, Ella starts finding patterns. 100 in, she knows your industry cold.
          </p>
          <button onClick={() => navigate("/signup")} style={{
            padding: "14px 32px", border: "none", borderRadius: 12,
            background: "linear-gradient(135deg, #E8A838, #D4782F)",
            color: "#111", fontSize: 15, fontWeight: 800, cursor: "pointer",
          }}>Get Started Free →</button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1a1a1f", padding: "24px 28px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#444" }}>
          Ella — named after an African Grey Parrot who learns your language and speaks it back better.
        </span>
      </div>
    </div>
  );
}
