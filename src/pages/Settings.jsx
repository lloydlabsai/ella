import { useState, useEffect } from "react";

export default function Settings({ profile, updateProfile }) {
  const [form, setForm] = useState({
    display_name: "", industry: "", brand_voice: "",
    product_name: "", product_description: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setForm({
      display_name: profile.display_name || "",
      industry: profile.industry || "",
      brand_voice: profile.brand_voice || "",
      product_name: profile.product_name || "",
      product_description: profile.product_description || "",
    });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert("Save failed: " + err.message);
    }
    setSaving(false);
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", fontSize: 13, color: "#ccc",
    background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2f",
    borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#999", display: "block", marginBottom: 6,
    textTransform: "uppercase", letterSpacing: 0.5,
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Settings</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 28 }}>
        Configure your profile so Ella generates posts in your voice and for your industry.
      </p>

      <div style={{ maxWidth: 520 }}>
        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Display Name</label>
          <input style={inputStyle} value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Your name" />
        </div>

        {/* Industry */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Industry</label>
          <input style={inputStyle} value={form.industry}
            onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
            placeholder="e.g., SaaS, Healthcare, CPG Food & Bev, FinTech, Real Estate..." />
          <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
            This tells Ella's agents what industry to research and tailor posts for
          </div>
        </div>

        {/* Brand voice */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Brand Voice</label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.5 }}
            value={form.brand_voice}
            onChange={(e) => setForm((p) => ({ ...p, brand_voice: e.target.value }))}
            placeholder="Describe your writing style. e.g., 'Direct and conversational. I use short sentences. I challenge conventional wisdom but back it up with data. Occasional dry humor. I avoid jargon and buzzwords.'" />
          <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
            The draft writer will match this tone and style
          </div>
        </div>

        {/* Product */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f",
          borderRadius: 12, padding: "18px 20px", marginBottom: 24,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ddd", marginBottom: 4 }}>
            Product Mention <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span>
          </div>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 14, lineHeight: 1.5 }}>
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

        {/* Tier */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f",
          borderRadius: 12, padding: "18px 20px", marginBottom: 28,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>
              Plan: {profile?.tier === "paid" ? "Pro" : "Free"}
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
              {profile?.tier === "paid"
                ? "Real-time fact validation with Tavily & Perplexity enabled"
                : "Upgrade to Pro for real-time fact validation and enrichment"}
            </div>
          </div>
          {profile?.tier !== "paid" && (
            <button style={{
              padding: "8px 18px", border: "none", borderRadius: 8,
              background: "linear-gradient(135deg, #E8A838, #D4782F)",
              color: "#111", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>Upgrade</button>
          )}
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} style={{
          padding: "14px 32px", border: "none", borderRadius: 12,
          background: saved ? "#4CAF7D" : saving ? "#333" : "linear-gradient(135deg, #E8A838, #D4782F)",
          color: saved ? "#fff" : saving ? "#666" : "#111",
          fontSize: 14, fontWeight: 800, cursor: saving ? "wait" : "pointer",
          transition: "all 0.2s",
        }}>
          {saved ? "✓ Saved" : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
