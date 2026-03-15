import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Capture", icon: "📸" },
  { to: "/database", label: "Database", icon: "📊" },
  { to: "/analyze", label: "Analyze", icon: "🔬" },
  { to: "/generate", label: "Generate", icon: "✍️" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Layout({ children, profile, onSignOut }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#0c0c10", color: "#e0e0e0",
      fontFamily: "'DM Sans', sans-serif", display: "flex",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <nav style={{
        width: 220, borderRight: "1px solid #1a1a1f", padding: "20px 0",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", boxSizing: "border-box",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1a1a1f" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🦜</span>
            <div>
              <div style={{
                fontSize: 20, fontWeight: 800,
                background: "linear-gradient(135deg, #E8A838, #D4782F)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Ella</div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 0.5 }}>CONTENT ENGINE</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, padding: "16px 12px" }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8, marginBottom: 4,
                textDecoration: "none", fontSize: 13, fontWeight: 600,
                color: isActive ? "#E8A838" : "#888",
                background: isActive ? "rgba(232,168,56,0.08)" : "transparent",
                transition: "all 0.15s",
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* User */}
        <div style={{
          padding: "16px 20px", borderTop: "1px solid #1a1a1f",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>
              {profile?.display_name || "User"}
            </div>
            <div style={{ fontSize: 10, color: "#555" }}>
              {profile?.tier === "paid" ? "Pro" : "Free"} · {profile?.industry || "No industry set"}
            </div>
          </div>
          <button onClick={onSignOut} title="Sign out" style={{
            background: "none", border: "none", color: "#555",
            cursor: "pointer", fontSize: 16, padding: 4,
          }}>↪</button>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, minHeight: "100vh", overflowY: "auto" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 36px 80px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
