import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Create" },
  { to: "/capture", label: "Capture" },
  { to: "/database", label: "Database" },
  { to: "/analyze", label: "Analyze" },
  { to: "/score", label: "Score" },
  { to: "/settings", label: "Settings" },
];

export default function Layout({ children, profile, onSignOut }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#F7F3EE", color: "#2D2520",
      fontFamily: "'DM Sans', sans-serif", display: "flex",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <nav style={{
        width: 220, borderRight: "1px solid #E8E2DA", padding: "20px 0",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", boxSizing: "border-box",
        background: "#FFFDF9",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #E8E2DA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/ella-logo.png" alt="Ella" style={{ width: 32, height: 32, objectFit: "contain" }} />
            <div>
              <div style={{
                fontSize: 20, fontWeight: 800, color: "#2D2520",
                fontFamily: "'DM Serif Display', serif",
              }}>Ella</div>
              <div style={{ fontSize: 9, color: "#B5A698", letterSpacing: 1.5, textTransform: "uppercase" }}>Content Engine</div>
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
                display: "block",
                padding: "10px 14px", borderRadius: 8, marginBottom: 4,
                textDecoration: "none", fontSize: 13, fontWeight: 600,
                color: isActive ? "#E8664A" : "#8B7E74",
                background: isActive ? "rgba(232,102,74,0.08)" : "transparent",
                transition: "all 0.15s",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* User */}
        <div style={{
          padding: "16px 20px", borderTop: "1px solid #E8E2DA",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#2D2520" }}>
              {profile?.display_name || "User"}
            </div>
            <div style={{ fontSize: 10, color: "#B5A698" }}>
              {profile?.tier === "paid" ? "Pro" : "Free"} · {profile?.industry || "No industry set"}
            </div>
          </div>
          <button onClick={onSignOut} title="Sign out" style={{
            background: "none", border: "none", color: "#B5A698",
            cursor: "pointer", fontSize: 14, padding: 4,
          }}>Sign out</button>
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
