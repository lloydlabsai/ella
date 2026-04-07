import { useState } from "react";

export default function AuthForm({ onSignIn, onSignUp, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") await onSignIn(email, password);
      else await onSignUp(email, password);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", fontSize: 14, color: "#2D2520",
    background: "#F0EBE4", border: "1px solid #E8E2DA",
    borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F7F3EE", fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <div style={{ width: 380, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src="/ella-logo.png" alt="Ella" style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 14 }} />
          <h1 style={{
            fontSize: 36, fontWeight: 400, margin: 0, color: "#2D2520",
            fontFamily: "'DM Serif Display', serif",
          }}>Ella</h1>
          <p style={{ color: "#2D2520", fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Ella learns what works in your industry, then helps you write it.
          </p>
          <p style={{ color: "#B5A698", fontSize: 12, marginTop: 6 }}>
            Personalized LinkedIn content, backed by data.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            style={{ ...inputStyle, marginBottom: 12 }}
            onFocus={(e) => (e.target.style.borderColor = "#E8664A")}
            onBlur={(e) => (e.target.style.borderColor = "#E8E2DA")}
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required minLength={6}
            style={{ ...inputStyle, marginBottom: 20 }}
            onFocus={(e) => (e.target.style.borderColor = "#E8664A")}
            onBlur={(e) => (e.target.style.borderColor = "#E8E2DA")}
          />

          {error && (
            <div style={{
              padding: "10px 14px", background: "rgba(212,105,90,0.08)",
              border: "1px solid rgba(212,105,90,0.2)", borderRadius: 8,
              fontSize: 13, color: "#D4695A", marginBottom: 16,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "14px", border: "none", borderRadius: 24,
            background: loading ? "#E8E2DA" : "#E8664A",
            color: loading ? "#B5A698" : "#fff", fontSize: 15, fontWeight: 700,
            cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
          }}>
            {loading ? "..." : mode === "signin" ? "Sign In" : "Try Ella Free"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{
              background: "none", border: "none", color: "#E8664A",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
