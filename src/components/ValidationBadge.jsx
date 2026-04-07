export default function ValidationBadge({ validation }) {
  if (!validation) return null;

  const { score, claims, summary } = validation;
  const color = score >= 80 ? "#6B9E7D" : score >= 50 ? "#D4A853" : "#D4695A";
  const label = score >= 80 ? "Verified" : score >= 50 ? "Partially Verified" : "Needs Review";

  return (
    <div style={{
      background: "#fff", border: `1px solid ${color}33`,
      borderRadius: 14, padding: "18px 22px", marginTop: 16,
      boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}12`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18, fontWeight: 800, color,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{score}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2520" }}>
            Fact Validation: <span style={{ color }}>{label}</span>
          </div>
          <div style={{ fontSize: 12, color: "#8B7E74", marginTop: 1 }}>{summary}</div>
        </div>
      </div>

      {claims?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {claims.map((claim, i) => (
            <div key={i} style={{
              background: "#F7F3EE", borderRadius: 8, padding: "10px 14px",
              borderLeft: `3px solid ${claim.supported ? "#6B9E7D" : claim.error ? "#D4695A" : "#D4A853"}`,
            }}>
              <div style={{ fontSize: 12, color: "#5C534A", lineHeight: 1.5, marginBottom: 6 }}>
                "{claim.claim.slice(0, 120)}{claim.claim.length > 120 ? "..." : ""}"
              </div>
              <div style={{ fontSize: 11, color: claim.supported ? "#6B9E7D" : "#D4A853", fontWeight: 600 }}>
                {claim.supported ? "Verified" : claim.error ? "Error checking" : "Not verified"}
              </div>
              {claim.sources?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {claim.sources.slice(0, 2).map((src, j) => (
                    <a key={j} href={src.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 10, color: "#7B9EC4", display: "block", marginTop: 2, textDecoration: "none" }}>
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
