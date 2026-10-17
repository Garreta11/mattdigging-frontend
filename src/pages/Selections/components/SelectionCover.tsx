import { useEffect, useRef } from "react";
import { Selections } from "../../../services/api";
import { resizedImageUrl } from "../../../hooks/useStorageUrl";

// ─── SelectionCover ───────────────────────────────────────────────────────────
interface SelectionCoverProps {
  coverUrls: (string | null | undefined)[];
  size?: number;
}

export const SelectionCover = ({ coverUrls, size = 80 }: SelectionCoverProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const validUrls = coverUrls.filter(Boolean).slice(0, 3) as string[];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || validUrls.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const loadImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    // Small resized copies (the circles are at most ~65% of `size`), not the full-size files.
    const getPublicUrl = (path: string) => resizedImageUrl("covers", path, Math.round(size * 2)) ?? path;

    const drawCircleImage = (img: HTMLImageElement, cx: number, cy: number, radius: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#375d2c";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    const draw = async () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#FFF2A3";
      ctx.fillRect(0, 0, size, size);

      const results = await Promise.allSettled(
        validUrls.map((path) => loadImage(getPublicUrl(path)))
      );

      const centerX      = size / 2;
      const centerY      = size / 2;
      const centerRadius = size * 0.32;
      const sideRadius   = size * 0.22;
      const sideOffset   = size * 0.25;

      if (results[1]?.status === "fulfilled") { ctx.globalAlpha = 0.7; drawCircleImage(results[1].value, centerX - sideOffset, centerY, sideRadius); }
      if (results[2]?.status === "fulfilled") { ctx.globalAlpha = 0.7; drawCircleImage(results[2].value, centerX + sideOffset, centerY, sideRadius); }
      if (results[0]?.status === "fulfilled") { ctx.globalAlpha = 1.0; drawCircleImage(results[0].value, centerX, centerY, centerRadius); }

      ctx.globalAlpha = 1.0;
    };

    draw();
  }, [validUrls.join(","), size]);

  if (validUrls.length === 0) {
    return <div style={{ width: size, height: size, background: "#1a1a1a", borderRadius: "50%", flexShrink: 0 }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: "block", flexShrink: 0, borderRadius: "8px" }}
    />
  );
};

// ─── Helper ───────────────────────────────────────────────────────────────────
export const getSelectionCovers = (selection: Selections) =>
  selection.selection_tracks?.slice(0, 3).map((st) => st.tracks?.cover_url ?? null) ?? [];
