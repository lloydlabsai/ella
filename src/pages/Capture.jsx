import { useState } from "react";
import ScreenshotUpload from "../components/ScreenshotUpload";
import PostReview from "../components/PostReview";

export default function Capture({ user, profile, posts }) {
  const [extracted, setExtracted] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleExtracted = (data, file) => {
    setExtracted(data);
    setScreenshotFile(file);
    setSuccess(null);
  };

  const handleSave = async (postData) => {
    setSaving(true);
    try {
      // Upload screenshot if available
      let screenshotUrl = "";
      if (screenshotFile && posts.uploadScreenshot) {
        screenshotUrl = await posts.uploadScreenshot(screenshotFile);
      }

      await posts.addPost({
        ...postData,
        screenshot_url: screenshotUrl,
        industry: profile?.industry || "",
      });

      setExtracted(null);
      setScreenshotFile(null);
      setSuccess("Post saved to your database!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert("Save failed: " + err.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Capture Post</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 28, maxWidth: 500 }}>
        Screenshot a LinkedIn post that's performing well in your industry. Ella reads it and adds it to your database.
      </p>

      {/* Stats */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 28,
      }}>
        {[
          { label: "Posts Captured", value: posts.count, color: "#E8A838" },
          { label: "Industry", value: profile?.industry || "Not set", color: "#5B8DEF" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid #1a1a1f",
            borderRadius: 10, padding: "12px 18px",
          }}>
            <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {success && (
        <div style={{
          padding: "12px 16px", background: "rgba(76,175,125,0.1)",
          border: "1px solid rgba(76,175,125,0.2)", borderRadius: 10,
          fontSize: 13, color: "#4CAF7D", fontWeight: 600, marginBottom: 20,
        }}>🦜 {success}</div>
      )}

      {/* Upload or Review */}
      {extracted ? (
        <PostReview
          data={extracted}
          onSave={handleSave}
          onCancel={() => setExtracted(null)}
          saving={saving}
        />
      ) : (
        <ScreenshotUpload onExtracted={handleExtracted} />
      )}

      {/* Recent captures */}
      {posts.posts.length > 0 && !extracted && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Recent Captures
          </div>
          {posts.posts.slice(0, 5).map((p) => (
            <div key={p.id} style={{
              padding: "12px 16px", borderBottom: "1px solid #181818",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>{p.author_name || "Unknown"}</div>
                <div style={{
                  fontSize: 12, color: "#777", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500,
                }}>{p.post_text?.slice(0, 100)}</div>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#666", flexShrink: 0 }}>
                <span>👍 {p.likes || 0}</span>
                <span>💬 {p.comments_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
