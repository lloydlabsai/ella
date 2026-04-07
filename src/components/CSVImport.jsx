import { useState, useRef } from "react";

const LINKEDIN_COLUMNS = {
  "date": "date_posted",
  "post content": "post_text",
  "content": "post_text",
  "text": "post_text",
  "post_text": "post_text",
  "media url": "_media_url",
  "author": "author_name",
  "author_name": "author_name",
  "author name": "author_name",
  "title": "author_title",
  "author_title": "author_title",
  "likes": "likes",
  "reactions": "likes",
  "comments": "comments_count",
  "comments_count": "comments_count",
  "shares": "shares",
  "reposts": "shares",
  "hashtags": "hashtags",
  "category": "category",
};

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const parseRow = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === delimiter && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseRow(lines[i]);
    const row = {};
    headers.forEach((h, j) => { row[h] = values[j] || ""; });
    rows.push(row);
  }
  return { headers, rows };
}

function mapToPostSchema(row, columnMap) {
  const post = {
    post_text: "",
    author_name: "",
    author_title: "",
    date_posted: null,
    likes: 0,
    comments_count: 0,
    shares: 0,
    hashtags: "",
    category: "",
    has_image: false,
    has_video: false,
    has_carousel: false,
    capture_method: "csv_import",
    has_engagement_data: false,
  };

  for (const [csvCol, ellaField] of Object.entries(columnMap)) {
    const value = row[csvCol];
    if (!value || ellaField.startsWith("_")) continue;

    if (ellaField === "post_text") {
      post.post_text = value;
    } else if (ellaField === "date_posted") {
      const d = new Date(value);
      if (!isNaN(d.getTime())) post.date_posted = d.toISOString().split("T")[0];
    } else if (["likes", "comments_count", "shares"].includes(ellaField)) {
      const num = parseInt(value.replace(/[^\d]/g, ""));
      if (!isNaN(num) && num > 0) {
        post[ellaField] = num;
        post.has_engagement_data = true;
      }
    } else {
      post[ellaField] = value;
    }
  }

  // Extract hashtags from post text if not mapped
  if (!post.hashtags && post.post_text) {
    const tags = post.post_text.match(/#[\w]+/g);
    if (tags) post.hashtags = tags.join(", ");
  }

  return post;
}

export default function CSVImport({ onImport }) {
  const [parsed, setParsed] = useState(null);
  const [columnMap, setColumnMap] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target.result);
      setParsed({ headers, rows });
      setResult(null);

      // Auto-map columns
      const autoMap = {};
      headers.forEach((h) => {
        const mapped = LINKEDIN_COLUMNS[h];
        if (mapped) autoMap[h] = mapped;
      });
      setColumnMap(autoMap);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    setResult(null);

    const posts = parsed.rows
      .map((row) => mapToPostSchema(row, columnMap))
      .filter((p) => p.post_text && p.post_text.length > 10);

    let imported = 0;
    let failed = 0;
    for (const post of posts) {
      try {
        await onImport(post);
        imported++;
      } catch {
        failed++;
      }
    }

    setResult({ imported, failed, total: posts.length });
    setImporting(false);
  };

  const hasEngagement = parsed?.rows.some((r) =>
    Object.entries(columnMap).some(([col, field]) =>
      ["likes", "comments_count", "shares"].includes(field) && r[col] && parseInt(r[col]) > 0
    )
  );

  const inputStyle = {
    padding: "6px 10px", fontSize: 12, color: "#2D2520", background: "#F7F3EE",
    border: "1px solid #E8E2DA", borderRadius: 6, fontFamily: "inherit", width: "100%",
  };

  return (
    <div style={{
      background: "#fff", border: "1px solid #EDE8E1", borderRadius: 12,
      padding: "20px 24px", boxShadow: "0 1px 3px rgba(45,37,32,0.04)",
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2D2520", marginBottom: 4 }}>Import Posts from CSV</h3>
      <p style={{ fontSize: 12, color: "#8B7E74", marginBottom: 16 }}>
        Upload a LinkedIn data export or any CSV with post data.
      </p>

      {!parsed ? (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed #E8E2DA", borderRadius: 10, padding: "32px 20px",
            textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "#5C534A" }}>Drop a CSV file or click to upload</div>
          <div style={{ fontSize: 11, color: "#B5A698", marginTop: 4 }}>LinkedIn export, spreadsheet, or any .csv</div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: "none" }} />
        </div>
      ) : (
        <div>
          {/* Preview */}
          <div style={{ fontSize: 12, color: "#6B9E7D", fontWeight: 600, marginBottom: 12 }}>
            Found {parsed.rows.length} rows with {parsed.headers.length} columns
          </div>

          {/* Column mapping */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 8 }}>
              Column Mapping
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {parsed.headers.map((h) => (
                <div key={h} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#5C534A", minWidth: 80 }}>{h}</span>
                  <select
                    value={columnMap[h] || ""}
                    onChange={(e) => setColumnMap((m) => ({ ...m, [h]: e.target.value }))}
                    style={{ ...inputStyle, padding: "4px 6px" }}
                  >
                    <option value="">Skip</option>
                    <option value="post_text">Post Text</option>
                    <option value="author_name">Author Name</option>
                    <option value="author_title">Author Title</option>
                    <option value="date_posted">Date</option>
                    <option value="likes">Likes/Reactions</option>
                    <option value="comments_count">Comments</option>
                    <option value="shares">Shares/Reposts</option>
                    <option value="hashtags">Hashtags</option>
                    <option value="category">Category</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {!hasEngagement && (
            <div style={{
              padding: "10px 14px", background: "rgba(212,168,83,0.08)",
              border: "1px solid rgba(212,168,83,0.2)", borderRadius: 8,
              fontSize: 12, color: "#8B7E74", marginBottom: 16, lineHeight: 1.5,
            }}>
              No engagement data detected. Posts will be imported for text/structure analysis only — they'll be excluded from engagement correlation calculations.
            </div>
          )}

          {/* Sample row */}
          {parsed.rows[0] && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B5A698", textTransform: "uppercase", marginBottom: 6 }}>
                First Row Preview
              </div>
              <div style={{
                background: "#F7F3EE", borderRadius: 8, padding: "10px 14px",
                fontSize: 11, color: "#5C534A", lineHeight: 1.6, maxHeight: 80, overflow: "auto",
              }}>
                {Object.entries(parsed.rows[0]).map(([k, v]) => (
                  <div key={k}><strong>{k}:</strong> {String(v).slice(0, 80)}{String(v).length > 80 ? "..." : ""}</div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600,
              background: result.imported > 0 ? "rgba(107,158,125,0.08)" : "rgba(212,105,90,0.08)",
              color: result.imported > 0 ? "#6B9E7D" : "#D4695A",
            }}>
              Imported {result.imported} of {result.total} posts{result.failed > 0 ? ` (${result.failed} failed)` : ""}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setParsed(null); setColumnMap({}); setResult(null); }} style={{
              padding: "10px 16px", borderRadius: 20, border: "1px solid #E8E2DA",
              background: "#fff", color: "#5C534A", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={handleImport} disabled={importing || !columnMap.post_text} style={{
              flex: 1, padding: "10px", borderRadius: 20, border: "none",
              background: importing || !columnMap.post_text ? "#E8E2DA" : "#E8664A",
              color: importing || !columnMap.post_text ? "#B5A698" : "#fff",
              fontSize: 13, fontWeight: 700, cursor: importing ? "wait" : "pointer",
            }}>
              {importing ? "Importing..." : `Import ${parsed.rows.length} Posts`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
