import { useEffect, useRef } from "react";
import { requestFrames } from "../animations/frameLoop";
import { cursorMotion } from "../animations/settings";

/** Small content drift inside fixed CRT glass, independent of board position and zoom. */
export function useCursorDrift(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(any-hover: hover) and (any-pointer: fine)");
    let x = 0,
      y = 0,
      targetX = 0,
      targetY = 0,
      last = 0;
    let pressed = false,
      cancel: (() => void) | null = null;
    const allowed = () => !reduced.matches && fine.matches && !document.hidden;
    function reset() {
      cancel?.();
      cancel = null;
      last = 0;
      x = y = targetX = targetY = 0;
      element!.style.removeProperty("transform");
    }
    function wake() {
      if (cancel || !allowed()) return;
      last = 0;
      cancel = requestFrames((time) => {
        const dt = last ? Math.min((time - last) / 1000, 0.05) : 1 / 60;
        last = time;
        const follow = 1 - Math.exp(-cursorMotion.follow * dt);
        x += (targetX - x) * follow;
        y += (targetY - y) * follow;
        element!.style.transform = `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0)`;
        if (Math.hypot(targetX - x, targetY - y) < 0.015) {
          cancel = null;
          if (!targetX && !targetY) element!.style.removeProperty("transform");
          return false;
        }
        return true;
      }, -10);
    }
    function move(event: PointerEvent) {
      if (event.pointerType === "touch" || pressed || !allowed()) return;
      targetX =
        (Math.max(0, Math.min(1, event.clientX / innerWidth)) * 2 - 1) *
        cursorMotion.distanceX;
      targetY =
        (Math.max(0, Math.min(1, event.clientY / innerHeight)) * 2 - 1) *
        cursorMotion.distanceY;
      wake();
    }
    // Freeze drift while dragging, so the moving frame never fights the gesture.
    function down(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      pressed = true;
      targetX = x;
      targetY = y;
    }
    function up(event: PointerEvent) {
      pressed = false;
      move(event);
    }
    function leave() {
      pressed = false;
      targetX = targetY = 0;
      wake();
    }
    function visibility() {
      if (document.hidden) {
        pressed = false;
        reset();
      }
    }
    const options = { passive: true };
    window.addEventListener("pointermove", move, options);
    window.addEventListener("pointerdown", down, options);
    window.addEventListener("pointerup", up, options);
    window.addEventListener("pointercancel", leave, options);
    window.addEventListener("blur", leave);
    document.documentElement.addEventListener("pointerleave", leave, options);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", reset);
    fine.addEventListener("change", reset);
    return () => {
      reset();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", leave);
      window.removeEventListener("blur", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reset);
      fine.removeEventListener("change", reset);
    };
  }, [enabled]);
  return ref;
}
