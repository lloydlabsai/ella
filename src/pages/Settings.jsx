import { useState, useEffect } from "react";
import { callClaude } from "../lib/api";

export default function Settings({ profile, updateProfile }) {
  const [form, setForm] = useState({
    display_name: "", industry: "", occupation: "", brand_voice: "",
    product_name: "", product_description: "",
  });
  const [voiceProfile, setVoiceProfile] = useState({
    background: "", edge: "", communication_style: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [linkedinFields, setLinkedinFields] = useState({
    headline: "", about: "", experience: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || "",
        industry: profile.industry || "",
        occupation: profile.occupation || "",
        brand_voice: profile.brand_voice || "",
        product_name: profile.product_name || "",
        product_description: profile.product_description || "",
      });
      if (profile.voice_profile) {
        setVoiceProfile({
          background: profile.voice_profile.background || "",
          edge: profile.voice_profile.edge || "",
          communication_style: profile.voice_profile.communication_style || "",
        });
      }
      if (profile.linkedin_context) {
        setLinkedinFields({
          headline: profile.linkedin_context.headline || "",
          about: profile.linkedin_context.about || "",
          experience: profile.linkedin_context.experience_raw || profile.linkedin_context.experience || "",
        });
      }
    }
  }, [profile]);

  const [researching, setResearching] = useState(false);

  const runPersonaResearch = async (profileData) => {
    // Build context from everything we know
    const parts = [];
    if (profileData.display_name) parts.push(`Name: ${profileData.display_name}`);
    if (profileData.industry) parts.push(`Industry: ${profileData.industry}`);
    const lc = profile?.linkedin_context;
    if (lc?.headline) parts.push(`Headline: ${lc.headline}`);
    if (lc?.current_role) parts.push(`Current role: ${lc.current_role}`);
    if (lc?.about) parts.push(`About: ${lc.about.slice(0, 500)}`);
    if (lc?.experience?.length > 0) {
      parts.push(`Experience: ${lc.experience.slice(0, 5).map(e => `${e.title} at ${e.company || '?'}`).join(', ')}`);
    }
    const vp = voiceProfile;
    if (vp.background) parts.push(`Their own words about their background: ${vp.background.slice(0, 400)}`);
    if (vp.edge) parts.push(`What they know that others don't: ${vp.edge.slice(0, 300)}`);
    if (vp.communication_style) parts.push(`Communication style: ${vp.communication_style.slice(0, 200)}`);

    if (parts.length < 3) return null; // Not enough info to research

    const personaContext = parts.join('\n');

    try {
      setResearching(true);

      // ── Call 1: Core persona research + discovery + anti-topics ──
      const fullPrompt = `Research this person and their professional world:\n\n${personaContext}\n\nSearch for their company, their market, their competitors, and the specific dynamics of their corner of the industry. Then return a JSON object with these fields:\n\n{
  "niche": "Their specific niche within their broader industry (be precise, e.g. 'emerging CPG brand go-to-market strategy' not just 'CPG')",
  "company_context": "What their company does, market position, size, recent news",
  "competitive_landscape": "Key competitors and market dynamics they think about daily",
  "audience": "Who follows them / who they're trying to reach on LinkedIn (job titles, seniority, what those people care about)",
  "pain_points": "Top 3-5 professional challenges someone in this exact role faces right now",
  "topics_they_own": "3-5 specific topic areas where this person has credibility and authority to speak",
  "discovery_topics": "3-4 ADJACENT topic areas outside their obvious lane where their expertise gives them a unique angle others don't have. These are crossover opportunities — topics from neighboring industries, upstream/downstream in their value chain, or emerging intersections where their background is unexpectedly relevant. E.g. a CPG GTM strategist could credibly write about retail media economics, founder-led sales, or DTC fulfillment cost structures.",
  "anti_topics": "3-5 topic areas this person should AVOID writing about because they lack credibility, direct experience, or data. Be specific about WHY each topic is outside their zone. E.g. 'Foodservice distribution — no supply chain ops experience, would sound like an outsider' or 'Clinical nutrition — no regulatory or R&D background'.",
  "content_archetype": "Classify their natural content style based on their background. One primary, one secondary from: PRACTITIONER (shares war stories, operational specifics, 'I watched this play out'), ANALYST (leads with data, frameworks, metrics), COMMENTATOR (reacts to news with strong contrarian takes), EDUCATOR (breaks down complex topics for a broader audience), CONNECTOR (synthesizes across disciplines, finds patterns others miss). Format: 'Primary: X, Secondary: Y'",
  "publications_they_read": "Trade publications, newsletters, podcasts, data sources relevant to their specific niche (be specific — not 'industry publications' but 'Grocery Dive, PLMA newsletters, NIQ/IRI reports')",
  "hot_buttons": "Industry debates or tensions where this person would have a strong opinion based on their actual experience",
  "language_cues": "Industry jargon, metrics, and terminology this person would naturally use (e.g. 'velocity per TDP', 'slotting fees', 'buy rate', 'trade spend')"
}`;

      let raw;
      try {
        raw = await callClaude(
          `You are building a deep professional profile to understand how someone thinks, what they care about, and what their world looks like day-to-day. Search the web to understand their company, market position, competitors, and industry dynamics. Return ONLY valid JSON, no markdown fences.`,
          fullPrompt,
          { useWebSearch: true }
        );
      } catch (err) {
        // Retry with compressed prompt if first call fails/times out
        console.warn("Persona research call 1 failed, retrying with compressed prompt:", err.message);
        raw = await callClaude(
          `Build a professional profile. Search the web. Return ONLY valid JSON.`,
          `Person: ${profileData.display_name || ''}, ${lc?.headline || ''}, ${profileData.industry || ''}${lc?.about ? '. About: ' + lc.about.slice(0, 200) : ''}\n\nReturn JSON: {"niche":"specific niche","company_context":"company info","competitive_landscape":"competitors","audience":"who they reach","pain_points":"challenges","topics_they_own":"credible topics","discovery_topics":"adjacent crossover topics","anti_topics":"topics to avoid and why","content_archetype":"Primary: X, Secondary: Y","publications_they_read":"specific sources","hot_buttons":"debates","language_cues":"jargon"}`,
          { useWebSearch: true }
        );
      }

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.warn("Persona research failed:", err.message);
      return null;
    } finally {
      setResearching(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const linkedinContext = {
        headline: linkedinFields.headline,
        about: linkedinFields.about,
        experience_raw: typeof linkedinFields.experience === 'string' ? linkedinFields.experience : '',
        name: form.display_name,
      };
      const updates = { ...form, voice_profile: voiceProfile, linkedin_context: linkedinContext };

      // Run persona research if we have enough profile data and haven't done it yet,
      // or if key fields changed
      const hasEnoughData = (form.industry && (form.display_name || profile?.linkedin_context?.name));
      const existingResearch = profile?.persona_research;
      const industryChanged = form.industry !== profile?.industry;
      const voiceChanged = JSON.stringify(voiceProfile) !== JSON.stringify(profile?.voice_profile || {});

      if (hasEnoughData && (!existingResearch || industryChanged || voiceChanged)) {
        const research = await runPersonaResearch(form);
        if (research) {
          updates.persona_research = research;
        }
      }

      await updateProfile(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert("Save failed: " + err.message);
    }
    setSaving(false);
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", fontSize: 13, color: "#2D2520",
    background: "#fff", border: "1px solid #E8E2DA",
    borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#8B7E74", display: "block", marginBottom: 6,
    textTransform: "uppercase", letterSpacing: 0.5,
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 4, fontFamily: "'DM Serif Display', serif", color: "#2D2520" }}>Settings</h2>
      <p style={{ color: "#8B7E74", fontSize: 14, marginBottom: 28 }}>
        Configure your profile so Ella generates posts in your voice and for your industry.
      </p>

      <div style={{ maxWidth: 520 }}>
        {/* 1. Industry */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Industry</label>
          <input style={inputStyle} value={form.industry}
            onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
            placeholder="e.g., SaaS, Healthcare, CPG Food & Bev, FinTech, Real Estate..." />
          <div style={{ fontSize: 11, color: "#B5A698", marginTop: 4 }}>
            Ella researches and writes for your specific corner of this industry
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Occupation</label>
          <input style={inputStyle} value={form.occupation}
            onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
            placeholder="e.g., VP of Marketing, Founder, Category Manager, Sales Director..." />
          <div style={{ fontSize: 11, color: "#B5A698", marginTop: 4 }}>
            Your role shapes what topics Ella surfaces — a CMO sees different news than a supply chain director
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Display Name</label>
          <input style={inputStyle} value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Your name" />
        </div>

        {/* 2. Your LinkedIn profile */}
        <div style={{
          background: "#fff", border: "1px solid #EDE8E1",
          borderRadius: 12, padding: "18px 20px", marginBottom: 24,
          boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2520", marginBottom: 4 }}>
            Your LinkedIn Profile
          </div>
          <div style={{ fontSize: 11, color: "#8B7E74", marginBottom: 16, lineHeight: 1.5 }}>
            Paste these from your LinkedIn profile. Ella uses your own words to write in your voice.
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ ...labelStyle, fontSize: 11 }}>Your headline</label>
            <input style={inputStyle}
              value={linkedinFields.headline}
              onChange={(e) => setLinkedinFields(prev => ({ ...prev, headline: e.target.value }))}
              placeholder="e.g., Founder, CPG Canary | 16 Yrs CPG Manufacturing" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ ...labelStyle, fontSize: 11 }}>Your About section</label>
            <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.5 }}
              value={linkedinFields.about}
              onChange={(e) => setLinkedinFields(prev => ({ ...prev, about: e.target.value }))}
              placeholder="Paste your LinkedIn About section here" />
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: 11 }}>Your Experience</label>
            <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.5 }}
              value={typeof linkedinFields.experience === 'string' ? linkedinFields.experience : ''}
              onChange={(e) => setLinkedinFields(prev => ({ ...prev, experience: e.target.value }))}
              placeholder="Paste your LinkedIn Experience section here — include job titles, companies, and descriptions" />
          </div>
        </div>

        {/* Tell Ella More — voice profile */}
        <div style={{
          background: "#fff", border: "1px solid #EDE8E1",
          borderRadius: 12, padding: "18px 20px", marginBottom: 24,
          boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2520", marginBottom: 4 }}>
            Tell Ella More
          </div>
          <div style={{ fontSize: 11, color: "#8B7E74", marginBottom: 16, lineHeight: 1.5 }}>
            The more Ella knows about how you think and communicate, the better your drafts sound.
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ ...labelStyle, fontSize: 11 }}>Your background in your own words</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5 }}
              value={voiceProfile.background}
              onChange={(e) => setVoiceProfile(prev => ({ ...prev, background: e.target.value }))}
              placeholder="What's your professional story? Not the resume version — the real one." />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ ...labelStyle, fontSize: 11 }}>What do you know that most people in your industry don't?</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5 }}
              value={voiceProfile.edge}
              onChange={(e) => setVoiceProfile(prev => ({ ...prev, edge: e.target.value }))}
              placeholder="What's your edge? What perspective do you bring that others can't?" />
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: 11 }}>How do you communicate?</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5 }}
              value={voiceProfile.communication_style}
              onChange={(e) => setVoiceProfile(prev => ({ ...prev, communication_style: e.target.value }))}
              placeholder="How would a friend describe your style? Direct? Analytical? Casual? Data-heavy?" />
          </div>
        </div>

        <div style={{
          background: "#fff", border: "1px solid #EDE8E1",
          borderRadius: 12, padding: "18px 20px", marginBottom: 24,
          boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2520", marginBottom: 4 }}>
            Product Mention <span style={{ color: "#B5A698", fontWeight: 400 }}>(optional)</span>
          </div>
          <div style={{ fontSize: 11, color: "#8B7E74", marginBottom: 14, lineHeight: 1.5 }}>
            If set, Ella will subtly weave your product into generated posts where natural.
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...labelStyle, fontSize: 11 }}>Product Name</label>
            <input style={inputStyle} value={form.product_name}
              onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))}
              placeholder="e.g., Acme Analytics" />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: 11 }}>Description</label>
            <input style={inputStyle} value={form.product_description}
              onChange={(e) => setForm((p) => ({ ...p, product_description: e.target.value }))}
              placeholder="e.g., Real-time market intelligence platform for SaaS leaders" />
          </div>
        </div>

        <div style={{
          background: "#fff", border: "1px solid #EDE8E1",
          borderRadius: 12, padding: "18px 20px", marginBottom: 28,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2520" }}>
              Plan: {profile?.tier === "paid" ? "Pro" : "Free"}
            </div>
            <div style={{ fontSize: 11, color: "#8B7E74", marginTop: 2 }}>
              {profile?.tier === "paid"
                ? "Unlimited post generation and pattern analysis"
                : "3 posts per month. Pro with unlimited posts coming soon."}
            </div>
          </div>
          {profile?.tier !== "paid" && (
            <button onClick={() => window.open("https://getella.io/#pricing", "_blank")} style={{
              padding: "8px 18px", border: "none", borderRadius: 20,
              background: "#2D2520", color: "#fff",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>Join Waitlist</button>
          )}
        </div>

        <button onClick={handleSave} disabled={saving || researching} style={{
          padding: "14px 32px", border: "none", borderRadius: 24,
          background: saved ? "#6B9E7D" : (saving || researching) ? "#E8E2DA" : "#E8664A",
          color: saved ? "#fff" : (saving || researching) ? "#B5A698" : "#fff",
          fontSize: 14, fontWeight: 700, cursor: (saving || researching) ? "wait" : "pointer",
          transition: "all 0.2s",
        }}>
          {saved ? "Saved" : saving ? "Saving..." : "Save Settings"}
        </button>
        {researching && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <div style={{
              width: 24, height: 24, border: "3px solid #EDE8E1", borderTopColor: "#E8664A",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
              margin: "0 auto 8px",
            }} />
            <div style={{ fontSize: 13, color: "#E8664A", fontWeight: 600 }}>Ella is learning about you...</div>
            <div style={{ fontSize: 11, color: "#B5A698", marginTop: 4 }}>Researching your industry, competitors, and niche. This takes 15-30 seconds.</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
