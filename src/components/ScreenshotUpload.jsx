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
        border: `2px dashed ${dragOver ? "#E8664A" : processing ? "#D4CFC7" : "#E8E2DA"}`,
        borderRadius: 16,
        padding: processing ? "32px" : "48px 32px",
        textAlign: "center",
        cursor: processing || disabled ? "wait" : "pointer",
        transition: "all 0.2s",
        background: dragOver ? "rgba(232,102,74,0.04)" : "#fff",
        outline: "none",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {processing ? (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#E8664A", animation: "pulse 1.5s infinite" }}>
            Ella is reading your screenshot...
          </div>
          <div style={{ fontSize: 12, color: "#8B7E74", marginTop: 6 }}>
            Extracting post text, engagement numbers, and metadata
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#2D2520" }}>
            Drop a screenshot, paste from clipboard, or click to upload
          </div>
          <div style={{ fontSize: 12, color: "#B5A698", marginTop: 6 }}>
            Screenshot any LinkedIn post — Ella extracts everything automatically
          </div>
        </>
      )}

      {error && (
        <div style={{
          marginTop: 14, padding: "8px 14px", background: "rgba(212,105,90,0.06)",
          border: "1px solid rgba(212,105,90,0.15)", borderRadius: 8,
          fontSize: 12, color: "#D4695A",
        }}>
          {error}
        </div>
      )}

      <input
        ref={fileRef} type="file" accept="image/*"
        onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0])}
        style={{ display: "none" }}
      />
    </div>
  );
}
