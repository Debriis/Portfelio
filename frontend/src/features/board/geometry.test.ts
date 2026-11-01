import { test } from "node:test";
import assert from "node:assert/strict";
import {
  zoomAt,
  pinchView,
  passedDragThreshold,
  pressedView,
} from "./geometry";

test("press depth preserves the grabbed point and restores the user's zoom", () => {
  const camera = { x: 140, y: -70, scale: 1.7 };
  const before = { ...camera },
    anchor = { x: 220, y: 130 };
  const held = pressedView(camera, anchor, 0.95);
  assert(held.scale < camera.scale);
  assert(
    Math.abs(
      (anchor.x - held.x) / held.scale - (anchor.x - camera.x) / camera.scale,
    ) < 0.00001,
  );
  assert(
    Math.abs(
      (anchor.y - held.y) / held.scale - (anchor.y - camera.y) / camera.scale,
    ) < 0.00001,
  );
  assert.deepEqual(camera, before);
  assert.deepEqual(pressedView(camera, anchor, 1), before);
});
test("zoom keeps the world coordinate under the pointer stationary", () => {
  const view = { x: 42, y: -20, scale: 0.8 },
    point = { x: 300, y: 200 };
  const next = zoomAt(view, point, 1.6);
  assert(
    Math.abs(
      (point.x - next.x) / next.scale - (point.x - view.x) / view.scale,
    ) < 0.00001,
  );
  assert(
    Math.abs(
      (point.y - next.y) / next.scale - (point.y - view.y) / view.scale,
    ) < 0.00001,
  );
});
test("pinch scales around its center and follows a moving midpoint", () => {
  const next = pinchView(
    { x: 0, y: 0, scale: 1 },
    [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ],
    [
      { x: 80, y: 120 },
      { x: 280, y: 120 },
    ],
    { x: 0, y: 0 },
  );
  assert.deepEqual(next, { x: -120, y: -80, scale: 2 });
  const atMax = pinchView(
    { x: 0, y: 0, scale: 2.2 },
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
    [
      { x: 10, y: 20 },
      { x: 210, y: 20 },
    ],
    { x: 0, y: 0 },
  );
  assert.equal(atMax.scale, 2.2);
  assert.equal(atMax.x, 60);
  assert.equal(atMax.y, 20);
});
test("small tap movement is tolerated; a real drag suppresses project opening", () => {
  assert.equal(passedDragThreshold({ x: 0, y: 0 }, { x: 3, y: 4 }), false);
  assert.equal(passedDragThreshold({ x: 0, y: 0 }, { x: 8, y: 0 }), true);
});
test("zoom clamps both extremes and safely preserves anchoring", () => {
  assert.equal(
    zoomAt({ x: 0, y: 0, scale: 1 }, { x: 4, y: 9 }, 999).scale,
    2.2,
  );
  assert.equal(
    zoomAt({ x: 0, y: 0, scale: 1 }, { x: 4, y: 9 }, 0.001).scale,
    0.45,
  );
});
