export default function ValidationBadge({ validation }) {
  if (!validation) return null;

  const { score, claims, summary } = validation;
  const color = score >= 80 ? "#4CAF7D" : score >= 50 ? "#E8A838" : "#E85B5B";
  const label = score >= 80 ? "Verified" : score >= 50 ? "Partially Verified" : "Needs Review";

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: `1px solid ${color}33`,
      borderRadius: 14, padding: "18px 22px", marginTop: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}15`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18, fontWeight: 800, color,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{score}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>
            Fact Validation: <span style={{ color }}>{label}</span>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 1 }}>{summary}</div>
        </div>
      </div>

      {/* Claims */}
      {claims?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {claims.map((claim, i) => (
            <div key={i} style={{
              background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "10px 14px",
              borderLeft: `3px solid ${claim.supported ? "#4CAF7D" : claim.error ? "#E85B5B" : "#E8A838"}`,
            }}>
              <div style={{ fontSize: 12, color: "#bbb", lineHeight: 1.5, marginBottom: 6 }}>
                "{claim.claim.slice(0, 120)}{claim.claim.length > 120 ? "..." : ""}"
              </div>
              <div style={{ fontSize: 11, color: claim.supported ? "#4CAF7D" : "#E8A838", fontWeight: 600 }}>
                {claim.supported ? "✅ Verified" : claim.error ? "❌ Error checking" : "⚠️ Not verified"}
              </div>
              {claim.sources?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {claim.sources.slice(0, 2).map((src, j) => (
                    <a key={j} href={src.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 10, color: "#5B8DEF", display: "block", marginTop: 2, textDecoration: "none" }}>
                      {src.title?.slice(0, 60)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
