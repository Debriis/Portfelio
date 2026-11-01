import { test } from "node:test";
import assert from "node:assert/strict";
import { cameraPhysics, coast, followCamera, rubberBand } from "./physics";
import { throughGlass } from "./geometry";
test("camera follow is independent of frame rate", () => {
  const start = { x: 0, y: 0, scale: 1 },
    target = { x: 300, y: -150, scale: 1.8 };
  let a = start,
    b = start;
  for (let i = 0; i < 60; i++) a = followCamera(a, target, 1 / 60);
  for (let i = 0; i < 120; i++) b = followCamera(b, target, 1 / 120);
  assert(Math.abs(a.x - b.x) < 0.001);
  assert(Math.abs(a.scale - b.scale) < 0.00001);
});
test("coasting integrates the same distance at 60 and 120 Hz", () => {
  function run(steps: number) {
    let v = { x: 900, y: -300 },
      x = 0,
      y = 0;
    for (let i = 0; i < steps; i++) {
      const next = coast(v, 1 / steps);
      v = next.velocity;
      x += next.delta.x;
      y += next.delta.y;
    }
    return { x, y, v };
  }
  const a = run(60),
    b = run(120);
  assert(Math.abs(a.x - b.x) < 0.00001);
  assert(Math.abs(a.x - 900 / cameraPhysics.coastDecay) < 0.1);
  assert(a.v.x < 1);
});
test("rubber-band movement remains continuous and resists beyond the limit", () => {
  assert.equal(rubberBand(100, 200), 100);
  assert.equal(rubberBand(200, 200), 200);
  assert.equal(rubberBand(300, 200), 220);
  assert.equal(rubberBand(-300, 200), -220);
});
test("glass pointer mapping preserves the center and corrects peripheral sampling", () => {
  const r = { left: 10, top: 20, width: 1000, height: 600 };
  assert.deepEqual(throughGlass({ x: 510, y: 320 }, r), { x: 510, y: 320 });
  const p = throughGlass({ x: 900, y: 100 }, r);
  assert(p.x > 900);
  assert(p.y < 100);
});
