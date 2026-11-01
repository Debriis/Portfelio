import { motion, crtSettings } from "../../animations/settings";
export interface View {
  x: number;
  y: number;
  scale: number;
}
export interface Point {
  x: number;
  y: number;
}
export const initialView: View = { x: 0, y: 0, scale: 1 };
/** Decorative press depth: never writes back into the user's camera zoom. */
export function pressedView(view: View, anchor: Point, factor: number): View {
  return {
    x: anchor.x + (view.x - anchor.x) * factor,
    y: anchor.y + (view.y - anchor.y) * factor,
    scale: view.scale * factor,
  };
}
/** Same inverse barrel projection used by the CRT fragment shader. */
export function throughGlass(
  point: Point,
  rect: { left: number; top: number; width: number; height: number },
): Point {
  const x = ((point.x - rect.left) / rect.width) * 2 - 1,
    y = ((point.y - rect.top) / rect.height) * 2 - 1;
  return {
    x:
      rect.left +
      ((x * (1 + crtSettings.curvature * y * y) + 1) * rect.width) / 2,
    y:
      rect.top +
      ((y * (1 + crtSettings.curvature * x * x) + 1) * rect.height) / 2,
  };
}
export function zoomAt(
  view: View,
  point: { x: number; y: number },
  factor: number,
): View {
  const scale = Math.max(
    motion.minZoom,
    Math.min(motion.maxZoom, view.scale * factor),
  );
  const ratio = scale / view.scale;
  return {
    x: point.x - (point.x - view.x) * ratio,
    y: point.y - (point.y - view.y) * ratio,
    scale,
  };
}
// Pinch scaling uses the old midpoint, then follows the new midpoint so a
// simultaneous two-finger pan does not pull the content away from the fingers.
export function pinchView(
  view: View,
  before: Point[],
  after: Point[],
  origin: Point,
): View {
  const distance = (p: Point[]) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  const midpoint = (p: Point[]) => ({
    x: (p[0].x + p[1].x) / 2 - origin.x,
    y: (p[0].y + p[1].y) / 2 - origin.y,
  });
  const a = midpoint(before),
    b = midpoint(after);
  const next = zoomAt(view, a, distance(after) / Math.max(1, distance(before)));
  return { ...next, x: next.x + b.x - a.x, y: next.y + b.y - a.y };
}
export function passedDragThreshold(origin: Point, current: Point) {
  return (
    Math.hypot(current.x - origin.x, current.y - origin.y) >
    motion.dragThreshold
  );
}
