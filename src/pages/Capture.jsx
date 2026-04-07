import { useState } from "react";
import ScreenshotUpload from "../components/ScreenshotUpload";
import PostReview from "../components/PostReview";
import CSVImport from "../components/CSVImport";

export default function Capture({ user, profile, posts }) {
  const [extracted, setExtracted] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);

  const handleExtracted = (data, file) => {
    setExtracted(data);
    setScreenshotFile(file);
    setSuccess(null);
  };

  const handleSave = async (postData) => {
    setSaving(true);
    try {
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

  const handleCSVImport = async (postData) => {
    await posts.addPost({
      ...postData,
      industry: profile?.industry || "",
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 4, fontFamily: "'DM Serif Display', serif", color: "#2D2520" }}>Capture Post</h2>
      <p style={{ color: "#8B7E74", fontSize: 14, marginBottom: 28, maxWidth: 500 }}>
        Build your post database. Ella gets smarter with every capture.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Posts Captured", value: posts.count, color: "#E8664A" },
          { label: "Industry", value: profile?.industry || "Not set", color: "#7B9EC4" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#fff", border: "1px solid #EDE8E1",
            borderRadius: 10, padding: "12px 18px",
            boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
          }}>
            <div style={{ fontSize: 10, color: "#B5A698", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Progressive onboarding — show until 20 posts */}
      {posts.count < 20 && (
        <div style={{
          padding: "20px 24px", marginBottom: 24, borderRadius: 12,
          background: "#fff", border: "1px solid #EDE8E1",
          boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2D2520" }}>
              Build your database
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#E8664A", fontFamily: "'JetBrains Mono', monospace" }}>
              {posts.count}/20
            </span>
          </div>
          <div style={{
            width: "100%", height: 6, background: "#F0EBE4",
            borderRadius: 3, overflow: "hidden", marginBottom: 16,
          }}>
            <div style={{
              width: `${Math.min(100, Math.round((posts.count / 20) * 100))}%`, height: "100%",
              background: "linear-gradient(90deg, #E8664A, #D4A853)",
              borderRadius: 3, transition: "width 0.4s ease",
            }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{
              background: "#F7F3EE", borderRadius: 8, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E8664A", marginBottom: 4 }}>Browse & Capture</div>
              <div style={{ fontSize: 11, color: "#8B7E74", lineHeight: 1.5 }}>
                Scroll your feed with the Chrome extension. High performers glow orange — click Capture on posts that stand out.
              </div>
            </div>
            <div style={{
              background: "#F7F3EE", borderRadius: 8, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#D4A853", marginBottom: 4 }}>Import History</div>
              <div style={{ fontSize: 11, color: "#8B7E74", lineHeight: 1.5 }}>
                Upload your own LinkedIn data export or any CSV with post data.
              </div>
            </div>
            <div style={{
              background: "#F7F3EE", borderRadius: 8, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7B9EC4", marginBottom: 4 }}>Industry Baseline</div>
              <div style={{ fontSize: 11, color: "#8B7E74", lineHeight: 1.5 }}>
                Start generating with seed patterns while you build your database.
              </div>
            </div>
          </div>

          {posts.count >= 5 && posts.count < 20 && (
            <div style={{ fontSize: 11, color: "#6B9E7D", fontWeight: 600, marginTop: 12 }}>
              Early patterns unlocked! {20 - posts.count} more posts for deep analysis — the vocabulary and phrases that make posts go viral in your niche.
            </div>
          )}
        </div>
      )}

      {success && (
        <div style={{
          padding: "12px 16px", background: "rgba(107,158,125,0.08)",
          border: "1px solid rgba(107,158,125,0.2)", borderRadius: 10,
          fontSize: 13, color: "#6B9E7D", fontWeight: 600, marginBottom: 20,
        }}>{success}</div>
      )}

      {/* CSV Import toggle */}
      {!extracted && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setShowImport(false)} style={{
            padding: "8px 16px", borderRadius: 20, border: `1.5px solid ${!showImport ? "#E8664A" : "#E8E2DA"}`,
            background: !showImport ? "rgba(232,102,74,0.08)" : "#fff",
            color: !showImport ? "#E8664A" : "#8B7E74",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>Screenshot Upload</button>
          <button onClick={() => setShowImport(true)} style={{
            padding: "8px 16px", borderRadius: 20, border: `1.5px solid ${showImport ? "#E8664A" : "#E8E2DA"}`,
            background: showImport ? "rgba(232,102,74,0.08)" : "#fff",
            color: showImport ? "#E8664A" : "#8B7E74",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>CSV Import</button>
        </div>
      )}

      {/* Upload or Review or Import */}
      {extracted ? (
        <PostReview data={extracted} onSave={handleSave} onCancel={() => setExtracted(null)} saving={saving} />
      ) : showImport ? (
        <CSVImport onImport={handleCSVImport} />
      ) : (
        <ScreenshotUpload onExtracted={handleExtracted} />
      )}

      {/* Recent captures */}
      {posts.posts.length > 0 && !extracted && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Recent Captures
          </div>
          {posts.posts.slice(0, 5).map((p) => (
            <div key={p.id}>
              <div
                onClick={() => setExpandedPost(expandedPost === p.id ? null : p.id)}
                style={{
                  padding: "12px 16px", borderBottom: "1px solid #EDE8E1",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  cursor: "pointer", transition: "background 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#FDFCFA"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#2D2520" }}>{p.author_name || "Unknown"}</span>
                    {p.capture_method && p.capture_method !== "extension" && (
                      <span style={{ fontSize: 9, color: "#B5A698", background: "#F0EBE4", padding: "1px 5px", borderRadius: 8 }}>
                        {p.capture_method}
                      </span>
                    )}
                  </div>
                  {expandedPost !== p.id && (
                    <div style={{
                      fontSize: 12, color: "#8B7E74", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500,
                    }}>{p.post_text?.slice(0, 100)}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#B5A698", flexShrink: 0 }}>
                  <span>{p.likes || 0} likes</span>
                  <span>{p.comments_count || 0} comments</span>
                  <span style={{
                    transform: expandedPost === p.id ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}>&#9662;</span>
                </div>
              </div>
              {expandedPost === p.id && (
                <div style={{ padding: "12px 16px 16px", background: "#FDFCFA", borderBottom: "1px solid #EDE8E1" }}>
                  {p.author_title && (
                    <div style={{ fontSize: 11, color: "#B5A698", marginBottom: 8 }}>{p.author_title}</div>
                  )}
                  <div style={{
                    fontSize: 13, color: "#2D2520", lineHeight: 1.7,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>{p.post_text}</div>
                  <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#B5A698" }}>
                    {p.shares > 0 && <span>{p.shares} reposts</span>}
                    {p.hashtags && <span>{p.hashtags}</span>}
                    {p.has_image && <span>Image</span>}
                    {p.has_video && <span>Video</span>}
                    {p.has_carousel && <span>Carousel</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
