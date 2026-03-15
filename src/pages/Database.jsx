import { useState } from "react";

export default function Database({ posts }) {
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = search
    ? posts.posts.filter((p) =>
        (p.post_text || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.author_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase())
      )
    : posts.posts;

  const handleDelete = async (id) => {
    await posts.deletePost(id);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Post Database</h2>
          <p style={{ color: "#666", fontSize: 13 }}>{posts.count} posts captured</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search posts, authors, categories..."
        style={{
          width: "100%", padding: "10px 16px", fontSize: 13, color: "#ccc",
          background: "rgba(255,255,255,0.04)", border: "1px solid #222",
          borderRadius: 10, outline: "none", fontFamily: "inherit", marginBottom: 20,
          boxSizing: "border-box",
        }}
      />

      {/* Post list */}
      {posts.loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#555" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{posts.count ? "🔍" : "📸"}</div>
          <div style={{ color: "#555", fontSize: 13 }}>
            {posts.count ? "No posts match your search." : "No posts yet. Go to Capture to add screenshots."}
          </div>
        </div>
      ) : (
        <div>
          {filtered.map((p) => (
            <div key={p.id} style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1f",
              borderRadius: 12, padding: "16px 20px", marginBottom: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>
                    {p.author_name || "Unknown"}
                  </span>
                  {p.author_title && (
                    <span style={{ fontSize: 11, color: "#666", marginLeft: 8 }}>{p.author_title}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {p.category && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: "#E8A838",
                      background: "rgba(232,168,56,0.1)", padding: "2px 8px", borderRadius: 12,
                    }}>{p.category}</span>
                  )}
                  <span style={{ fontSize: 10, color: "#555" }}>{p.date_posted}</span>
                </div>
              </div>

              <div style={{
                fontSize: 12.5, color: "#999", lineHeight: 1.6, marginBottom: 10,
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>{p.post_text}</div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#666" }}>
                  <span>👍 {p.likes || 0}</span>
                  <span>💬 {p.comments_count || 0}</span>
                  <span>🔄 {p.shares || 0}</span>
                  {p.has_image && <span>🖼️</span>}
                  {p.has_video && <span>🎬</span>}
                  {p.has_carousel && <span>📑</span>}
                </div>
                {confirmDelete === p.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleDelete(p.id)} style={{
                      padding: "4px 10px", borderRadius: 6, border: "1px solid #E85B5B",
                      background: "rgba(232,91,91,0.1)", color: "#E85B5B",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}>Confirm</button>
                    <button onClick={() => setConfirmDelete(null)} style={{
                      padding: "4px 10px", borderRadius: 6, border: "1px solid #333",
                      background: "transparent", color: "#888",
                      fontSize: 11, cursor: "pointer",
                    }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(p.id)} style={{
                    padding: "4px 10px", borderRadius: 6, border: "1px solid #222",
                    background: "transparent", color: "#555",
                    fontSize: 11, cursor: "pointer",
                  }}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
