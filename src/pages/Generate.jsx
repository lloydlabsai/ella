import { useState, useRef, useEffect, useCallback } from "react";
import { callClaude, getGenerationCount } from "../lib/api";
import { extractFeatures } from "../utils/features";
import { formatInsightsForPrompt } from "../utils/pipeline";
import { getSeedPatterns } from "../utils/seed-patterns";
import { getDrafterPrompt } from "../utils/prompts";

// ─── Collapsible Section ──────────────────────────────────

function Section({ id, title, subtitle, expanded, onToggle, badge, children }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #EDE8E1", borderRadius: 14,
      marginBottom: 12, boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
      overflow: "hidden", transition: "box-shadow 0.2s",
      ...(expanded ? { boxShadow: "0 2px 10px rgba(45,37,32,0.07)" } : {}),
    }}>
      <div onClick={onToggle} style={{
        padding: "16px 20px", cursor: "pointer", display: "flex",
        justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2D2520", margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 11, color: "#B5A698", margin: "2px 0 0" }}>{subtitle}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {badge}
          <span style={{ fontSize: 14, color: "#B5A698", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>&#9662;</span>
        </div>
      </div>
      {expanded && <div style={{ padding: "0 20px 20px", borderTop: "1px solid #F0EBE4" }}>{children}</div>}
    </div>
  );
}

// ─── Small reusable components ────────────────────────────

function Pill({ active, onClick, children }) {
  return (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onClick) onClick(); }} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "6px 12px", borderRadius: 16, border: `1.5px solid ${active ? "#E8664A" : "#D4CFC7"}`,
      background: active ? "rgba(232,102,74,0.08)" : "#F0EBE4", color: active ? "#E8664A" : "#B5A698",
      fontSize: 12, fontWeight: 600, cursor: "pointer", margin: "3px",
      textDecoration: active ? "none" : "line-through",
      opacity: active ? 1 : 0.6,
      transition: "all 0.15s",
      textAlign: "left",
    }}>{children}</button>
  );
}

function AngleCard({ text, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      textAlign: "left", padding: "12px 14px", borderRadius: 10,
      border: `1.5px solid ${selected ? "#E8664A" : "#EDE8E1"}`,
      background: selected ? "rgba(232,102,74,0.04)" : "#fff",
      cursor: "pointer", fontSize: 12, color: "#2D2520", lineHeight: 1.5, width: "100%",
    }}>{text}</button>
  );
}

// ─── Score helper ─────────────────────────────────────────

function quickScore(text) {
  if (!text || text.length < 50) return null;
  const f = extractFeatures(text);
  let score = 50;
  if (f.hook_char_count <= 210 && f.hook_char_count >= 40) score += 10;
  if (f.hook_is_bold_claim || f.hook_is_question || f.hook_is_story || f.hook_is_number) score += 5;
  if (text.length >= 1200 && text.length <= 1900) score += 10;
  if (f.cta_is_open_ended) score += 10;
  else if (f.cta_is_question) score += 5;
  else score -= 10;
  if (f.hashtags >= 3 && f.hashtags <= 5) score += 5;
  if (f.has_external_link) score -= 10;
  if (/like if you agree|comment yes/i.test(text)) score -= 15;
  if (f.cta_invites_disagreement) score += 5;
  if (f.reading_time_seconds >= 30 && f.reading_time_seconds <= 90) score += 5;
  return { score: Math.max(0, Math.min(100, score)), features: f };
}

// ─── Strip meta-commentary ───────────────────────────────

function cleanDraft(text) {
  return text
    .replace(/\n\s*(?:\*\*)?(?:Applied|Patterns|ML |Note(?:s)? on|Algorithm)[\s\S]*$/i, "")
    .replace(/\n\s*(?:I applied|This draft |This post )[\s\S]*$/i, "")
    .replace(/\n\s*---+\s*\n\s*(?:Notes|Patterns)[\s\S]*$/i, "")
    .trim();
}

// ─── Visual Direction Analysis ────────────────────────────

const VISUAL_DIRECTIONS = {
  data: { id: "data", icon: "📊", label: "Data Visualization", desc: "Your post has specific metrics. A simple chart or bold stat graphic would stop scrollers." },
  stat: { id: "stat", icon: "📱", label: "Bold Stat Graphic", desc: "Pull out your strongest number as large text on a dark background. Readable as a thumbnail." },
  carousel: { id: "carousel", icon: "📑", label: "Carousel", desc: "Break your key points into individual slides. Carousels get 2.3x more saves on LinkedIn." },
  hottake: { id: "hottake", icon: "🔥", label: "Bold Text on Color", desc: "Let the words do the work. Strong opinion text on a solid color background. Minimal design." },
  photo: { id: "photo", icon: "📷", label: "Authentic Photo", desc: "A real photo — behind-the-scenes, in the field. Authenticity > polish on LinkedIn." },
  textonly: { id: "textonly", icon: "📝", label: "Text Only", desc: "Sometimes the words are enough. Text-only performs well when the hook is strong." },
};

function analyzeVisualDirection(text) {
  if (!text || text.length < 100) return [];
  const results = [];
  const numberCount = (text.match(/\d+[\d,.]*%?/g) || []).length;
  const hasComparison = /vs\.?|→|from\s+\$?\d|to\s+\$?\d|increased|decreased|grew|dropped|jumped/i.test(text);
  const hasFramework = /step\s*\d|first.*second.*third|phase\s*\d|framework|process|playbook|checklist/i.test(text);
  const hasStrongOpinion = /wrong|mistake|myth|stop\s|unpopular|hot take|controversial|disagree/i.test(text);
  const hasStory = /last\s+(year|month|week)|i\s+remember|when\s+i\s+(was|worked)|true\s+story|happened\s+to/i.test(text);
  const listItems = (text.match(/^[\s]*[-•*\d]+[.)]\s/gm) || []).length;
  const hasNews = /announced|launched|acquired|raised|reported|according to|breaking/i.test(text);

  if (numberCount >= 3 && hasComparison) results.push("data");
  if (numberCount >= 1) results.push("stat");
  if (hasFramework || listItems >= 3) results.push("carousel");
  if (hasStrongOpinion) results.push("hottake");
  if (hasStory) results.push("photo");
  if (hasNews && numberCount < 3) results.push("hottake");
  results.push("textonly");

  // Deduplicate and limit to 4
  return [...new Set(results)].slice(0, 4);
}

