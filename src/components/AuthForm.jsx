import { useState } from "react";

export default function AuthForm({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState("signin");
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
    width: "100%", padding: "12px 16px", fontSize: 14, color: "#e0e0e0",
    background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a2f",
    borderRadius: 10, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0c0c10", fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: 380, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🦜</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, margin: 0,
            background: "linear-gradient(135deg, #E8A838, #D4782F)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Ella</h1>
          <p style={{ color: "#555", fontSize: 13, marginTop: 4 }}>
            ML-powered LinkedIn content engine
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ ...inputStyle, marginBottom: 12 }}
            onFocus={(e) => (e.target.style.borderColor = "#E8A838")}
            onBlur={(e) => (e.target.style.borderColor = "#2a2a2f")}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ ...inputStyle, marginBottom: 20 }}
            onFocus={(e) => (e.target.style.borderColor = "#E8A838")}
            onBlur={(e) => (e.target.style.borderColor = "#2a2a2f")}
          />

          {error && (
            <div style={{
              padding: "10px 14px", background: "rgba(232,91,91,0.1)",
              border: "1px solid rgba(232,91,91,0.2)", borderRadius: 8,
              fontSize: 13, color: "#E85B5B", marginBottom: 16,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "14px", border: "none", borderRadius: 12,
            background: loading ? "#333" : "linear-gradient(135deg, #E8A838, #D4782F)",
            color: loading ? "#666" : "#111", fontSize: 15, fontWeight: 800,
            cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
          }}>
            {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{
              background: "none", border: "none", color: "#E8A838",
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
