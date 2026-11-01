import { useEffect, useRef } from "react";
import { createCrtRenderer } from "./webgl/renderer";
import { requestFrames } from "../../animations/frameLoop";
export function CrtRenderer() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!,
      root = canvas.parentElement!;
    let renderer: ReturnType<typeof createCrtRenderer> = null,
      cancel: (() => void) | null = null,
      disposed = false,
      lost = false,
      failed = false;
    function active() {
      return (
        !root.closest("[inert]") &&
        !root.querySelector(".teletext") &&
        !lost &&
        !failed
      );
    }
    function toggle(enabled: boolean) {
      if (root.classList.contains("gpu-active") !== enabled)
        root.classList.toggle("gpu-active", enabled);
      canvas.dataset.renderer = enabled ? "webgl2" : "fallback";
    }
    let last = 0;
    function start() {
      if (cancel || disposed || !renderer) return;
      cancel = requestFrames((time) => {
        if (!active()) {
          toggle(false);
          cancel = null;
          return false;
        }
        try {
          if (time - last > 15) {
            renderer!.render(time);
            last = time;
          }
          toggle(true);
          return true;
        } catch {
          failed = true;
          toggle(false);
          cancel = null;
          return false;
        }
      }, 20);
    }
    function initialize() {
      try {
        renderer = createCrtRenderer(canvas, root);
        if (renderer) start();
      } catch {
        toggle(false);
      }
    }
    const observer = new MutationObserver(() => {
      if (active()) start();
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "src", "style"],
    });
    const main = root.closest("main");
    if (main)
      observer.observe(main, { attributes: true, attributeFilter: ["inert"] });
    const contextLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      cancel?.();
      cancel = null;
      toggle(false);
    };
    const contextRestored = () => {
      lost = false;
      failed = false;
      renderer?.dispose();
      renderer = null;
      initialize();
    };
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    initialize();
    return () => {
      disposed = true;
      observer.disconnect();
      cancel?.();
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      renderer?.dispose();
      toggle(false);
    };
  }, []);
  return <canvas ref={ref} className="crt-gpu" aria-hidden="true" />;
}
