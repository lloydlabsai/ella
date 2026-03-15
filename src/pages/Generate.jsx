import { useState, useRef } from "react";
import { callClaude } from "../lib/api";
import { validateDraft } from "../lib/tavily";
import { enrichWithContext } from "../lib/perplexity";
import { formatInsightsForPrompt } from "../utils/pipeline";
import { getResearcherPrompt, getDrafterPrompt, getValidatorPrompt } from "../utils/prompts";
import AgentCard from "../components/AgentCard";
import ValidationBadge from "../components/ValidationBadge";
import PricingGate from "../components/PricingGate";

const TONES = [
  { id: "thought-leader", label: "Thought Leader" },
  { id: "storyteller", label: "Storyteller" },
  { id: "contrarian", label: "Contrarian" },
  { id: "data-driven", label: "Data-Driven" },
];

export default function Generate({ profile, mlResults }) {
  const [tone, setTone] = useState("thought-leader");
  const [extra, setExtra] = useState("");
  const [agents, setAgents] = useState({
    researcher: { status: "idle", result: null },
    drafter: { status: "idle", result: null },
    validator: { status: "idle", result: null },
  });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [validation, setValidation] = useState(null);
  const [copied, setCopied] = useState(false);
  const draftRef = useRef();

  const update = (id, patch) => setAgents((p) => ({ ...p, [id]: { ...p[id], ...patch } }));
  const industry = profile?.industry || "general business";
  const toneLabel = TONES.find((t) => t.id === tone)?.label || "Thought Leader";

  const generate = async () => {
    if (!mlResults) return;
    setRunning(true);
    setError(null);
    setDraft("");
    setValidation(null);
    setCopied(false);
    setAgents({
      researcher: { status: "idle", result: null },
      drafter: { status: "idle", result: null },
      validator: { status: "idle", result: null },
    });

    const insights = formatInsightsForPrompt(mlResults);

    try {
      // Agent 1: Research
      update("researcher", { status: "running" });
      const research = await callClaude(
        getResearcherPrompt(industry, extra),
        `Based on ML analysis of ${mlResults.totalPosts} successful ${industry} LinkedIn posts, these patterns drive engagement:\n\n${insights}\n\nFind trending topics. Tone: "${toneLabel}".`,
        { useWebSearch: true }
      );
      update("researcher", { status: "done", result: research });

      // Agent 2: Draft
      update("drafter", { status: "running" });
      const draftResult = await callClaude(
        getDrafterPrompt(industry, toneLabel, mlResults.totalPosts, profile?.brand_voice, profile?.product_name, profile?.product_description),
        `ML PATTERNS:\n${insights}\n\nTRENDING TOPICS:\n${research}\n\n${extra ? `EXTRA CONTEXT: ${extra}` : ""}`
      );
      update("drafter", { status: "done", result: draftResult });
      setDraft(draftResult);

      // Agent 3: Validate (paid tier only)
      if (profile?.tier === "paid") {
        update("validator", { status: "running" });
        try {
          const [tavilyResult, perplexityResult] = await Promise.allSettled([
            validateDraft(draftResult),
            enrichWithContext(draftResult, industry),
          ]);

          const tavilyData = tavilyResult.status === "fulfilled" ? tavilyResult.value : null;
          const perplexityData = perplexityResult.status === "fulfilled" ? perplexityResult.value : null;

          let validationSummary = "";
          if (tavilyData) validationSummary += `FACT CHECK:\n${tavilyData.summary}\n\n`;
          if (perplexityData?.enrichment) validationSummary += `CONTEXT ENRICHMENT:\n${perplexityData.enrichment}`;

          update("validator", { status: "done", result: validationSummary || "Validation complete." });
          setValidation(tavilyData);
        } catch (valErr) {
          update("validator", { status: "done", result: `Validation error: ${valErr.message}` });
        }
      }

      setTimeout(() => draftRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (err) {
      setError(err.message);
    }
    setRunning(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Generate Post</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>
        AI agents use your ML patterns + live research to craft optimized posts
      </p>

      {!mlResults ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔬</div>
          <div style={{ fontSize: 14, color: "#888" }}>Run ML Analysis first to discover your engagement patterns.</div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#888", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Tone</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {TONES.map((t) => (
                  <button key={t.id} onClick={() => setTone(t.id)} style={{
                    background: tone === t.id ? "rgba(232,168,56,0.12)" : "rgba(255,255,255,0.025)",
                    border: `1.5px solid ${tone === t.id ? "#E8A838" : "#222"}`,
                    borderRadius: 8, padding: "10px", cursor: "pointer", textAlign: "center",
                    fontSize: 13, fontWeight: 700, color: tone === t.id ? "#E8A838" : "#888",
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#888", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Extra Context <span style={{ color: "#444", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea value={extra} onChange={(e) => setExtra(e.target.value)}
                placeholder="Product launch, event, specific angle..."
                style={{
                  width: "100%", height: 96, background: "rgba(255,255,255,0.03)",
                  border: "1.5px solid #222", borderRadius: 10, padding: "12px 14px",
                  color: "#ddd", fontSize: 13, fontFamily: "inherit", resize: "none",
                  outline: "none", boxSizing: "border-box", lineHeight: 1.5,
                }}
              />
            </div>
          </div>

          {/* Pattern summary */}
          <div style={{
            background: "rgba(232,168,56,0.05)", border: "1px solid #E8A83822",
            borderRadius: 10, padding: "12px 16px", marginBottom: 24,
            fontSize: 12, color: "#999", fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span style={{ color: "#E8A838", fontWeight: 700 }}>ML patterns loaded:</span>{" "}
            {mlResults.totalPosts} posts, {mlResults.correlations.length} correlations,{" "}
            {mlResults.differentialTerms.length} terms, {mlResults.bigramDiff.length} bigrams
          </div>

          <button onClick={generate} disabled={running} style={{
            width: "100%", padding: "16px", border: "none", borderRadius: 12,
            background: running ? "#333" : "linear-gradient(135deg, #E8A838, #D4782F)",
            color: running ? "#666" : "#111", fontSize: 15, fontWeight: 800,
            cursor: running ? "not-allowed" : "pointer", marginBottom: 28,
          }}>{running ? "Agents Running..." : "Generate LinkedIn Post →"}</button>

          {error && (
            <div style={{
              background: "#2a1515", border: "1px solid #552222", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20, color: "#ff8888", fontSize: 13,
            }}>{error}</div>
          )}

          {/* Agent cards */}
          {(agents.researcher.status !== "idle" || agents.drafter.status !== "idle") && (
            <div style={{ marginBottom: 28 }}>
              <AgentCard icon="🌐" label="Topic Scout" description={`Searching trending ${industry} topics`} color="#4CAF7D" {...agents.researcher} />
              <AgentCard icon="✍️" label="Draft Writer" description="Applying ML patterns to craft posts" color="#5B8DEF" {...agents.drafter} />
              {profile?.tier === "paid" ? (
                <AgentCard icon="🔍" label="Fact Validator" description="Verifying claims via Tavily & Perplexity" color="#E85B5B" {...agents.validator} />
              ) : (
                <PricingGate tier={profile?.tier} feature="Real-Time Fact Validation">
                  <AgentCard icon="🔍" label="Fact Validator" description="Verifying claims via Tavily & Perplexity" color="#E85B5B" status="idle" result={null} />
                </PricingGate>
              )}
            </div>
          )}

          {/* Draft output */}
          {draft && (
            <div ref={draftRef}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1.5 }}>
                  Your LinkedIn Drafts
                </div>
                <button onClick={() => { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{
                    background: copied ? "#4CAF7D20" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${copied ? "#4CAF7D" : "#222"}`,
                    borderRadius: 8, padding: "7px 14px", color: copied ? "#4CAF7D" : "#aaa",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>{copied ? "Copied!" : "Copy All"}</button>
              </div>
              <div style={{
                background: "linear-gradient(135deg, rgba(232,168,56,0.04), rgba(91,141,239,0.04))",
                border: "1.5px solid #222", borderRadius: 14, padding: "24px 28px",
                fontSize: 13.5, lineHeight: 1.75, color: "#ddd", whiteSpace: "pre-wrap",
              }}>{draft}</div>

              {validation && <ValidationBadge validation={validation} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
