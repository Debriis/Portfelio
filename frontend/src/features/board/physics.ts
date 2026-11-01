import type { Point, View } from "./geometry";
export const cameraPhysics = {
  follow: 42,
  coastDecay: 11,
  maxSpeed: 2400,
  stopSpeed: 3,
  elasticity: 0.2,
};
export function rubberBand(value: number, limit: number) {
  return Math.abs(value) <= limit
    ? value
    : Math.sign(value) *
        (limit + (Math.abs(value) - limit) * cameraPhysics.elasticity);
}
export function followCamera(
  current: View,
  target: View,
  seconds: number,
): View {
  const alpha = 1 - Math.exp(-cameraPhysics.follow * Math.min(seconds, 0.05));
  return {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha,
    scale: current.scale + (target.scale - current.scale) * alpha,
  };
}
export function coast(velocity: Point, seconds: number) {
  const decay = Math.exp(-cameraPhysics.coastDecay * seconds);
  return {
    delta: {
      x: (velocity.x * (1 - decay)) / cameraPhysics.coastDecay,
      y: (velocity.y * (1 - decay)) / cameraPhysics.coastDecay,
    },
    velocity: { x: velocity.x * decay, y: velocity.y * decay },
  };
}
