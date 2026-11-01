import { useEffect, useRef } from "react";
/** Static phosphor dots bend toward the edges, without a continuous render loop. */
export function CrtTexture() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!,
      context = canvas.getContext("2d");
    if (!context) return;
    const draw = () => {
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      const ratio = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const step = Math.max(8, width / 150);
      for (let y = -step; y < height + step; y += step)
        for (let x = -step; x < width + step; x += step) {
          const nx = (x - width / 2) / (width / 2),
            ny = (y - height / 2) / (height / 2);
          const px = width / 2 + (x - width / 2) * (1 + 0.035 * ny * ny),
            py = height / 2 + (y - height / 2) * (1 + 0.045 * nx * nx);
          context.fillStyle = "rgba(170,170,170,.22)";
          context.fillRect(px, py, 1, 1);
          context.fillStyle = "rgba(45,110,200,.10)";
          context.fillRect(px + 0.7, py, 1, 1);
        }
      let seed = 947;
      for (let i = 0; i < (width * height) / 100; i++) {
        seed = (seed * 16807) % 2147483647;
        const x = (seed / 2147483647) * width;
        seed = (seed * 16807) % 2147483647;
        context.fillStyle = "rgba(255,255,255,.035)";
        context.fillRect(x, (seed / 2147483647) * height, 0.7, 0.7);
      }
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  return <canvas ref={ref} className="crt-texture" aria-hidden="true" />;
}
