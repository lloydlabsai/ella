import { useState, useEffect } from "react";
import { callClaude } from "../lib/api";

export default function Settings({ profile, updateProfile }) {
  const [form, setForm] = useState({
    display_name: "", industry: "", brand_voice: "",
    product_name: "", product_description: "",
  });
  const [voiceProfile, setVoiceProfile] = useState({
    background: "", edge: "", communication_style: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || "",
        industry: profile.industry || "",
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
    }
  }, [profile]);

  const importLinkedInProfile = async () => {
    const url = linkedinUrl.trim();
    if (!url || !url.includes("linkedin.com/in/")) {
      setImportError("Please paste a valid LinkedIn profile URL (e.g. linkedin.com/in/yourname)");
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const raw = await callClaude(
        `You are a profile data extractor. The user will give you a LinkedIn profile URL. Use web search to find as much information as possible about this person's professional background.

SEARCH STRATEGY:
1. First search the exact LinkedIn URL
2. Then search for the person's name + company + LinkedIn to find cached profile data, bios, team pages, press mentions, podcast appearances, etc.
3. Search for their name + company on the company website (team/about pages often have full bios)
4. Try each search separately to maximize coverage

Extract EVERYTHING you can find across all sources. Return ONLY valid JSON, no markdown fences, no preamble.

{
  "name": "Full Name",
  "headline": "Their LinkedIn headline or professional tagline",
  "location": "City, State/Country or null",
  "about": "Their About/summary section or bio text. Combine sources if needed. This is the most valuable field — get as much as possible.",
  "current_role": "Current job title at Company or null",
  "industry": "Their industry (infer from headline/experience if not explicit)",
  "followers": "follower count as string or null",
  "connections": "connection count as string or null",
  "experience": [{"title": "Job Title", "company": "Company Name", "duration": "Date range or null", "description": "Role description or null"}],
  "education": [{"school": "School Name", "degree": "Degree or null"}],
  "skills": ["skill1", "skill2", "skill3"]
}

Include ALL experience entries you can find — not just the current role. For fields you can't find, use null or empty arrays.`,
        `Extract profile data from this LinkedIn profile: ${url}`,
        { useWebSearch: true }
      );
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse profile data");
      const profileData = JSON.parse(jsonMatch[0]);
      const linkedinContext = { ...profileData, captured_at: new Date().toISOString(), source: "url_import" };
      await updateProfile({ linkedin_context: linkedinContext });
      // Auto-fill display name and industry if empty
      const updates = {};
      if (!form.display_name && profileData.name) updates.display_name = profileData.name;
      if (!form.industry && profileData.industry) updates.industry = profileData.industry;
      if (Object.keys(updates).length > 0) {
        setForm(prev => ({ ...prev, ...updates }));
      }
      setLinkedinUrl("");
    } catch (err) {
      setImportError(err.message || "Failed to import profile");
    }
    setImporting(false);
  };

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
      const updates = { ...form, voice_profile: voiceProfile };

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
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Display Name</label>
          <input style={inputStyle} value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Your name" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Industry</label>
          <input style={inputStyle} value={form.industry}
            onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
            placeholder="e.g., SaaS, Healthcare, CPG Food & Bev, FinTech, Real Estate..." />
          <div style={{ fontSize: 11, color: "#B5A698", marginTop: 4 }}>
            This tells Ella's agents what industry to research and tailor posts for
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Brand Voice</label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.5 }}
            value={form.brand_voice}
            onChange={(e) => setForm((p) => ({ ...p, brand_voice: e.target.value }))}
            placeholder="Describe your writing style. e.g., 'Direct and conversational. I use short sentences. I challenge conventional wisdom but back it up with data. Occasional dry humor.'" />
          <div style={{ fontSize: 11, color: "#B5A698", marginTop: 4 }}>
            The draft writer will match this tone and style
          </div>
        </div>

        {/* LinkedIn Profile Context */}
        <div style={{
          background: "#fff", border: "1px solid #EDE8E1",
          borderRadius: 12, padding: "18px 20px", marginBottom: 24,
          boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2520", marginBottom: 4 }}>
            LinkedIn Profile
          </div>
          {profile?.linkedin_context?.name ? (
            <div>
              <div style={{ fontSize: 12, color: "#6B9E7D", marginBottom: 12, fontWeight: 600 }}>
                Ella writes drafts from your perspective using this profile.
              </div>
              <div style={{ background: "#F7F3EE", borderRadius: 8, padding: "14px 16px", marginBottom: 12 }}>
                {/* Name + headline + location */}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2520" }}>{profile.linkedin_context.name}</div>
                {profile.linkedin_context.headline && (
                  <div style={{ fontSize: 12, color: "#5C534A", marginTop: 2 }}>{profile.linkedin_context.headline}</div>
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "#B5A698" }}>
                  {profile.linkedin_context.location && <span>{profile.linkedin_context.location}</span>}
                  {profile.linkedin_context.followers && <span>{profile.linkedin_context.followers} followers</span>}
                  {profile.linkedin_context.connections && <span>{profile.linkedin_context.connections} connections</span>}
                </div>

                {/* About — full text */}
                {profile.linkedin_context.about && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8E2DA" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 4 }}>About</div>
                    <div style={{ fontSize: 12, color: "#5C534A", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {profile.linkedin_context.about}
                    </div>
                  </div>
                )}

                {/* Current role */}
                {profile.linkedin_context.current_role && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "#2D2520", fontWeight: 600 }}>
                    Current: {profile.linkedin_context.current_role}
                  </div>
                )}

                {/* Experience — all entries */}
                {profile.linkedin_context.experience?.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8E2DA" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 6 }}>Experience</div>
                    {profile.linkedin_context.experience.map((e, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#2D2520" }}>{e.title}</div>
                        {e.company && <div style={{ fontSize: 11, color: "#5C534A" }}>{e.company}</div>}
                        {e.duration && <div style={{ fontSize: 10, color: "#B5A698" }}>{e.duration}</div>}
                        {e.description && <div style={{ fontSize: 10, color: "#8B7E74", marginTop: 2 }}>{e.description}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {profile.linkedin_context.education?.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8E2DA" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 6 }}>Education</div>
                    {profile.linkedin_context.education.map((e, i) => (
                      <div key={i} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#2D2520" }}>{e.school}</div>
                        {e.degree && <div style={{ fontSize: 11, color: "#5C534A" }}>{e.degree}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {profile.linkedin_context.skills?.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8E2DA" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 6 }}>Skills</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {profile.linkedin_context.skills.map((s, i) => (
                        <span key={i} style={{ fontSize: 10, color: "#5C534A", background: "#fff", border: "1px solid #E8E2DA", padding: "2px 8px", borderRadius: 10 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#B5A698" }}>
                Paste your URL again to refresh.
                {profile.linkedin_context.captured_at && <span> · Last imported: {new Date(profile.linkedin_context.captured_at).toLocaleDateString()}</span>}
                {profile.linkedin_context.source === "url_import" && <span> · via URL</span>}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#8B7E74", lineHeight: 1.5, marginBottom: 12 }}>
              Paste your LinkedIn profile URL so Ella can write posts from your perspective.
            </div>
          )}

          {/* URL import input */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={linkedinUrl}
                onChange={(e) => { setLinkedinUrl(e.target.value); setImportError(null); }}
                placeholder="https://linkedin.com/in/yourname"
                disabled={importing}
                onKeyDown={(e) => { if (e.key === "Enter") importLinkedInProfile(); }}
              />
              <button
                onClick={importLinkedInProfile}
                disabled={importing || !linkedinUrl.trim()}
                style={{
                  padding: "10px 18px", border: "none", borderRadius: 10,
                  background: importing ? "#E8E2DA" : "#E8664A",
                  color: importing ? "#B5A698" : "#fff",
                  fontSize: 12, fontWeight: 700, cursor: importing ? "wait" : "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >
                {importing ? "Importing..." : profile?.linkedin_context?.name ? "Refresh" : "Import"}
              </button>
            </div>
            {importError && (
              <div style={{ fontSize: 11, color: "#D4695A", marginTop: 6 }}>{importError}</div>
            )}
            {importing && (
              <div style={{ fontSize: 11, color: "#B5A698", marginTop: 6 }}>
                Searching LinkedIn and extracting your profile data...
              </div>
            )}
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
                ? "Real-time fact validation with Tavily & Perplexity enabled"
                : "Upgrade to Pro for real-time fact validation and enrichment"}
            </div>
          </div>
          {profile?.tier !== "paid" && (
            <button style={{
              padding: "8px 18px", border: "none", borderRadius: 20,
              background: "#E8664A", color: "#fff",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>Upgrade</button>
          )}
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          padding: "14px 32px", border: "none", borderRadius: 24,
          background: saved ? "#6B9E7D" : saving ? "#E8E2DA" : "#E8664A",
          color: saved ? "#fff" : saving ? "#B5A698" : "#fff",
          fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer",
          transition: "all 0.2s",
        }}>
          {saved ? "Saved" : researching ? "Ella is learning about you..." : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
