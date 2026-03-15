import { useState, useRef, useCallback } from "react";
import { extractFromScreenshot } from "../lib/api";

export default function ScreenshotUpload({ onExtracted, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const processImage = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const extracted = await extractFromScreenshot(base64, file.type);
      onExtracted(extracted, file);
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  }, [onExtracted]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file);
  }, [processImage]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        processImage(item.getAsFile());
        return;
      }
    }
  }, [processImage]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onPaste={handlePaste}
      onClick={() => !processing && fileRef.current?.click()}
      tabIndex={0}
      style={{
        border: `2px dashed ${dragOver ? "#E8A838" : processing ? "#555" : "#2a2a2f"}`,
        borderRadius: 16,
        padding: processing ? "32px" : "48px 32px",
        textAlign: "center",
        cursor: processing || disabled ? "wait" : "pointer",
        transition: "all 0.2s",
        background: dragOver ? "rgba(232,168,56,0.06)" : "rgba(255,255,255,0.015)",
        outline: "none",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {processing ? (
        <>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#E8A838" }}>
            Ella is reading your screenshot...
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Extracting post text, engagement numbers, and metadata
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📸</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#ccc" }}>
            Drop a screenshot, paste from clipboard, or click to upload
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
            Screenshot any LinkedIn post — Ella extracts everything automatically
          </div>
        </>
      )}

      {error && (
        <div style={{
          marginTop: 14, padding: "8px 14px", background: "rgba(232,91,91,0.1)",
          border: "1px solid rgba(232,91,91,0.2)", borderRadius: 8,
          fontSize: 12, color: "#E85B5B",
        }}>
          {error}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0])}
        style={{ display: "none" }}
      />
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