function generateVisualBrief(directionId, text) {
  const numbers = text.match(/\$?[\d,.]+[%KMBkmb]?(?:\s*(?:→|to|vs)\s*\$?[\d,.]+[%KMBkmb]?)?/g) || [];
  const strongestNumber = numbers.sort((a, b) => b.length - a.length)[0] || "";
  const firstLine = text.split("\n")[0] || "";
  const lines = text.split("\n").filter((l) => l.trim());
  const keyPoints = lines.filter((l) => /^[-•*\d]|^\d+[.)]/.test(l.trim())).slice(0, 5);
  if (keyPoints.length === 0) {
    // Fall back to paragraphs as key points
    text.split("\n\n").filter((p) => p.trim()).slice(1, 5).forEach((p) => keyPoints.push(p.split(".")[0]));
  }

  switch (directionId) {
    case "data": return `DATA VISUALIZATION BRIEF:\n• Create a simple bar chart or arrow graphic showing: ${numbers.slice(0, 3).join(", ")}\n• Headline: "${firstLine.slice(0, 60)}"\n• Single accent color against dark/neutral background\n• Keep to ONE data point per graphic — don't cram\n• Dimensions: 1200×627px (single image)`;
    case "stat": return `BOLD STAT GRAPHIC BRIEF:\n• Feature text: "${strongestNumber || numbers[0] || "[your strongest number]"}"\n• Subline: "${firstLine.slice(0, 50)}"\n• Dark background, large sans-serif font, minimal design\n• Must be readable as a thumbnail on mobile\n• Dimensions: 1200×627px`;
    case "carousel": return `CAROUSEL BRIEF (${Math.min(keyPoints.length + 2, 6)} slides):\n• Slide 1 (cover): "${firstLine.slice(0, 50)}"\n${keyPoints.slice(0, 4).map((p, i) => `• Slide ${i + 2}: "${p.trim().slice(0, 60)}"`).join("\n")}\n• Final slide: CTA — "What's your take?" or "Follow for more"\n• Each slide: ONE idea, readable in 3 seconds\n• Consistent branding across slides\n• Dimensions: 1080×1080px per slide`;
    case "hottake": return `BOLD TEXT GRAPHIC BRIEF:\n• Text: "${firstLine.slice(0, 80)}"\n• Solid color background (dark navy, deep red, or black)\n• Large, bold sans-serif font\n• No images, no icons — let the words hit\n• Max 7 words on the graphic\n• Dimensions: 1200×627px`;
    case "photo": return `AUTHENTIC PHOTO BRIEF:\n• Use a real photo — behind-the-scenes, at an event, at your desk\n• Phone photo often outperforms designed graphics on LinkedIn\n• Authenticity > polish\n• Faces increase stop rate — include yourself if appropriate\n• Dimensions: 1200×627px minimum`;
    case "textonly": return `TEXT ONLY — no graphic needed.\n• Your hook is strong enough to stop the scroll on its own\n• Use line breaks and whitespace generously\n• The post text IS the visual`;
    default: return "";
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function Generate({ profile, mlResults, postCount = 0, recentPosts = [], refreshProfile }) {
  useEffect(() => { if (refreshProfile) refreshProfile(); }, [refreshProfile]);

  const industry = profile?.industry || "";
  const tier = profile?.tier || "free";
  // Generation caps. Self-hosted installs use their own Anthropic key, so both
  // default to unlimited; set VITE_FREE_GENERATION_LIMIT / VITE_PAID_GENERATION_LIMIT
  // (0 or unset = unlimited) to meter a hosted deployment.
  const freeLimit = Number(import.meta.env.VITE_FREE_GENERATION_LIMIT) || 0;
  const paidLimit = Number(import.meta.env.VITE_PAID_GENERATION_LIMIT) || 0;
  const monthlyLimit = tier === "paid" ? paidLimit : freeLimit;
  const unlimited = monthlyLimit <= 0;
  const [genCount, setGenCount] = useState(0);
  const remaining = unlimited ? Infinity : Math.max(0, monthlyLimit - genCount);

  // Fetch server-side generation count on mount
  useEffect(() => {
    getGenerationCount().then(setGenCount).catch(() => {});
  }, []);

  // ─── State — persisted to sessionStorage ───────────────
  // Loads saved state so navigation between pages doesn't lose work
  const loadSaved = (key, fallback) => {
    try {
      const raw = sessionStorage.getItem(`ella_${key}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return fallback;
  };

  const [expanded, setExpanded] = useState(() => loadSaved("expanded", { spark: true, landscape: false, take: false, draft: false, visual: false, check: false }));
  const toggle = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));
  const open = (key) => setExpanded((e) => ({ ...e, [key]: true }));

  // Spark
  const [sparkTab, setSparkTab] = useState(() => loadSaved("sparkTab", "ideas"));
  const [topic, setTopic] = useState(() => loadSaved("topic", ""));
  const [ideas, setIdeas] = useState(() => loadSaved("ideas", []));
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [customSpark, setCustomSpark] = useState("");

  // Landscape
  const [facts, setFacts] = useState(() => loadSaved("facts", [])); // { text, enabled }
  const [angles, setAngles] = useState(() => loadSaved("angles", [])); // { text, selected }
  const [stakeholders, setStakeholders] = useState(() => loadSaved("stakeholders", [])); // { name, selected }
  const [loadingLandscape, setLoadingLandscape] = useState(false);
  const [whatAbout, setWhatAbout] = useState("");
  const [customAngle, setCustomAngle] = useState("");

  // Take
  const [take, setTake] = useState(() => loadSaved("take", ""));

  // Draft
  const [blocks, setBlocks] = useState(() => loadSaved("blocks", [])); // { id, text }
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editText, setEditText] = useState("");
  const [sharpeningBlock, setSharpeningBlock] = useState(null);
  const [whatMissing, setWhatMissing] = useState("");

  // Conversational refinement
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineHistory, setRefineHistory] = useState([]); // { role, text }

  // Auto-validation
  const [validation, setValidation] = useState(null); // { claims: [...], enrichments: [...] }
  const [validating, setValidating] = useState(false);

  // Second perspective
  const [gems, setGems] = useState([]); // { text, used }
  const [loadingGems, setLoadingGems] = useState(false);

  // Visual
  const [visualDirection, setVisualDirection] = useState(null); // selected direction id
  const [visualBriefCopied, setVisualBriefCopied] = useState(false);

  // Check
  const [scoreResult, setScoreResult] = useState(null);
  const [hashtags, setHashtags] = useState([]);
  const [copied, setCopied] = useState(false);

  const draftRef = useRef();

  // ─── Persist to sessionStorage ──────────────────────────
  useEffect(() => { sessionStorage.setItem("ella_expanded", JSON.stringify(expanded)); }, [expanded]);
  useEffect(() => { sessionStorage.setItem("ella_sparkTab", JSON.stringify(sparkTab)); }, [sparkTab]);
  useEffect(() => { sessionStorage.setItem("ella_topic", JSON.stringify(topic)); }, [topic]);
  useEffect(() => { sessionStorage.setItem("ella_ideas", JSON.stringify(ideas)); }, [ideas]);
  useEffect(() => { sessionStorage.setItem("ella_facts", JSON.stringify(facts)); }, [facts]);
  useEffect(() => { sessionStorage.setItem("ella_angles", JSON.stringify(angles)); }, [angles]);
  useEffect(() => { sessionStorage.setItem("ella_stakeholders", JSON.stringify(stakeholders)); }, [stakeholders]);
  useEffect(() => { sessionStorage.setItem("ella_take", JSON.stringify(take)); }, [take]);
  useEffect(() => { sessionStorage.setItem("ella_blocks", JSON.stringify(blocks)); }, [blocks]);

  // ─── Derived ────────────────────────────────────────────
  const fullDraftText = blocks.map((b) => b.text).join("\n\n");
  const hasContent = topic && (facts.some((f) => f.enabled) || angles.some((a) => a.selected) || take.trim());
  const canGenerate = topic && remaining > 0;

  // ─── Spark: Fetch ideas ─────────────────────────────────
  const fetchIdeas = async () => {
    setLoadingIdeas(true);
    try {
      // Build deep persona context from all available data
      const pr = profile?.persona_research;
      const lc = profile?.linkedin_context;
      const vp = profile?.voice_profile;
      const occupation = profile?.occupation || '';
      const personaParts = [];
      if (lc?.name) personaParts.push(`Name: ${lc.name}`);
      if (occupation) personaParts.push(`Occupation: ${occupation}`);
      if (lc?.headline) personaParts.push(`LinkedIn headline: ${lc.headline}`);
      if (pr?.niche) personaParts.push(`Niche: ${pr.niche}`);
      if (pr?.company_context) personaParts.push(`Company: ${pr.company_context}`);
      if (pr?.competitive_landscape) personaParts.push(`Competitive landscape: ${pr.competitive_landscape}`);
      if (pr?.topics_they_own) personaParts.push(`Topics they own: ${pr.topics_they_own}`);
      if (pr?.pain_points) personaParts.push(`Pain points: ${pr.pain_points}`);
      if (pr?.hot_buttons) personaParts.push(`Hot buttons: ${pr.hot_buttons}`);
      if (vp?.edge) personaParts.push(`Unique angle: ${vp.edge.slice(0, 200)}`);
      if (pr?.discovery_topics) personaParts.push(`Discovery topics (adjacent areas where they have a unique angle): ${pr.discovery_topics}`);
      if (pr?.anti_topics) personaParts.push(`AVOID these topics (outside their credibility): ${pr.anti_topics}`);
      if (pr?.content_archetype) personaParts.push(`Content style: ${pr.content_archetype}`);
      if (pr?.publications_they_read) personaParts.push(`Sources they read: ${pr.publications_they_read}`);
      if (pr?.language_cues) personaParts.push(`Language/jargon: ${pr.language_cues}`);
      const captureTopics = recentPosts?.length > 0 ? recentPosts.slice(0, 4).map(p => p.post_text?.slice(0, 80)).filter(Boolean).join(' | ') : '';
      const personaBlock = personaParts.length > 0 ? `THIS PERSON'S WORLD:\n${personaParts.join('\n')}\n\n` : '';

      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const cutoff = new Date(Date.now() - 60*24*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const resp = await callClaude(
        `Today is ${today}. You find specific, surprising things that happened in the LAST 60 DAYS. ONLY return news from ${cutoff} or later. Nothing older. Search for the very latest news. Return ONLY valid JSON, no markdown fences.`,
        `${personaBlock}${captureTopics ? `TOPICS THEY ENGAGE WITH: ${captureTopics}\n\n` : ''}TODAY'S DATE: ${today}
CUTOFF: Nothing older than ${cutoff}. If you can't find enough items from the last 60 days, return fewer — never pad with old news.

This person is ${occupation ? `a ${occupation}` : 'a professional'} in ${industry}. Find 6 topics specifically relevant to someone in THIS role.${occupation ? ` What would a ${occupation} specifically care about? Think about their day-to-day challenges, the decisions they make, the metrics they track, the tools they use, and the conversations they have with peers. NOT generic industry headlines — topics this specific person could write about with authority because they live it.` : ''}

Rules:
- EVERY item must be from the last 60 days. Include the approximate date.
- Each headline must be a SPECIFIC EVENT or DATA POINT with real companies, people, numbers, dates.
- Find the TENSION — where should smart people in this role disagree?
- No evergreen advice. No "trends to watch." Only things that actually happened.
- Use sources most people haven't seen: ${pr?.publications_they_read || 'trade publications, earnings calls, SEC filings, industry data releases'}.
- Every topic should pass this test: "Would a ${occupation || 'practitioner'} in ${industry} read this and immediately have a strong opinion based on their direct experience?"
${pr?.anti_topics ? '- NEVER suggest topics in these areas: ' + pr.anti_topics : ''}

Return a JSON array. Each item: {"headline":"the specific thing that happened","context":"2-3 sentences with numbers and why it matters","why":"the debate angle that would spark real comments"}

JSON array only, 6 items.`,
        { useWebSearch: true }
      );
      console.log("[Ella's Picks] Raw first response:", resp.slice(0, 800));
      let cleaned = resp.replace(/```json\s?|```/g, "").trim();
      let arrMatch = cleaned.match(/\[[\s\S]*\]/);
      if (!arrMatch) {
        console.warn("First ideas call didn't return JSON array, retrying with simpler prompt...");
        const retry = await callClaude(
          `Today is ${today}. Search for current ${industry} news from the last 60 days. Return ONLY a JSON array, no other text.`,
          `Find 6 specific recent news events relevant to a ${occupation || 'professional'} in ${industry}. Return JSON array: [{"headline":"what happened","context":"2 sentences","why":"debate angle"}]`,
          { useWebSearch: true }
        );
        console.log("[Ella's Picks] Raw retry response:", retry.slice(0, 800));
        cleaned = retry.replace(/```json\s?|```/g, "").trim();
        arrMatch = cleaned.match(/\[[\s\S]*\]/);
      }
      if (!arrMatch) {
        console.error("Ideas raw response (full):", cleaned);
        throw new Error("Couldn't load topics — check console for raw response");
      }
      const parsed = JSON.parse(arrMatch[0]);
      setIdeas(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.error("Ideas fetch failed:", err.message);
      alert("Topic search failed: " + err.message);
      setIdeas([]);
    }
    setLoadingIdeas(false);
  };

  const selectTopic = (topicText) => {
    setTopic(topicText);
    setBlocks([]);
    setScoreResult(null);
    open("landscape");
    fetchLandscape(topicText);
    // Auto-scroll to landscape section
    setTimeout(() => document.getElementById("landscape")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  };

  // ─── Landscape: Research ────────────────────────────────
  const fetchLandscape = async (topicText) => {
    setLoadingLandscape(true);
    try {
      const resp = await callClaude(
        `Today is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. You are a ${industry} research assistant. Search for current 2026 information about this topic. Return ONLY valid JSON, no markdown fences.`,
        `Topic: "${topicText}"\n\nToday's date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Search for the latest 2025-2026 data, news, and perspectives on this topic in ${industry}. Return JSON:\n{"facts":["specific data point or stat with source",...5 items],"angles":["one sentence framing of a possible post angle",...6 items],"stakeholders":["affected role/group",...4-6 items]}\n\nEvery fact must include a specific number, company, or data point. JSON only.`,
        { useWebSearch: true }
      );
      const data = JSON.parse(resp.replace(/```json\s?|```/g, "").trim());
      setFacts((data.facts || []).map((t) => ({ text: t.trim(), enabled: true })));
      setAngles((data.angles || []).map((t) => ({ text: t, selected: false })));
      setStakeholders((data.stakeholders || []).map((n) => ({ name: n, selected: false })));
      open("take");
    } catch (err) {
      console.warn("Landscape fetch failed:", err.message);
    }
    setLoadingLandscape(false);
  };

  // ─── What about? (add to landscape) ─────────────────────
  const handleWhatAbout = async () => {
    if (!whatAbout.trim()) return;
    const q = whatAbout.trim();
    setWhatAbout("");
    try {
      const resp = await callClaude(
        `You are a ${industry} research assistant. Return ONLY valid JSON.`,
        `The user is writing about "${topic}" and asks: "What about ${q}?"\n\nSearch for relevant data. Return JSON: {"facts":["specific data point",...2-3 items],"angles":["possible angle incorporating this",...1 item]}\nJSON only.`,
        { useWebSearch: true }
      );
      const data = JSON.parse(resp.replace(/```json\s?|```/g, "").trim());
      if (data.facts) setFacts((prev) => [...prev, ...data.facts.map((t) => ({ text: t.trim(), enabled: true }))]);
      if (data.angles) setAngles((prev) => [...prev, ...data.angles.map((t) => ({ text: t, selected: false }))]);
    } catch { /* silent */ }
  };

  // ─── Draft generation ───────────────────────────────────
  const generateDraft = async () => {
    if (!canGenerate) return;
    setLoadingDraft(true);
    open("draft");

    const selectedFacts = facts.filter((f) => f.enabled).map((f) => f.text);
    const selectedAngles = angles.filter((a) => a.selected).map((a) => a.text);
    const selectedAudience = stakeholders.filter((s) => s.selected).map((s) => s.name);
    const hasML = !!mlResults;
    const effectiveResults = mlResults || getSeedPatterns(industry);
    const insights = hasML ? formatInsightsForPrompt(effectiveResults) : "";

    const userMessage = [
      `TOPIC: ${topic}`,
      selectedFacts.length ? `\nSELECTED FACTS (use as supporting evidence):\n${selectedFacts.map((f) => `- ${f}`).join("\n")}` : "",
      selectedAngles.length ? `\nANGLE:\n${selectedAngles.join("\n")}` : "",
      selectedAudience.length ? `\nAUDIENCE: ${selectedAudience.join(", ")}` : "",
      take.trim() ? `\nTHE USER'S TAKE (this is the CORE INSIGHT — build the post around this):\n${take}` : "",
      insights ? `\nPATTERN DATA:\n${insights}` : "",
    ].filter(Boolean).join("\n");

    try {
      const resp = await callClaude(
        getDrafterPrompt(industry, "Thought Leader", effectiveResults?.totalPosts || 0, profile?.brand_voice, profile?.product_name, profile?.product_description, profile?.linkedin_context, profile?.voice_profile, profile?.persona_research)
          .replace(/Write two drafts[\s\S]*$/, "Write ONE draft. The user's take is the thesis. Use the selected facts as supporting evidence. Frame it for the selected audience. The user's words and viewpoint drive the post — you're structuring and polishing their thinking, not replacing it.\n\nNo meta-commentary. No explanations. Just the post, ready to paste into LinkedIn."),
        userMessage,
        { model: "claude-opus-4-6", isGeneration: true }
      );
      const cleaned = cleanDraft(resp);
      const paragraphs = cleaned.split(/\n\n+/).filter((p) => p.trim());
      setBlocks(paragraphs.map((text, i) => ({ id: `b-${Date.now()}-${i}`, text: text.trim() })));
      // Refresh server-side count
      getGenerationCount().then(setGenCount).catch(() => {});
      open("draft");
      open("visual");
      open("check");

      // Auto-score
      const s = quickScore(cleaned);
      setScoreResult(s);

      // Extract hashtag suggestions
      const tags = cleaned.match(/#[\w]+/g) || [];
      setHashtags(tags.map((t) => ({ tag: t, enabled: true })));

      setTimeout(() => draftRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);

      // Reset refinement state for new draft
      setRefineHistory([]);
      setValidation(null);
      setGems([]);
    } catch (err) {
      console.error("Draft generation failed:", err.message);
      alert("Draft failed: " + err.message);
    }
    setLoadingDraft(false);
  };

  // ─── Block operations ───────────────────────────────────
  const updateBlock = (id, newText) => {
    setBlocks((bs) => bs.map((b) => b.id === id ? { ...b, text: newText } : b));
    setEditingBlock(null);
    const s = quickScore(blocks.map((b) => b.id === id ? { ...b, text: newText } : b).map((b) => b.text).join("\n\n"));
    setScoreResult(s);
  };

  const removeBlock = (id) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  };

  const moveBlock = (id, dir) => {
    setBlocks((bs) => {
      const idx = bs.findIndex((b) => b.id === id);
      if (idx < 0) return bs;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= bs.length) return bs;
      const copy = [...bs];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const sharpenBlock = async (id) => {
    setSharpeningBlock(id);
    const block = blocks.find((b) => b.id === id);
    if (!block) { setSharpeningBlock(null); return; }
    try {
      const resp = await callClaude(
        `Tighten this paragraph. Add specificity. Return ONLY the rewritten paragraph, nothing else.

Do NOT add em dashes (—), emoji, single-sentence dramatic lines, or formal consulting language. Do NOT use: landscape, navigate, nuanced, robust, delve, foster, leverage, holistic, paradigm, synergy, unlock, lean into. Keep the conversational tone. Use contractions. Vary sentence length.`,
        `PARAGRAPH:\n${block.text}\n\nCONTEXT: This is part of a ${industry} LinkedIn post.`
      );
      updateBlock(id, resp.trim());
    } catch { /* silent */ }
    setSharpeningBlock(null);
  };

  const insertBlock = (afterId) => {
    const newBlock = { id: `b-${Date.now()}`, text: "" };
    setBlocks((bs) => {
      const idx = bs.findIndex((b) => b.id === afterId);
      const copy = [...bs];
      copy.splice(idx + 1, 0, newBlock);
      return copy;
    });
    setEditingBlock(newBlock.id);
    setEditText("");
  };

  // ─── Conversational Refinement ─────────────────────────
  const refineDraft = async () => {
    if (!refineInput.trim() || !blocks.length) return;
    const feedback = refineInput.trim();
    setRefineInput("");
    setRefining(true);
    setRefineHistory(prev => [...prev, { role: "user", text: feedback }]);
    try {
      const resp = await callClaude(
        `You are helping refine a LinkedIn post draft. The user will give you their current draft and feedback on what to change. Apply their feedback precisely. Return ONLY the revised full post — every paragraph, no explanations, no meta-commentary. Maintain the original voice, structure, and length unless the feedback specifically asks to change those.`,
        `CURRENT DRAFT:\n${fullDraftText}\n\n${refineHistory.length > 0 ? `PREVIOUS FEEDBACK APPLIED:\n${refineHistory.filter(h => h.role === 'user').map(h => '- ' + h.text).join('\n')}\n\n` : ''}NEW FEEDBACK:\n${feedback}\n\nRevise the draft based on this feedback. Return the full revised post only.`,
        { model: "claude-opus-4-6" }
      );
      const cleaned = cleanDraft(resp);
      const paragraphs = cleaned.split(/\n\n+/).filter(p => p.trim());
      setBlocks(paragraphs.map((text, i) => ({ id: `b-${Date.now()}-${i}`, text: text.trim() })));
      setRefineHistory(prev => [...prev, { role: "ella", text: `Applied: ${feedback}` }]);
      const s = quickScore(cleaned);
      setScoreResult(s);
    } catch (err) {
      console.warn("Refine failed:", err.message);
    }
    setRefining(false);
  };

  // ─── Auto-Validation ─────────────────────────────────────
  const validateDraft = async () => {
    if (!blocks.length) return;
    setValidating(true);
    try {
      const resp = await callClaude(
        `Today is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. You are a fact-checker and research enricher. Search the web to verify claims in this LinkedIn post draft and find additional relevant data that could strengthen it. Return ONLY valid JSON, no markdown fences.`,
        `DRAFT TO VALIDATE:\n${fullDraftText}\n\nFor each factual claim, statistic, or company reference in this draft:\n1. Search to verify if it's accurate and current (2025-2026 data preferred)\n2. Find any corrections needed\n3. Find additional data points that could strengthen the post\n\nReturn JSON:\n{"claims":[{"text":"the claim from the draft","status":"verified|outdated|unverified|incorrect","note":"what you found — correct number, source, or correction needed"}],"enrichments":["additional relevant data point or stat not in the draft that could strengthen it — be specific with numbers and sources"]}`,
        { useWebSearch: true }
      );
      const cleaned = resp.replace(/```json\s?|```/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setValidation(JSON.parse(jsonMatch[0]));
      }
    } catch (err) {
      console.warn("Validation failed:", err.message);
    }
    setValidating(false);
  };

  // ─── Second Perspective (Sonnet draft → extract gems) ────
  const fetchSecondPerspective = async () => {
    if (!blocks.length) return;
    setLoadingGems(true);
    try {
      // Step 1: Generate a Sonnet draft of the same brief
      const selectedFacts = facts.filter(f => f.enabled).map(f => f.text);
      const brief = `TOPIC: ${topic}\n${selectedFacts.length ? `FACTS: ${selectedFacts.join('; ')}` : ''}\n${take.trim() ? `TAKE: ${take}` : ''}`;

      const sonnetDraft = await callClaude(
        `You are a different writer tackling the same topic. Write a LinkedIn post from a DIFFERENT angle than the original. Be more concise, more provocative, or more data-forward — whatever the original draft ISN'T. No meta-commentary. Just the post.`,
        `BRIEF:\n${brief}\n\nORIGINAL DRAFT (write something DIFFERENT, not a rewrite):\n${fullDraftText.slice(0, 1500)}\n\nWrite an alternative post on the same topic with a genuinely different approach.`
      );

      // Step 2: Extract gems — lines that are meaningfully different
      const gemsResp = await callClaude(
        `Compare two LinkedIn post drafts on the same topic. Extract 3-5 specific lines, phrases, data framings, or angles from Draft B that are genuinely different from Draft A and could strengthen it. Return ONLY valid JSON.`,
        `DRAFT A (the primary):\n${fullDraftText.slice(0, 1500)}\n\nDRAFT B (the alternative):\n${sonnetDraft.slice(0, 1500)}\n\nExtract the "gems" from Draft B — specific lines or angles that Draft A is missing. Not generic improvements, but concrete text that could be inserted or swapped in.\n\nReturn JSON array: [{"text":"the specific line or angle from Draft B","why":"one sentence on why this strengthens Draft A"}]`
      );
      const cleaned = gemsResp.replace(/```json\s?|```/g, "").trim();
      const arrMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        const parsed = JSON.parse(arrMatch[0]);
        setGems(parsed.map(g => ({ ...g, used: false })));
      }
    } catch (err) {
      console.warn("Second perspective failed:", err.message);
    }
    setLoadingGems(false);
  };

  // ─── Copy ───────────────────────────────────────────────
  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullDraftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ═══ RENDER ═════════════════════════════════════════════

  const tierLabel = !industry ? "Set your industry in Settings"
    : postCount >= 50 ? "Writing with very strong patterns"
    : postCount >= 20 ? "Writing with strong patterns"
    : postCount >= 1 ? `Writing with early patterns from ${postCount} posts`
    : `Writing with ${industry} knowledge`;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 2, fontFamily: "'DM Serif Display', serif", color: "#2D2520" }}>Create</h2>
          {profile?.linkedin_context?.name && (
            <p style={{ fontSize: 12, color: "#6B9E7D", margin: 0 }}>
              Writing as <strong>{profile.linkedin_context.name}</strong>
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#8B7E74", background: "#F7F3EE", padding: "4px 10px", borderRadius: 12 }}>{tierLabel}</div>
          <div style={{ fontSize: 10, color: "#B5A698", marginTop: 4 }}>
            {unlimited ? `${genCount} generated this month` : `${remaining}/${monthlyLimit} generations this month`}
          </div>
        </div>
      </div>

      {/* Welcome banner for new users without a profile */}
      {!profile?.industry && (
        <div style={{
          padding: "18px 22px", background: "rgba(232,102,74,0.06)", border: "1.5px solid rgba(232,102,74,0.2)",
          borderRadius: 12, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2520", marginBottom: 4 }}>
              Welcome to Ella
            </div>
            <div style={{ fontSize: 12, color: "#8B7E74", lineHeight: 1.5 }}>
              Set up your profile first so Ella can write in your voice. Takes about 2 minutes.
            </div>
          </div>
          <button onClick={() => window.location.href = "/settings"} style={{
            padding: "10px 20px", border: "none", borderRadius: 20,
            background: "#E8664A", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
          }}>Set up profile &rarr;</button>
        </div>
      )}

      {/* Topic bar — persistent when topic is set */}
      {topic && (
        <div style={{
          padding: "10px 16px", background: "rgba(232,102,74,0.04)", border: "1px solid rgba(232,102,74,0.12)",
          borderRadius: 10, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 13, color: "#2D2520", fontWeight: 600 }}>{topic.slice(0, 120)}{topic.length > 120 ? "..." : ""}</div>
          <button onClick={() => { setTopic(""); setBlocks([]); setFacts([]); setAngles([]); setStakeholders([]); }}
            style={{ background: "none", border: "none", color: "#B5A698", cursor: "pointer", fontSize: 12 }}>Change topic</button>
        </div>
      )}

      {/* ─── SECTION 1: SPARK ─────────────────────────────── */}
      <Section id="spark" title="What caught your eye?" expanded={expanded.spark} onToggle={() => toggle("spark")}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16, marginTop: 12 }}>
          {[["ideas", "Ella's Picks"], ["custom", "Your Spark"]].map(([id, label]) => (
            <button key={id} onClick={() => setSparkTab(id)} style={{
              padding: "6px 14px", borderRadius: 16, border: `1.5px solid ${sparkTab === id ? "#E8664A" : "#E8E2DA"}`,
              background: sparkTab === id ? "rgba(232,102,74,0.08)" : "#fff",
              color: sparkTab === id ? "#E8664A" : "#8B7E74", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>

        {sparkTab === "ideas" && (
          <div>
            {!industry ? (
              <div style={{ padding: "16px", background: "#F7F3EE", borderRadius: 10, fontSize: 12, color: "#8B7E74", lineHeight: 1.5 }}>
                Set your industry in <a href="/settings" style={{ color: "#E8664A", fontWeight: 600, textDecoration: "none" }}>Settings</a> to get personalized topic suggestions.
              </div>
            ) : (
            <button onClick={fetchIdeas} disabled={loadingIdeas} style={{
              padding: "10px 20px", border: "none", borderRadius: 20,
              background: loadingIdeas ? "#E8E2DA" : "#E8664A", color: loadingIdeas ? "#B5A698" : "#fff",
              fontSize: 13, fontWeight: 600, cursor: loadingIdeas ? "wait" : "pointer", marginBottom: 12,
            }}>{loadingIdeas ? "Searching..." : `What's happening in ${industry}?`}</button>
            )}
            {loadingIdeas && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{
                  width: 28, height: 28, border: "3px solid #EDE8E1", borderTopColor: "#E8664A",
                  borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  margin: "0 auto 10px",
                }} />
                <div style={{ fontSize: 13, color: "#8B7E74" }}>Ella is searching for what's happening in {industry}...</div>
                <div style={{ fontSize: 11, color: "#B5A698", marginTop: 4 }}>This usually takes 10-15 seconds</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            {industry && !loadingIdeas && ideas.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: "#E8664A", fontWeight: 600, marginBottom: 12 }}>
                  Pick a topic to get started — Ella will research it for you
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ideas.map((idea, i) => (
                    <button key={i} onClick={() => selectTopic(idea.headline || String(idea))} style={{
                      textAlign: "left", padding: "12px 16px", background: "#F7F3EE", border: "1px solid #EDE8E1",
                      borderRadius: 10, cursor: "pointer", transition: "border-color 0.15s", width: "100%",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2520", marginBottom: 4 }}>{idea.headline || String(idea)}</div>
                      {idea.context && <div style={{ fontSize: 11, color: "#5C534A", lineHeight: 1.5 }}>{idea.context}</div>}
                      {idea.why && <div style={{ fontSize: 10, color: "#B5A698", marginTop: 4 }}>{idea.why}</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {sparkTab === "custom" && (
          <div>
            <input value={customSpark} onChange={(e) => setCustomSpark(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && customSpark.trim() && selectTopic(customSpark.trim())}
              placeholder="I saw something about... / I want to post about..."
              style={{
                width: "100%", padding: "12px 16px", border: "1.5px solid #E8E2DA", borderRadius: 10,
                fontSize: 13, color: "#2D2520", outline: "none", background: "#fff", boxSizing: "border-box",
              }} />
            <button onClick={() => customSpark.trim() && selectTopic(customSpark.trim())}
              disabled={!customSpark.trim()} style={{
                marginTop: 8, padding: "8px 16px", borderRadius: 16, border: "none",
                background: customSpark.trim() ? "#E8664A" : "#E8E2DA", color: customSpark.trim() ? "#fff" : "#B5A698",
                fontSize: 12, fontWeight: 600, cursor: customSpark.trim() ? "pointer" : "not-allowed",
              }}>Go</button>
          </div>
        )}

        {sparkTab === "captures" && (
          <div>
            {recentPosts.length === 0 ? (
              <p style={{ fontSize: 12, color: "#B5A698" }}>Capture some posts first to use them as inspiration.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentPosts.slice(0, 4).map((p) => (
                  <button key={p.id} onClick={() => selectTopic(`Riff on: "${(p.post_text || "").slice(0, 150)}..." — ${p.author_name || "Unknown"} (${p.likes || 0} reactions)`)} style={{
                    textAlign: "left", padding: "12px 16px", background: "#F7F3EE", border: "1px solid #EDE8E1",
                    borderRadius: 10, cursor: "pointer",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#2D2520" }}>{p.author_name || "Unknown"} — {p.likes || 0} reactions</div>
                    <div style={{ fontSize: 11, color: "#5C534A", lineHeight: 1.5, marginTop: 4 }}>{(p.post_text || "").slice(0, 120)}...</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ─── SECTION 2: LANDSCAPE ─────────────────────────── */}
      <Section id="landscape" title="Here's what Ella found" subtitle={loadingLandscape ? "Searching..." : facts.length ? `${facts.length} facts, ${angles.length} angles` : ""}
        expanded={expanded.landscape} onToggle={() => toggle("landscape")}>

        {loadingLandscape && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{
              width: 28, height: 28, border: "3px solid #EDE8E1", borderTopColor: "#E8664A",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
              margin: "0 auto 10px",
            }} />
            <div style={{ fontSize: 13, color: "#8B7E74" }}>Ella is researching this topic...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {facts.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 4 }}>Key Facts</div>
            <div style={{ fontSize: 11, color: "#8B7E74", marginBottom: 10 }}>Click to toggle off facts you don't want in your post. Enabled facts will be used as evidence.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {facts.map((f, i) => (
                <button key={i} onClick={() => setFacts((fs) => fs.map((ff, j) => j === i ? { ...ff, enabled: !ff.enabled } : ff))}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px",
                    background: f.enabled ? "#F7F3EE" : "#fff", border: `1.5px solid ${f.enabled ? "#E8664A33" : "#EDE8E1"}`,
                    borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%",
                    opacity: f.enabled ? 1 : 0.5, transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{f.enabled ? "✓" : "○"}</span>
                  <span style={{ fontSize: 12, color: "#2D2520", lineHeight: 1.5 }}>{f.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {angles.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 4 }}>Angles</div>
            <div style={{ fontSize: 11, color: "#8B7E74", marginBottom: 8 }}>Pick the angle you want to take. This frames how your post approaches the topic.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {angles.map((a, i) => (
                <AngleCard key={i} text={a.text} selected={a.selected}
                  onClick={() => setAngles((as) => as.map((aa, j) => j === i ? { ...aa, selected: !aa.selected } : aa))} />
              ))}
              <input value={customAngle} onChange={(e) => setCustomAngle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && customAngle.trim()) { setAngles((as) => [...as, { text: customAngle.trim(), selected: true }]); setCustomAngle(""); } }}
                placeholder="Add your own angle..."
                style={{ padding: "10px 14px", border: "1px dashed #E8E2DA", borderRadius: 10, fontSize: 12, color: "#2D2520", outline: "none", background: "#fff" }} />
            </div>
          </div>
        )}

        {stakeholders.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 8 }}>Who are you writing for?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {stakeholders.map((s, i) => (
                <Pill key={i} active={s.selected} onClick={() => setStakeholders((ss) => ss.map((ss2, j) => j === i ? { ...ss2, selected: !ss2.selected } : ss2))}>
                  {s.name}
                </Pill>
              ))}
            </div>
          </div>
        )}

        {/* What about? */}
        {topic && (
          <div style={{ marginTop: 16, display: "flex", gap: 6 }}>
            <input value={whatAbout} onChange={(e) => setWhatAbout(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleWhatAbout()}
              placeholder="What about...? (add a thread you want Ella to research)"
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #E8E2DA", borderRadius: 8, fontSize: 12, color: "#2D2520", outline: "none" }} />
            <button onClick={handleWhatAbout} disabled={!whatAbout.trim()} style={{
              padding: "8px 14px", borderRadius: 8, border: "none",
              background: whatAbout.trim() ? "#E8664A" : "#E8E2DA", color: whatAbout.trim() ? "#fff" : "#B5A698",
              fontSize: 12, fontWeight: 600, cursor: whatAbout.trim() ? "pointer" : "not-allowed",
            }}>+</button>
          </div>
        )}
      </Section>

      {/* ─── SECTION 3: YOUR TAKE ─────────────────────────── */}
      <Section id="take" title="What's your take?" subtitle="The insight only you can add"
        expanded={expanded.take} onToggle={() => toggle("take")}>
        <div style={{ marginTop: 12 }}>
          {!take && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {["I think most people are missing...", "The real risk here is...", "This reminds me of when...", "Everyone's focused on X but the real story is..."].map((prompt) => (
                <button key={prompt} onClick={() => setTake(prompt)} style={{
                  padding: "5px 10px", borderRadius: 12, border: "1px solid #EDE8E1",
                  background: "#F7F3EE", color: "#8B7E74", fontSize: 11, cursor: "pointer",
                }}>{prompt}</button>
              ))}
            </div>
          )}
          <textarea value={take} onChange={(e) => setTake(e.target.value)}
            placeholder="What's the connection nobody's making? What would you tell a colleague over coffee?"
            style={{
              width: "100%", minHeight: 100, border: "1.5px solid #E8E2DA", borderRadius: 10,
              padding: "14px", fontSize: 13, color: "#2D2520", fontFamily: "inherit",
              resize: "vertical", outline: "none", lineHeight: 1.6, background: "#fff", boxSizing: "border-box",
            }} />
        </div>
      </Section>

      {/* ─── SECTION 4: DRAFT ─────────────────────────────── */}
      <Section id="draft" title="Ella's draft" subtitle={blocks.length ? `${fullDraftText.length} characters` : ""}
        expanded={expanded.draft} onToggle={() => toggle("draft")}
        badge={blocks.length === 0 ? <button onClick={() => {
          if (!topic) { alert("Pick a topic first from Ella's Picks or type your own."); open("spark"); return; }
          if (!canGenerate) { alert("You've used all your generations this month."); return; }
          generateDraft();
        }} disabled={loadingDraft} style={{
          padding: "6px 14px", borderRadius: 16, border: "none", background: loadingDraft ? "#E8E2DA" : !topic ? "#E8E2DA" : "#E8664A",
          color: loadingDraft ? "#B5A698" : !topic ? "#B5A698" : "#fff", fontSize: 12, fontWeight: 600, cursor: loadingDraft ? "wait" : "pointer",
        }}>{loadingDraft ? "Writing..." : "Write it"}</button> : null}>

        <div ref={draftRef} style={{ marginTop: 12 }}>
          {loadingDraft && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{
                width: 28, height: 28, border: "3px solid #EDE8E1", borderTopColor: "#E8664A",
                borderRadius: "50%", animation: "spin 0.8s linear infinite",
                margin: "0 auto 10px",
              }} />
              <div style={{ color: "#E8664A", fontSize: 14, fontWeight: 600 }}>Ella is writing your draft...</div>
              <div style={{ fontSize: 11, color: "#B5A698", marginTop: 4 }}>Using your voice, your take, and real-time research</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {blocks.length > 0 && (
            <div>
              {blocks.map((block, i) => (
                <div key={block.id} style={{ position: "relative", marginBottom: 4, group: true }}>
                  {editingBlock === block.id ? (
                    <div>
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                        style={{ width: "100%", minHeight: 60, padding: "10px", border: "1.5px solid #E8664A", borderRadius: 8, fontSize: 13, fontFamily: "inherit", lineHeight: 1.6, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        <button onClick={() => { updateBlock(block.id, editText); }} style={{ padding: "4px 10px", borderRadius: 12, border: "none", background: "#E8664A", color: "#fff", fontSize: 11, cursor: "pointer" }}>Save</button>
                        <button onClick={() => setEditingBlock(null)} style={{ padding: "4px 10px", borderRadius: 12, border: "1px solid #E8E2DA", background: "#fff", color: "#8B7E74", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: "10px 14px", borderRadius: 8, border: "1px solid transparent",
                      fontSize: 13, color: "#2D2520", lineHeight: 1.7, whiteSpace: "pre-wrap",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#EDE8E1"; e.currentTarget.style.background = "#FDFCFA"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}>
                      {block.text}
                      <div style={{ display: "flex", gap: 4, marginTop: 6, opacity: 0.6 }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}>
                        <button onClick={() => { setEditingBlock(block.id); setEditText(block.text); }} style={{ padding: "2px 8px", borderRadius: 8, border: "1px solid #E8E2DA", background: "#fff", color: "#8B7E74", fontSize: 10, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => sharpenBlock(block.id)} disabled={sharpeningBlock === block.id} style={{ padding: "2px 8px", borderRadius: 8, border: "1px solid #E8E2DA", background: "#fff", color: sharpeningBlock === block.id ? "#B5A698" : "#8B7E74", fontSize: 10, cursor: "pointer" }}>{sharpeningBlock === block.id ? "..." : "Sharpen"}</button>
                        <button onClick={() => moveBlock(block.id, -1)} disabled={i === 0} style={{ padding: "2px 6px", borderRadius: 8, border: "1px solid #E8E2DA", background: "#fff", color: "#B5A698", fontSize: 10, cursor: "pointer" }}>↑</button>
                        <button onClick={() => moveBlock(block.id, 1)} disabled={i === blocks.length - 1} style={{ padding: "2px 6px", borderRadius: 8, border: "1px solid #E8E2DA", background: "#fff", color: "#B5A698", fontSize: 10, cursor: "pointer" }}>↓</button>
                        <button onClick={() => removeBlock(block.id)} style={{ padding: "2px 8px", borderRadius: 8, border: "1px solid #E8E2DA", background: "#fff", color: "#D4695A", fontSize: 10, cursor: "pointer" }}>Remove</button>
                      </div>
                    </div>
                  )}
                  {/* Insert between blocks */}
                  <div style={{ textAlign: "center", height: 16 }}>
                    <button onClick={() => insertBlock(block.id)} style={{ background: "none", border: "none", color: "#E8E2DA", fontSize: 16, cursor: "pointer", lineHeight: 1 }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#E8664A"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "#E8E2DA"}>+</button>
                  </div>
                </div>
              ))}

              {/* ── Editing Guide ── */}
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(232,102,74,0.04)", borderRadius: 8, border: "1px solid rgba(232,102,74,0.1)" }}>
                <div style={{ fontSize: 11, color: "#8B7E74", lineHeight: 1.6 }}>
                  <strong style={{ color: "#2D2520" }}>Edit your draft:</strong> Hover any paragraph for controls — Edit, Sharpen (AI tightens it), reorder, or remove. Use the box below to tell Ella what to change across the whole post.
                </div>
              </div>

              {/* ── Conversational Refinement ── */}
              <div style={{ marginTop: 12, padding: "14px 16px", background: "#F7F3EE", borderRadius: 10 }}>
                {refineHistory.length > 0 && (
                  <div style={{ marginBottom: 10, maxHeight: 120, overflowY: "auto" }}>
                    {refineHistory.map((h, i) => (
                      <div key={i} style={{ fontSize: 11, color: h.role === "user" ? "#2D2520" : "#6B9E7D", marginBottom: 4 }}>
                        <strong>{h.role === "user" ? "You" : "Ella"}:</strong> {h.text}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !refining && refineDraft()}
                    placeholder="Tell Ella what to change..."
                    disabled={refining}
                    style={{
                      flex: 1, padding: "10px 14px", border: "1.5px solid #E8E2DA", borderRadius: 10,
                      fontSize: 13, color: "#2D2520", outline: "none", background: "#fff",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                  <button onClick={refineDraft} disabled={refining || !refineInput.trim()} style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: refining ? "#E8E2DA" : "#E8664A", color: refining ? "#B5A698" : "#fff",
                    fontSize: 12, fontWeight: 600, cursor: refining ? "wait" : "pointer", whiteSpace: "nowrap",
                  }}>{refining ? "Revising..." : "Revise"}</button>
                </div>
              </div>

              {/* ── Validate + Second Perspective Buttons ── */}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={validateDraft} disabled={validating} style={{
                  padding: "8px 14px", borderRadius: 16, border: "1px solid #E8E2DA", background: "#fff",
                  color: validating ? "#B5A698" : "#5C534A", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>{validating ? "Checking facts..." : validation ? "Re-validate" : "Validate facts"}</button>
                <button onClick={fetchSecondPerspective} disabled={loadingGems} style={{
                  padding: "8px 14px", borderRadius: 16, border: "1px solid #E8E2DA", background: "#fff",
                  color: loadingGems ? "#B5A698" : "#5C534A", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>{loadingGems ? "Finding gems..." : gems.length ? "New perspective" : "Second perspective"}</button>
                <button onClick={generateDraft} disabled={loadingDraft} style={{
                  padding: "8px 14px", borderRadius: 16, border: "1px solid #E8E2DA", background: "#fff",
                  color: "#5C534A", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>Rewrite from scratch</button>
              </div>

              {/* ── Validation Results ── */}
              {validation && (
                <div style={{ marginTop: 12, padding: "14px 16px", background: "#fff", border: "1px solid #EDE8E1", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 8 }}>Fact Check</div>
                  {validation.claims?.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, lineHeight: 1.5 }}>
                      <span style={{
                        flexShrink: 0, width: 18, height: 18, borderRadius: "50%", display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
                        background: c.status === "verified" ? "rgba(107,158,125,0.1)" : c.status === "incorrect" ? "rgba(212,105,90,0.1)" : "rgba(181,166,152,0.1)",
                        color: c.status === "verified" ? "#6B9E7D" : c.status === "incorrect" ? "#D4695A" : "#B5A698",
                      }}>{c.status === "verified" ? "✓" : c.status === "incorrect" ? "✗" : "?"}</span>
                      <div>
                        <span style={{ color: "#2D2520" }}>{c.text?.slice(0, 80)}</span>
                        {c.note && <div style={{ color: "#8B7E74", fontSize: 11, marginTop: 2 }}>{c.note}</div>}
                      </div>
                    </div>
                  ))}
                  {validation.enrichments?.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0EBE4" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#E8664A", marginBottom: 6 }}>Could strengthen your post</div>
                      {validation.enrichments.map((e, i) => (
                        <div key={i} style={{
                          fontSize: 12, color: "#5C534A", lineHeight: 1.5, marginBottom: 4,
                          padding: "6px 10px", background: "#FDFCFA", borderRadius: 6, cursor: "pointer",
                        }}
                          onClick={() => setRefineInput(`Add this data point: ${e}`)}
                          title="Click to add to refinement input">
                          + {e}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Second Perspective Gems ── */}
              {gems.length > 0 && (
                <div style={{ marginTop: 12, padding: "14px 16px", background: "#fff", border: "1px solid #EDE8E1", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 8 }}>Gems from a different angle</div>
                  {gems.map((g, i) => (
                    <div key={i} style={{
                      padding: "8px 12px", marginBottom: 6, borderRadius: 8,
                      background: g.used ? "rgba(107,158,125,0.06)" : "#FDFCFA",
                      border: `1px solid ${g.used ? "rgba(107,158,125,0.2)" : "#EDE8E1"}`,
                      cursor: "pointer", transition: "border-color 0.15s",
                    }}
                      onClick={() => {
                        if (!g.used) {
                          setRefineInput(`Incorporate this idea into the draft: "${g.text}"`);
                          setGems(prev => prev.map((gem, j) => j === i ? { ...gem, used: true } : gem));
                        }
                      }}>
                      <div style={{ fontSize: 12, color: g.used ? "#6B9E7D" : "#2D2520", lineHeight: 1.5 }}>
                        {g.used ? "✓ " : ""}{g.text}
                      </div>
                      {g.why && <div style={{ fontSize: 11, color: "#B5A698", marginTop: 2 }}>{g.why}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* ─── SECTION 5: VISUAL DIRECTION ─────────────────── */}
      {blocks.length > 0 && (() => {
        const directions = analyzeVisualDirection(fullDraftText);
        const brief = visualDirection ? generateVisualBrief(visualDirection, fullDraftText) : "";
        return (
          <Section id="visual" title="Stop the scroll" subtitle="Add a visual direction"
            expanded={expanded.visual} onToggle={() => toggle("visual")}
            badge={visualDirection ? <span style={{ fontSize: 11, color: "#6B9E7D", fontWeight: 600 }}>{VISUAL_DIRECTIONS[visualDirection]?.icon} {VISUAL_DIRECTIONS[visualDirection]?.label}</span> : null}>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 10 }}>Recommended for your post</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {directions.map((dirId) => {
                  const d = VISUAL_DIRECTIONS[dirId];
                  if (!d) return null;
                  const selected = visualDirection === dirId;
                  return (
                    <button key={dirId} onClick={() => setVisualDirection(selected ? null : dirId)} style={{
                      textAlign: "left", padding: "14px 16px", borderRadius: 10,
                      border: `1.5px solid ${selected ? "#E8664A" : "#EDE8E1"}`,
                      background: selected ? "rgba(232,102,74,0.04)" : "#fff",
                      cursor: "pointer", transition: "border-color 0.15s",
                    }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{d.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2520", marginBottom: 4 }}>{d.label}</div>
                      <div style={{ fontSize: 11, color: "#8B7E74", lineHeight: 1.5 }}>{d.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Visual Brief */}
              {brief && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase" }}>Visual Brief</div>
                    <button onClick={() => { navigator.clipboard.writeText(brief); setVisualBriefCopied(true); setTimeout(() => setVisualBriefCopied(false), 2000); }}
                      style={{ padding: "3px 10px", borderRadius: 12, border: "1px solid #E8E2DA", background: visualBriefCopied ? "rgba(107,158,125,0.08)" : "#fff", color: visualBriefCopied ? "#6B9E7D" : "#8B7E74", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                      {visualBriefCopied ? "Copied!" : "Copy brief"}
                    </button>
                  </div>
                  <div style={{
                    background: "#F7F3EE", borderRadius: 8, padding: "12px 14px",
                    fontSize: 12, color: "#5C534A", lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}>{brief}</div>
                </div>
              )}

              {/* Best practices — collapsible */}
              <details style={{ fontSize: 11, color: "#8B7E74" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 6 }}>Visual best practices</summary>
                <div style={{ lineHeight: 1.7, marginTop: 8, paddingLeft: 4 }}>
                  <div>Mobile first — 60%+ of LinkedIn is on phones. Graphic must read as a thumbnail.</div>
                  <div>One focal point — not three competing messages. One number. One face. One statement.</div>
                  <div>High contrast — dark backgrounds with light text outperform pastels in feeds.</div>
                  <div>Faces get attention — a human face increases stop rate when appropriate.</div>
                  <div>Text on images — 7 words max. If it takes more than a glance, it fails.</div>
                  <div>Carousels signal "worth saving" — saves are a strong algorithm quality signal.</div>
                  <div>Avoid stock photo energy — LinkedIn users scroll past generic stock imagery.</div>
                </div>
              </details>

              {/* ML pattern data if available */}
              {mlResults?.mediaPerformance?.length > 0 && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(232,102,74,0.04)", borderRadius: 8, fontSize: 11, color: "#5C534A" }}>
                  <strong style={{ color: "#E8664A" }}>From your patterns:</strong>{" "}
                  {mlResults.mediaPerformance.filter((m) => m.count > 0).slice(0, 2).map((m) => `${m.type} posts avg ${m.avgEngagement} engagement`).join(", ")}
                </div>
              )}
            </div>
          </Section>
        );
      })()}

      {/* ─── SECTION 6: FINAL CHECK ───────────────────────── */}
      {blocks.length > 0 && (
        <Section id="check" title="Final check" subtitle="Review before you post" expanded={expanded.check} onToggle={() => toggle("check")}
          badge={scoreResult ? <span style={{
            fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
            color: scoreResult.score >= 75 ? "#6B9E7D" : scoreResult.score >= 50 ? "#D4A853" : "#D4695A",
            background: scoreResult.score >= 75 ? "rgba(107,158,125,0.08)" : scoreResult.score >= 50 ? "rgba(212,168,83,0.08)" : "rgba(212,105,90,0.08)",
          }}>{scoreResult.score}/100</span> : null}>

          <div style={{ marginTop: 12 }}>
            {scoreResult && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#5C534A" }}>
                  <span>Hook: {scoreResult.features.hook_char_count} chars {scoreResult.features.hook_under_fold ? "(under fold)" : "(over fold — tighten?)"}</span>
                  <span>Length: {fullDraftText.length} chars</span>
                  <span>Read time: {scoreResult.features.reading_time_seconds}s</span>
                  <span>Hashtags: {scoreResult.features.hashtags}</span>
                  <span>CTA: {scoreResult.features.cta_is_open_ended ? "open-ended question" : scoreResult.features.cta_is_question ? "question" : "no question — add one?"}</span>
                </div>
              </div>
            )}

            {/* Hashtag toggles */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 4 }}>Hashtags</div>
              <div style={{ fontSize: 11, color: "#8B7E74", marginBottom: 8 }}>Click to toggle on/off. 3-5 hashtags is optimal for LinkedIn reach.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                {hashtags.map((h, i) => (
                  <Pill key={i} active={h.enabled} onClick={() => setHashtags((hs) => hs.map((hh, j) => j === i ? { ...hh, enabled: !hh.enabled } : hh))}>
                    {h.tag}
                  </Pill>
                ))}
              </div>
              <input
                placeholder="Add a hashtag (e.g. #CPG)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    const tag = e.target.value.trim().startsWith("#") ? e.target.value.trim() : "#" + e.target.value.trim();
                    setHashtags(prev => [...prev, { tag, enabled: true }]);
                    e.target.value = "";
                  }
                }}
                style={{ padding: "6px 10px", border: "1px dashed #E8E2DA", borderRadius: 8, fontSize: 11, color: "#2D2520", outline: "none", background: "#fff", width: 160 }}
              />
            </div>

            {/* Visual readiness */}
            <div style={{ fontSize: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              {visualDirection ? (
                <span style={{ color: "#6B9E7D" }}>{VISUAL_DIRECTIONS[visualDirection]?.icon} Visual: {VISUAL_DIRECTIONS[visualDirection]?.label} — create your graphic before posting</span>
              ) : (
                <span style={{ color: "#D4A853" }}>No visual selected — image posts get 40% more engagement. <button onClick={() => { open("visual"); setTimeout(() => document.getElementById("visual")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }} style={{ background: "none", border: "none", color: "#E8664A", cursor: "pointer", fontSize: 12, fontWeight: 600, textDecoration: "underline", padding: 0 }}>Add one?</button></span>
              )}
            </div>

            {/* Dimensions reference */}
            <div style={{ fontSize: 10, color: "#B5A698", marginBottom: 16 }}>
              Single image: 1200×627px · Carousel: 1080×1080px per slide
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyToClipboard} style={{
                padding: "12px 28px", border: "none", borderRadius: 24,
                background: copied ? "#6B9E7D" : "#E8664A", color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>{copied ? "Copied!" : "Copy to Clipboard"}</button>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
