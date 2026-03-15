export default function PricingGate({ tier, feature, children }) {
  if (tier === "paid") return children;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(3px)", pointerEvents: "none", opacity: 0.4 }}>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center", background: "rgba(12,12,16,0.7)", borderRadius: 14,
      }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>
            {feature || "Premium Feature"}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16, maxWidth: 260, lineHeight: 1.5 }}>
            Real-time fact validation with Tavily & Perplexity ensures your posts are accurate and data-rich.
          </div>
          <button style={{
            padding: "10px 24px", border: "none", borderRadius: 10,
            background: "linear-gradient(135deg, #E8A838, #D4782F)",
            color: "#111", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}
