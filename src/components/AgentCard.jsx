import { useState, useEffect } from "react";

function Dots() {
  const [d, setD] = useState("");
  useEffect(() => {
    const iv = setInterval(() => setD((p) => (p.length >= 3 ? "" : p + ".")), 400);
    return () => clearInterval(iv);
  }, []);
  return <span style={{ display: "inline-block", width: 18 }}>{d}</span>;
}

export default function AgentCard({ label, description, color, status, result }) {
  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${status === "done" ? color : status === "running" ? color + "66" : "#EDE8E1"}`,
      borderRadius: 12, padding: "16px 20px", marginBottom: 12,
      opacity: status === "idle" ? 0.4 : 1, transition: "all 0.4s",
      boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: result ? 12 : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2520" }}>{label}</div>
          <div style={{ fontSize: 11, color: "#8B7E74" }}>{description}</div>
        </div>
        {status === "running" && (
          <div style={{ color, fontSize: 12, fontWeight: 600 }}>Processing<Dots /></div>
        )}
        {status === "done" && (
          <div style={{
            background: color + "15", color, fontSize: 11, fontWeight: 700,
            padding: "3px 10px", borderRadius: 16,
          }}>Done</div>
        )}
      </div>
      {result && (
        <div style={{
          background: "#F7F3EE", borderRadius: 8, padding: "14px 16px",
          fontSize: 12.5, lineHeight: 1.7, color: "#5C534A", whiteSpace: "pre-wrap",
          maxHeight: 260, overflowY: "auto",
        }}>{result}</div>
      )}
    </div>
  );
}
