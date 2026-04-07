import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const STEPS = [
    { num: "01", title: "Capture", desc: "Screenshot high-performing LinkedIn posts from your industry via Chrome extension or upload" },
    { num: "02", title: "Analyze", desc: "ML discovers what actually drives engagement — hooks, structure, vocabulary, CTAs" },
    { num: "03", title: "Create", desc: "AI agents draft posts using your patterns, trending topics, and brand voice" },
    { num: "04", title: "Validate", desc: "Fact-check every claim with live sources before you publish" },
  ];

  const FEATURES = [
    { title: "Any Industry", desc: "SaaS, healthcare, fintech, real estate, CPG — Ella learns your niche's language", icon: "industry" },
    { title: "Real ML, Not Guessing", desc: "TF-IDF, Pearson correlation, n-gram discovery on your actual engagement data", icon: "ml" },
    { title: "Instant Value", desc: "Generate posts on day one. ML makes them better as you capture more", icon: "instant" },
    { title: "Your Voice", desc: "Configure brand voice, writing style, and product mentions that feel natural", icon: "voice" },
    { title: "Fact Validation", desc: "Tavily + Perplexity verify every claim and inject real-time data", icon: "validate", pro: true },
    { title: "Private by Default", desc: "Your posts, your patterns, your data. Row-level security on everything", icon: "private" },
  ];

  const featureIcons = {
    industry: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B5A698" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    ml: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B5A698" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 5-9"/>
      </svg>
    ),
    instant: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B5A698" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    voice: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B5A698" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    ),
    validate: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B5A698" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    private: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B5A698" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EE", color: "#2D2520", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* ─── Nav ─── */}
      <nav style={{
        maxWidth: 1120, margin: "0 auto", padding: "20px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img src="/ella-parrot.png" alt="Ella" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Product", "Features", "Pricing"].map(label => (
              <button key={label} onClick={() => {
                const id = label.toLowerCase();
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
              }} style={{
                background: "none", border: "none", color: "#6B5E54", fontSize: 14,
                fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}>{label}</button>
            ))}
            <button onClick={() => navigate("/signup")} style={{
              background: "none", border: "1.5px solid #D4CFC7", color: "#6B5E54",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              padding: "6px 16px", borderRadius: 20,
            }}>Book a Demo</button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => navigate("/login")} style={{
            background: "none", border: "none", color: "#6B5E54", fontSize: 14,
            fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>Log In</button>
          <button onClick={() => navigate("/signup")} style={{
            background: "none", border: "1.5px solid #E8664A", color: "#E8664A",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            padding: "8px 20px", borderRadius: 20,
          }}>Get Started Free</button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <div style={{
        maxWidth: 1120, margin: "0 auto", padding: "60px 32px 80px",
        display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: 60,
      }}>
        <div>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 52, fontWeight: 400,
            lineHeight: 1.12, color: "#2D2520", marginBottom: 20, letterSpacing: "-0.5px",
          }}>
            Ella learns what works.<br />Then helps you write it.
          </h1>
          <p style={{ fontSize: 16, color: "#8C7E72", lineHeight: 1.7, maxWidth: 440, marginBottom: 36 }}>
            Capture high-performing LinkedIn posts from your industry. Ella discovers
            the patterns behind engagement, then drafts posts that use them.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button onClick={() => navigate("/signup")} style={{
              padding: "14px 28px", border: "none", borderRadius: 24,
              background: "#E8664A", color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 2px 12px rgba(232,102,74,0.25)",
            }}>Try Free</button>
            <button onClick={() => document.getElementById("product")?.scrollIntoView({ behavior: "smooth" })} style={{
              padding: "14px 28px", border: "1.5px solid #D4CFC7", borderRadius: 24,
              background: "transparent", color: "#6B5E54", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>Explore Features</button>
          </div>
        </div>

        {/* Parrot illustration mosaic */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "relative", width: 400, height: 400 }}>
            {/* Decorative grid tiles behind the parrot */}
            <div style={{
              position: "absolute", inset: 0,
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)",
              gap: 10, padding: 10,
            }}>
              {[
                { bg: "#EDE8E1", radius: "20px" },
                { bg: "#F3EFEA", radius: "20px" },
                { bg: "#EDE8E1", radius: "20px" },
                { bg: "#F3EFEA", radius: "20px" },
                { bg: "transparent", radius: "20px" },
                { bg: "#E8664A", radius: "20px", opacity: 0.08 },
                { bg: "#EDE8E1", radius: "20px" },
                { bg: "#E8664A", radius: "20px", opacity: 0.06 },
                { bg: "#F3EFEA", radius: "20px" },
              ].map((tile, i) => (
                <div key={i} style={{
                  background: tile.bg, borderRadius: tile.radius, opacity: tile.opacity || 1,
                  ...(i === 4 ? { background: "transparent" } : {}),
                }} />
              ))}
            </div>
            {/* Decorative shapes */}
            <div style={{
              position: "absolute", top: 30, right: 20, width: 80, height: 80,
              borderRadius: "50%", background: "rgba(232,102,74,0.08)",
            }} />
            <div style={{
              position: "absolute", bottom: 50, left: 15, width: 60, height: 60,
              borderRadius: "50%", background: "rgba(232,102,74,0.06)",
            }} />
            {/* Parrot logo centered */}
            <img src="/ella-parrot.png" alt="Ella" style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 200, height: 200, objectFit: "contain",
              filter: "drop-shadow(0 8px 32px rgba(45,37,32,0.08))",
            }} />
          </div>
        </div>
      </div>

      {/* ─── How It Works ─── */}
      <div id="product" style={{
        background: "#EFEBE5", padding: "80px 32px",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "#E8664A", textTransform: "uppercase",
            letterSpacing: 2.5, textAlign: "center", marginBottom: 12,
          }}>How It Works</p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400,
            textAlign: "center", color: "#2D2520", marginBottom: 56,
          }}>From capture to publish in four steps</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{
                background: "#F7F3EE", borderRadius: 16, padding: "28px 24px",
                position: "relative",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#E8664A", letterSpacing: 1,
                  marginBottom: 14, fontFamily: "'DM Sans', sans-serif",
                }}>{step.num}</div>
                <div style={{
                  fontSize: 17, fontWeight: 700, color: "#2D2520", marginBottom: 8,
                }}>{step.title}</div>
                <div style={{
                  fontSize: 13, color: "#8C7E72", lineHeight: 1.6,
                }}>{step.desc}</div>
                {i < 3 && (
                  <div style={{
                    position: "absolute", right: -18, top: "50%", transform: "translateY(-50%)",
                    color: "#D4CFC7", fontSize: 20, fontWeight: 300, zIndex: 1,
                  }}>&rarr;</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <div id="features" style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "#E8664A", textTransform: "uppercase",
            letterSpacing: 2.5, textAlign: "center", marginBottom: 12,
          }}>Features</p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400,
            textAlign: "center", color: "#2D2520", marginBottom: 56,
          }}>Everything you need to win on LinkedIn</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: "#EFEBE5", borderRadius: 16, padding: "28px 24px",
                transition: "transform 0.15s ease",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  background: "#F7F3EE", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {featureIcons[f.icon]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2D2520", marginBottom: 6 }}>
                  {f.title}
                  {f.pro && (
                    <span style={{
                      fontSize: 10, color: "#E8664A", marginLeft: 8,
                      background: "rgba(232,102,74,0.08)", padding: "3px 8px", borderRadius: 10,
                      fontWeight: 700, letterSpacing: 0.5, verticalAlign: "middle",
                    }}>PRO</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "#8C7E72", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Pricing teaser ─── */}
      <div id="pricing" style={{ background: "#EFEBE5", padding: "80px 32px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "#E8664A", textTransform: "uppercase",
            letterSpacing: 2.5, marginBottom: 12,
          }}>Pricing</p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400,
            color: "#2D2520", marginBottom: 16,
          }}>Start free. Upgrade when you're ready.</h2>
          <p style={{ fontSize: 15, color: "#8C7E72", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 40px" }}>
            Capture posts, run ML analysis, and generate drafts — all free.
            Upgrade for fact validation, enriched drafts, and a larger database.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 640, margin: "0 auto" }}>
            {/* Free tier */}
            <div style={{
              background: "#F7F3EE", borderRadius: 16, padding: "32px 28px", textAlign: "left",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#8C7E72", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Free</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#2D2520", marginBottom: 20 }}>$0</div>
              {["Screenshot capture", "ML pattern analysis", "AI post generation", "Chrome extension", "Post scoring"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: "#6B5E54" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#E8664A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {item}
                </div>
              ))}
              <button onClick={() => navigate("/signup")} style={{
                width: "100%", padding: "12px", border: "1.5px solid #D4CFC7", borderRadius: 20,
                background: "transparent", color: "#6B5E54", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", marginTop: 20,
              }}>Get Started</button>
            </div>

            {/* Pro tier */}
            <div style={{
              background: "#2D2520", borderRadius: 16, padding: "32px 28px", textAlign: "left",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E8664A", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Pro</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#F7F3EE", marginBottom: 20 }}>Coming soon</div>
              {["Everything in Free", "Fact validation (Tavily + Perplexity)", "Enriched drafts with live data", "Larger post database", "Priority support"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: "#B5A698" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#E8664A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {item}
                </div>
              ))}
              <button onClick={() => navigate("/signup")} style={{
                width: "100%", padding: "12px", border: "none", borderRadius: 20,
                background: "#E8664A", color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", marginTop: 20,
              }}>Join Waitlist</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Final CTA ─── */}
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <div style={{
          maxWidth: 640, margin: "0 auto", background: "#EFEBE5",
          borderRadius: 24, padding: "56px 40px",
        }}>
          <img src="/ella-parrot.png" alt="Ella" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 20 }} />
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 32, fontWeight: 400,
            color: "#2D2520", marginBottom: 12,
          }}>Start building your playbook</h2>
          <p style={{ fontSize: 15, color: "#8C7E72", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Capture your first post today. Ella gets smarter with every screenshot.
          </p>
          <button onClick={() => navigate("/signup")} style={{
            padding: "14px 32px", border: "none", borderRadius: 24,
            background: "#E8664A", color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 2px 12px rgba(232,102,74,0.25)",
          }}>Get Started Free</button>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div style={{ borderTop: "1px solid #E8E2DA", padding: "28px 32px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#B5A698" }}>
          Ella — named after an African Grey Parrot who learns your language and speaks it back better.
        </span>
      </div>
    </div>
  );
}
