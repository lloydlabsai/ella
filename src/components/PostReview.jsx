import { useState } from "react";

const FIELDS = [
  { key: "post_text", label: "Post Text", type: "textarea", required: true },
  { key: "author_name", label: "Author", type: "text" },
  { key: "author_title", label: "Title", type: "text" },
  { key: "likes", label: "Likes", type: "number" },
  { key: "comments_count", label: "Comments", type: "number" },
  { key: "shares", label: "Shares", type: "number" },
  { key: "comment_texts", label: "Comment Texts", type: "textarea" },
  { key: "hashtags", label: "Hashtags", type: "text" },
  { key: "category", label: "Category", type: "text" },
];

export default function PostReview({ data, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => {
    const d = { ...data };
    FIELDS.forEach((f) => { if (d[f.key] == null) d[f.key] = f.type === "number" ? 0 : ""; });
    d.date_posted = d.date_posted || new Date().toISOString().split("T")[0];
    return d;
  });
  const [enabled, setEnabled] = useState(() => {
    const e = {};
    FIELDS.forEach((f) => (e[f.key] = true));
    return e;
  });

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const toggle = (key) => setEnabled((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    const result = {};
    FIELDS.forEach((f) => {
      if (enabled[f.key]) {
        result[f.key] = f.type === "number" ? parseInt(form[f.key]) || 0 : form[f.key];
      }
    });
    result.date_posted = form.date_posted;
    result.has_image = data.has_image || false;
    result.has_video = data.has_video || false;
    result.has_carousel = data.has_carousel || false;
    onSave(result);
  };

  const inputStyle = (isEnabled) => ({
    width: "100%", padding: "8px 12px", fontSize: 13, color: "#2D2520",
    background: isEnabled ? "#fff" : "#F7F3EE", border: "1px solid #E8E2DA",
    borderRadius: 8, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
    opacity: isEnabled ? 1 : 0.4, transition: "all 0.15s",
  });

  return (
    <div style={{
      background: "#fff", border: "1px solid #EDE8E1", borderRadius: 16,
      overflow: "hidden", maxHeight: "75vh", display: "flex", flexDirection: "column",
      boxShadow: "0 2px 8px rgba(45,37,32,0.06)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 24px", borderBottom: "1px solid #EDE8E1",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#2D2520" }}>Review Extracted Data</div>
          <div style={{ fontSize: 12, color: "#8B7E74", marginTop: 2 }}>
            Toggle fields, edit values, then save to your database
          </div>
        </div>
        <button onClick={onCancel} style={{
          background: "none", border: "none", color: "#B5A698", fontSize: 20,
          cursor: "pointer", padding: "4px 8px", borderRadius: 6,
        }}>&times;</button>
      </div>

      <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
        {FIELDS.map((field) => (
          <div key={field.key} style={{
            display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14,
          }}>
            <input
              type="checkbox" checked={enabled[field.key]}
              onChange={() => !field.required && toggle(field.key)}
              disabled={field.required}
              style={{ marginTop: 4, accentColor: "#E8664A", cursor: "pointer" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: "#8B7E74", textTransform: "uppercase",
                letterSpacing: 0.5, marginBottom: 4,
              }}>
                {field.label}{field.required ? " *" : ""}
              </div>
              {field.type === "textarea" ? (
                <textarea
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  disabled={!enabled[field.key]}
                  rows={field.key === "post_text" ? 5 : 2}
                  style={{ ...inputStyle(enabled[field.key]), resize: "vertical", lineHeight: 1.5 }}
                />
              ) : (
                <input
                  type={field.type} value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  disabled={!enabled[field.key]}
                  style={inputStyle(enabled[field.key])}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex", gap: 10, padding: "16px 24px",
        borderTop: "1px solid #EDE8E1",
      }}>
        <button onClick={onCancel} style={{
          padding: "11px 20px", background: "#F7F3EE",
          border: "1px solid #E8E2DA", borderRadius: 20, color: "#5C534A",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, padding: "11px", border: "none", borderRadius: 20,
          background: saving ? "#E8E2DA" : "#E8664A",
          color: saving ? "#B5A698" : "#fff", fontSize: 14, fontWeight: 700,
          cursor: saving ? "wait" : "pointer",
        }}>
          {saving ? "Saving..." : "Save to Database"}
        </button>
      </div>
    </div>
  );
}
