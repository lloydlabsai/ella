import { useState } from "react";
import { supabase } from "../lib/supabase";

const REACTION_COLORS = {
  like: "#378FE9",
  celebrate: "#44B37F",
  support: "#D4A853",
  love: "#E06847",
  insightful: "#C077B8",
  funny: "#E8A838",
};

function ReactionDots({ breakdown }) {
  if (!breakdown?.dominant_types?.length) return null;
  return (
    <span style={{ display: "inline-flex", gap: 3, marginRight: 6, verticalAlign: "middle" }}>
      {breakdown.dominant_types.map((type) => (
        <span key={type} title={type} style={{
          width: 8, height: 8, borderRadius: "50%", display: "inline-block",
          background: REACTION_COLORS[type] || "#B5A698",
        }} />
      ))}
    </span>
  );
}

function PostCard({ post, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...post });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  const [screenshotFailed, setScreenshotFailed] = useState(false);

  const loadScreenshot = async () => {
    if (screenshotUrl || screenshotFailed || !post.screenshot_url) return;
    try {
      const { data, error } = await supabase.storage
        .from("screenshots")
        .createSignedUrl(post.screenshot_url, 300);
      if (error || !data?.signedUrl) {
        setScreenshotFailed(true);
      } else {
        setScreenshotUrl(data.signedUrl);
      }
    } catch {
      setScreenshotFailed(true);
    }
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadScreenshot();
    if (!next) { setEditing(false); setConfirmDelete(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("posts").update({
        post_text: form.post_text,
        author_name: form.author_name,
        author_title: form.author_title,
        likes: parseInt(form.likes) || 0,
        comments_count: parseInt(form.comments_count) || 0,
        shares: parseInt(form.shares) || 0,
        hashtags: form.hashtags,
        comment_texts: form.comment_texts,
        category: form.category,
      }).eq("id", post.id);
      if (error) throw error;
      Object.assign(post, form);
      setEditing(false);
    } catch (err) {
      alert("Save failed: " + err.message);
    }
    setSaving(false);
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", fontSize: 13, color: "#2D2520",
    background: "#F7F3EE", border: "1px solid #E8E2DA", borderRadius: 8,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 10, fontWeight: 700, color: "#B5A698", textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 4, display: "block",
  };

  return (
    <div style={{
      background: "#fff", border: "1px solid #EDE8E1",
      borderRadius: 12, marginBottom: 10,
      boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
      transition: "box-shadow 0.2s",
      ...(expanded ? { boxShadow: "0 2px 12px rgba(45,37,32,0.08)" } : {}),
    }}>
      {/* Collapsed header — always visible, clickable */}
      <div
        onClick={handleExpand}
        style={{
          padding: "16px 20px", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#2D2520" }}>
              {post.author_name || "Unknown"}
            </span>
            {post.author_title && (
              <span style={{ fontSize: 11, color: "#B5A698" }}>{post.author_title}</span>
            )}
          </div>
          {!expanded && (
            <div style={{
              fontSize: 12.5, color: "#5C534A", lineHeight: 1.6,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>{post.post_text}</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
          {post.category && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#E8664A",
              background: "rgba(232,102,74,0.08)", padding: "2px 8px", borderRadius: 12,
            }}>{post.category}</span>
          )}
          <span style={{
            fontSize: 11, color: "#B5A698", transition: "transform 0.2s",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}>&#9662;</span>
        </div>
      </div>

      {/* Expanded detail view */}
      {expanded && (
        <div style={{
          padding: "0 20px 20px",
          borderTop: "1px solid #F0EBE4",
          paddingTop: 16,
        }}>
          {/* Screenshot thumbnail */}
          {screenshotUrl && !screenshotFailed && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={screenshotUrl}
                alt="Post screenshot"
                onError={() => { setScreenshotUrl(null); setScreenshotFailed(true); }}
                style={{
                  maxWidth: "100%", maxHeight: 300, borderRadius: 8,
                  border: "1px solid #EDE8E1", objectFit: "contain",
                }}
              />
            </div>
          )}
          {post.screenshot_url && !screenshotUrl && !screenshotFailed && (
            <div style={{ fontSize: 11, color: "#B5A698", marginBottom: 16, fontStyle: "italic" }}>
              Loading screenshot...
            </div>
          )}

          {/* Full post text */}
          {editing ? (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Post Text</label>
              <textarea
                value={form.post_text}
                onChange={(e) => setForm((f) => ({ ...f, post_text: e.target.value }))}
                style={{ ...inputStyle, minHeight: 120, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
          ) : (
            <div style={{
              fontSize: 13, color: "#2D2520", lineHeight: 1.7,
              whiteSpace: "pre-wrap", marginBottom: 16,
            }}>{post.post_text}</div>
          )}

          {/* Author info */}
          {editing ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Author Name</label>
                <input style={inputStyle} value={form.author_name}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Author Title</label>
                <input style={inputStyle} value={form.author_title}
                  onChange={(e) => setForm((f) => ({ ...f, author_title: e.target.value }))} />
              </div>
            </div>
          ) : (
            (post.author_name || post.author_title) && (
              <div style={{ fontSize: 12, color: "#8B7E74", marginBottom: 16 }}>
                <strong style={{ color: "#2D2520" }}>{post.author_name}</strong>
                {post.author_title && <span> — {post.author_title}</span>}
              </div>
            )
          )}

          {/* Engagement stats */}
          {editing ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Likes</label>
                <input type="number" style={inputStyle} value={form.likes}
                  onChange={(e) => setForm((f) => ({ ...f, likes: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Comments</label>
                <input type="number" style={inputStyle} value={form.comments_count}
                  onChange={(e) => setForm((f) => ({ ...f, comments_count: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Shares</label>
                <input type="number" style={inputStyle} value={form.shares}
                  onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", gap: 16, fontSize: 12, color: "#5C534A",
              marginBottom: 16, padding: "10px 14px",
              background: "#F7F3EE", borderRadius: 8,
            }}>
              <span><ReactionDots breakdown={post.reactions_breakdown} /><strong>{post.likes || 0}</strong> reactions</span>
              <span><strong>{post.comments_count || 0}</strong> comments</span>
              <span><strong>{post.shares || 0}</strong> shares</span>
              {post.impressions > 0 && <span><strong>{post.impressions}</strong> impressions</span>}
              {post.reactions_breakdown?.dominant_types?.length > 0 && (
                <span style={{ fontSize: 11, color: "#B5A698" }}>
                  ({post.reactions_breakdown.dominant_types.join(", ")})
                </span>
              )}
            </div>
          )}

          {/* Media type */}
          {(post.has_image || post.has_video || post.has_carousel) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {post.has_image && <span style={{ fontSize: 11, color: "#7B9EC4", background: "rgba(123,158,196,0.08)", padding: "2px 8px", borderRadius: 12 }}>Image</span>}
              {post.has_video && <span style={{ fontSize: 11, color: "#6B9E7D", background: "rgba(107,158,125,0.08)", padding: "2px 8px", borderRadius: 12 }}>Video</span>}
              {post.has_carousel && <span style={{ fontSize: 11, color: "#D4A853", background: "rgba(212,168,83,0.08)", padding: "2px 8px", borderRadius: 12 }}>Carousel</span>}
            </div>
          )}

          {/* Hashtags */}
          {editing ? (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Hashtags</label>
              <input style={inputStyle} value={form.hashtags}
                onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))} />
            </div>
          ) : (
            post.hashtags && (
              <div style={{ fontSize: 12, color: "#7B9EC4", marginBottom: 16 }}>{post.hashtags}</div>
            )
          )}

          {/* Comment texts */}
          {editing ? (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Comment Texts (pipe-separated)</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                value={form.comment_texts}
                onChange={(e) => setForm((f) => ({ ...f, comment_texts: e.target.value }))} />
            </div>
          ) : (
            post.comment_texts && (
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Comments Captured</div>
                <div style={{
                  fontSize: 12, color: "#5C534A", lineHeight: 1.6,
                  background: "#F7F3EE", borderRadius: 8, padding: "10px 14px",
                }}>
                  {post.comment_texts.split("|").map((c, i) => (
                    <div key={i} style={{ paddingBottom: i < post.comment_texts.split("|").length - 1 ? 6 : 0 }}>
                      {c.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Category (edit mode) */}
          {editing && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Category</label>
              <input style={inputStyle} value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
          )}

          {/* Date + metadata */}
          <div style={{ fontSize: 11, color: "#B5A698", marginBottom: 16 }}>
            {post.date_posted && <span>Posted: {post.date_posted}</span>}
            {post.date_posted && post.created_at && <span> · </span>}
            {post.created_at && <span>Captured: {new Date(post.created_at).toLocaleDateString()}</span>}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {editing ? (
              <>
                <button onClick={() => { setForm({ ...post }); setEditing(false); }} style={{
                  padding: "8px 16px", borderRadius: 20, border: "1px solid #E8E2DA",
                  background: "#fff", color: "#5C534A", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{
                  padding: "8px 16px", borderRadius: 20, border: "none",
                  background: saving ? "#E8E2DA" : "#E8664A", color: saving ? "#B5A698" : "#fff",
                  fontSize: 12, fontWeight: 600, cursor: saving ? "wait" : "pointer",
                }}>{saving ? "Saving..." : "Save Changes"}</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} style={{
                  padding: "8px 16px", borderRadius: 20, border: "1px solid #E8E2DA",
                  background: "#fff", color: "#5C534A", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>Edit</button>
                {confirmDelete ? (
                  <>
                    <button onClick={() => setConfirmDelete(false)} style={{
                      padding: "8px 16px", borderRadius: 20, border: "1px solid #E8E2DA",
                      background: "#fff", color: "#5C534A", fontSize: 12, cursor: "pointer",
                    }}>Cancel</button>
                    <button onClick={() => onDelete(post.id)} style={{
                      padding: "8px 16px", borderRadius: 20, border: "1px solid #D4695A",
                      background: "rgba(212,105,90,0.08)", color: "#D4695A",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>Confirm Delete</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} style={{
                    padding: "8px 16px", borderRadius: 20, border: "1px solid #E8E2DA",
                    background: "#fff", color: "#B5A698", fontSize: 12, cursor: "pointer",
                  }}>Remove</button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Database({ posts }) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? posts.posts.filter((p) =>
        (p.post_text || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.author_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase())
      )
    : posts.posts;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 4, fontFamily: "'DM Serif Display', serif", color: "#2D2520" }}>Post Database</h2>
          <p style={{ color: "#8B7E74", fontSize: 13 }}>{posts.count} posts captured</p>
        </div>
      </div>

      <input
        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search posts, authors, categories..."
        style={{
          width: "100%", padding: "10px 16px", fontSize: 13, color: "#2D2520",
          background: "#fff", border: "1px solid #E8E2DA",
          borderRadius: 10, outline: "none", fontFamily: "inherit", marginBottom: 20,
          boxSizing: "border-box",
        }}
      />

      {posts.loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#B5A698" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 14, color: "#8B7E74" }}>
            {posts.count ? "No posts match your search." : "No posts yet. Go to Capture to add screenshots."}
          </div>
        </div>
      ) : (
        <div>
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} onDelete={posts.deletePost} />
          ))}
        </div>
      )}
    </div>
  );
}
