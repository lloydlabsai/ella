import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const PAIN_POINTS = [
    { label: "The Ghost Profile", title: "Your profile is a blank stare", desc: "You have years of expertise, but your LinkedIn is a ghost town. When recruiters or partners look for you, silence tells them you're out of the loop. Your digital reputation isn't matching your real-world authority." },
    { label: "The Time Trap", title: "Content creation is a second job", desc: "Monitoring news and brainstorming hooks takes hours you don't have. You're running a career, not a media company. If a post takes more than 5 minutes to draft, it simply doesn't happen." },
    { label: "The AI Vibe Check", title: "You sound like a bot", desc: "You've tried the generic AI tools. They're polished, bland, and obviously not you. Your network wants to hear how you think, not how an LLM summarizes." },
    { label: "The Black Box Algorithm", title: "Posting feels like a coin flip", desc: "You scroll past posts with 500 reactions and wonder how they do that. Stop guessing. The patterns are there — you just can't see them yet." },
  ];

  const WHY_NOW = [
    { title: "Your profile is a digital background check", desc: "Recruiters, clients, and partners vet your LinkedIn before they ever visit your website. A static profile suggests you've stopped growing. A dynamic, insight-driven feed proves you're still leading the conversation." },
    { title: "Visibility is the ultimate multiplier", desc: "The professionals landing speaking slots and partnership offers aren't always the most qualified — they're the most visible. Only 5% of LinkedIn users post original content. Showing up consistently is the easiest competitive advantage most professionals ignore." },
    { title: "Your expertise is a depreciating asset", desc: "Your professional judgment is your most valuable asset. If it only exists in private meetings, it's not working for you. The people building inbound pipelines are the ones putting their thinking where others can find it." },
  ];

  const STEPS = [
    { num: "01", title: "Capture the Signal", desc: "You saw a headline about tariffs hitting your supply chain. A competitor made a move. Or Ella surfaces 5 trending signals in your niche. Pick the one that matters — you're already past the blank page." },
    { num: "02", title: "Filter the Context", desc: "Ella pulls the data, the facts, and the angles. You toggle off the fluff and keep the 2-3 insights that actually drive value. This is where your professional judgment does the filtering no generic AI can do." },
    { num: "03", title: "Inject the Insight", desc: "One sentence. Your take. The in-the-trenches perspective from a decade of experience. This is the 10% of effort that turns a news update into a post worth stopping for." },
    { num: "04", title: "Ship It", desc: "Ella assembles the draft in your voice, optimized for the feed. Sharpen a line, check the performance score, copy to clipboard. Done before your coffee gets cold." },
  ];

  const FEATURES = [
    { title: "Any Industry", desc: "CPG, SaaS, healthcare, logistics — Ella researches your specific niche in real time. Every topic suggestion and every draft is grounded in what's actually happening in your industry right now.", icon: "industry" },
    { title: "Learns What Works", desc: "Ella identifies the hooks, structures, and vocabulary currently winning in your niche. She doesn't guess what works — she reverse-engineers it from posts that are actually performing.", icon: "ml" },
    { title: "Instant Value", desc: "Your first post takes minutes, not hours. Ella is ready on day one and gets sharper the more you use her.", icon: "instant" },
    { title: "Your Voice", desc: "Not simulated. Captured. Ella models your professional judgment and tone so drafts pass the vibe check with your most skeptical peers.", icon: "voice" },
    { title: "Post Scorer", desc: "Paste any draft and know if it'll land. Hook strength, structure, readability, algorithm fit — instant, free, unlimited.", icon: "validate" },
    { title: "Private by Default", desc: "Your insights are your competitive advantage. Row-level security on everything. We build your reputation, we don't share your secrets.", icon: "private" },
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
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
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
      <style>{`
        @media (max-width: 768px) {
          .ella-nav { padding: 16px 20px !important; }
          .ella-nav-buttons { gap: 10px !important; }
          .ella-nav-buttons button { font-size: 12px !important; padding: 6px 14px !important; }

          .ella-hero { grid-template-columns: 1fr !important; padding: 32px 20px 48px !important; gap: 24px !important; }
          .ella-hero-illustration { width: 260px !important; height: 260px !important; }
          .ella-hero h1 { font-size: 34px !important; }
          .ella-hero p { font-size: 15px !important; }
          .ella-hero-ctas { flex-wrap: wrap !important; }

          .ella-section { padding: 48px 20px !important; }
          .ella-section-inner { padding: 0 !important; }
          .ella-section h2 { font-size: 26px !important; margin-bottom: 32px !important; }

          .ella-grid-2, .ella-grid-3, .ella-grid-4 {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .ella-pricing-grid { grid-template-columns: 1fr !important; }

          .ella-final-cta { padding: 40px 24px !important; }
          .ella-final-cta h2 { font-size: 24px !important; }
        }
      `}</style>

      {/* ─── Nav ─── */}
      <nav className="ella-nav" style={{
        maxWidth: 1120, margin: "0 auto", padding: "20px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/ella-parrot.png" alt="Ella" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, color: "#2D2520" }}>Ella</span>
        </div>

        <div className="ella-nav-buttons" style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
      <div className="ella-hero" style={{
        maxWidth: 1120, margin: "0 auto", padding: "60px 32px 80px",
        display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: 60,
      }}>
        <div>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 52, fontWeight: 400,
            lineHeight: 1.12, color: "#2D2520", marginBottom: 20, letterSpacing: "-0.5px",
          }}>
            You know your industry.<br />Now post like it.
          </h1>
          <p style={{ fontSize: 16, color: "#8C7E72", lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}>
            Ella turns your expertise into LinkedIn posts that build credibility and attract the right opportunities. No ghostwriter. No templates. Just a smarter way to show the world how you think.
          </p>
          <div className="ella-hero-ctas" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button onClick={() => navigate("/signup")} style={{
              padding: "14px 28px", border: "none", borderRadius: 24,
              background: "#E8664A", color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 2px 12px rgba(232,102,74,0.25)",
            }}>Get Started Free</button>
            <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} style={{
              padding: "14px 28px", background: "transparent", border: "none", borderRadius: 24,
              color: "#8C7E72", fontSize: 15, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 3,
            }}>See how it works</button>
          </div>
          <p style={{ fontSize: 12, color: "#B5A698", marginTop: 16 }}>3 free posts per month. No credit card required.</p>
        </div>

        {/* Parrot illustration mosaic */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="ella-hero-illustration" style={{ position: "relative", width: 400, height: 400 }}>
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
            {/* Coral glow behind parrot */}
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              width: 280, height: 280, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(232,102,74,0.1) 0%, rgba(232,102,74,0) 70%)",
            }} />
            <div style={{
              position: "absolute", top: 30, right: 20, width: 80, height: 80,
              borderRadius: "50%", background: "rgba(232,102,74,0.1)",
            }} />
            <div style={{
              position: "absolute", bottom: 50, left: 15, width: 60, height: 60,
              borderRadius: "50%", background: "rgba(232,102,74,0.08)",
            }} />
            <img src="/ella-parrot.png" alt="Ella" style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 200, height: 200, objectFit: "contain",
              filter: "drop-shadow(0 8px 32px rgba(45,37,32,0.08))",
            }} />
          </div>
        </div>
      </div>

      {/* ─── Pain Points ─── */}
      <div className="ella-section" style={{ maxWidth: 1120, margin: "0 auto", padding: "60px 32px 80px" }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400,
          textAlign: "center", color: "#E8664A", marginBottom: 48,
        }}>Sound familiar?</h2>
        <div className="ella-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, maxWidth: 800, margin: "0 auto" }}>
          {PAIN_POINTS.map((p, i) => (
            <div key={i} style={{
              background: "#EFEBE5", borderRadius: 16, padding: "28px 24px",
              borderLeft: "3px solid #E8664A",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#E8664A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{p.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#2D2520", marginBottom: 8, lineHeight: 1.35 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "#8C7E72", lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── LinkedIn isn't optional ─── */}
      <div className="ella-section" style={{ background: "#EFEBE5", padding: "80px 32px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ width: 40, height: 3, background: "#E8664A", borderRadius: 2, margin: "0 auto 24px" }} />
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400,
            textAlign: "center", color: "#E8664A", marginBottom: 48,
          }}>LinkedIn isn't optional anymore</h2>
          <div className="ella-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {WHY_NOW.map((w, i) => (
              <div key={i} style={{
                background: "#F7F3EE", borderRadius: 16, padding: "28px 24px",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2D2520", marginBottom: 8, lineHeight: 1.35 }}>{w.title}</div>
                <div style={{ fontSize: 13, color: "#8C7E72", lineHeight: 1.6 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── How It Works ─── */}
      <div id="how" className="ella-section" style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "#E8664A", textTransform: "uppercase",
            letterSpacing: 2.5, textAlign: "center", marginBottom: 12,
          }}>How It Works</p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400,
            textAlign: "center", color: "#2D2520", marginBottom: 56,
          }}>From blank page to posted in minutes</h2>

          <div className="ella-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{
                background: "#EFEBE5", borderRadius: 16, padding: "28px 24px",
                position: "relative", borderTop: "3px solid #E8664A",
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

      {/* ─── Setup ─── */}
      <div className="ella-section" style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "#E8664A", textTransform: "uppercase",
            letterSpacing: 2.5, textAlign: "center", marginBottom: 12,
          }}>Get Started</p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400,
            textAlign: "center", color: "#2D2520", marginBottom: 56,
          }}>Set up in 2 minutes</h2>

          <div className="ella-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
            <div style={{
              background: "#EFEBE5", borderRadius: 16, padding: "28px 24px",
              borderTop: "3px solid #E8664A",
            }}>
              <div style={{
                fontSize: 17, fontWeight: 700, color: "#2D2520", marginBottom: 8,
              }}>Create your account</div>
              <div style={{
                fontSize: 13, color: "#8C7E72", lineHeight: 1.6,
              }}>Sign up with your email. No credit card, no commitments. You're 2 minutes from your first draft.</div>
            </div>
            <div style={{
              background: "#EFEBE5", borderRadius: 16, padding: "28px 24px",
              borderTop: "3px solid #E8664A",
            }}>
              <div style={{
                fontSize: 17, fontWeight: 700, color: "#2D2520", marginBottom: 8,
              }}>Tell Ella who you are</div>
              <div style={{
                fontSize: 13, color: "#8C7E72", lineHeight: 1.6,
              }}>Ella doesn't just ask what you do — she asks how you think. Your role, your industry, your LinkedIn background, and a few questions about your perspective. This is why your drafts sound like you, not like a chatbot.</div>
            </div>
            <div style={{
              background: "#EFEBE5", borderRadius: 16, padding: "28px 24px",
              borderTop: "3px solid #E8664A",
            }}>
              <div style={{
                fontSize: 17, fontWeight: 700, color: "#2D2520", marginBottom: 8,
              }}>Start creating</div>
              <div style={{
                fontSize: 13, color: "#8C7E72", lineHeight: 1.6,
              }}>Pick a trending topic or bring your own. Add one sentence of your take. Ella handles the research, the structure, and the voice. You handle the insight.</div>
            </div>
          </div>

          {/* Role callout */}
          <div style={{
            marginTop: 32, padding: "20px 28px", background: "rgba(232,102,74,0.04)",
            border: "1px solid rgba(232,102,74,0.12)", borderRadius: 12, textAlign: "center",
          }}>
            <div style={{ fontSize: 14, color: "#2D2520", lineHeight: 1.7, maxWidth: 600, margin: "0 auto" }}>
              Ella doesn't just know your industry. <strong style={{ color: "#E8664A" }}>She knows your role.</strong> A marketing director gets different topics than a procurement lead. Same industry, completely different posts.
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <div id="features" className="ella-section" style={{ background: "#EFEBE5", padding: "80px 32px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "#E8664A", textTransform: "uppercase",
            letterSpacing: 2.5, textAlign: "center", marginBottom: 12,
          }}>Features</p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400,
            textAlign: "center", color: "#2D2520", marginBottom: 56,
          }}>Everything you need to post with confidence</h2>

          <div className="ella-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: "#F7F3EE", borderRadius: 16, padding: "28px 24px",
                transition: "transform 0.15s ease",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  background: "rgba(232,102,74,0.06)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {featureIcons[f.icon]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2D2520", marginBottom: 6 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: "#8C7E72", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Pricing ─── */}
      <div id="pricing" className="ella-section" style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "#E8664A", textTransform: "uppercase",
            letterSpacing: 2.5, marginBottom: 12,
          }}>Pricing</p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400,
            color: "#2D2520", marginBottom: 16,
          }}>Start free. Post with confidence.</h2>
          <p style={{ fontSize: 15, color: "#8C7E72", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 40px" }}>
            Everything you need to create LinkedIn posts that sound like you and build your professional credibility.
          </p>

          <div className="ella-pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 640, margin: "0 auto" }}>
            {/* Free tier */}
            <div style={{
              background: "#EFEBE5", borderRadius: 16, padding: "32px 28px", textAlign: "left",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#8C7E72", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Free</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#2D2520", marginBottom: 20 }}>$0</div>
              {["Guided creation flow", "Real-time industry research", "Post scoring (unlimited)"].map((item, i) => (
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
              {["Everything in Free", "Unlimited post generation", "Chrome extension", "Pattern analysis", "Visual direction briefs", "Priority support"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: "#B5A698" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#E8664A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {item}
                </div>
              ))}
              <button onClick={() => navigate("/signup")} style={{
                width: "100%", padding: "12px", border: "none", borderRadius: 20,
                background: "#E8664A", color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", marginTop: 20,
              }}>Get Started Free</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Final CTA ─── */}
      <div className="ella-section" style={{ padding: "80px 32px", textAlign: "center" }}>
        <div className="ella-final-cta" style={{
          maxWidth: 640, margin: "0 auto", background: "#EFEBE5",
          borderRadius: 24, padding: "56px 40px",
        }}>
          <img src="/ella-parrot.png" alt="Ella" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 20 }} />
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 32, fontWeight: 400,
            color: "#2D2520", marginBottom: 12,
          }}>Your expertise is worth more than a silent profile</h2>
          <p style={{ fontSize: 15, color: "#8C7E72", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Ella helps you say it in a way that gets heard.
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
        <div style={{ fontSize: 12, color: "#B5A698", marginBottom: 10 }}>
          Ella doesn't replace your voice. She makes sure it gets heard.
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", fontSize: 11, color: "#B5A698" }}>
          <button onClick={() => navigate("/terms")} style={{ background: "none", border: "none", color: "#B5A698", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>Terms</button>
          <button onClick={() => navigate("/privacy")} style={{ background: "none", border: "none", color: "#B5A698", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>Privacy</button>
          <span>&copy; 2026 Ella</span>
        </div>
      </div>
    </div>
  );
}
