import { useEffect, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  MouseEvent,
  SetStateAction,
} from "react";
import {
  initialView,
  zoomAt,
  pinchView,
  passedDragThreshold,
  throughGlass,
} from "./geometry";
import type { View, Point } from "./geometry";
import { motion } from "../../animations/settings";
import { requestFrames } from "../../animations/frameLoop";
import { cameraPhysics, coast, followCamera, rubberBand } from "./physics";
export function useBoard(resetKey: number) {
  const element = useRef<HTMLDivElement>(null),
    current = useRef<View>({ ...initialView }),
    target = useRef<View>({ ...initialView });
  const [view, publish] = useState(initialView);
  const pointers = useRef(new Map<number, Point>()),
    dragged = useRef(false),
    origin = useRef<Point | null>(null);
  const velocity = useRef<Point>({ x: 0, y: 0 }),
    raw = useRef<Point>({ x: 0, y: 0 }),
    lastMove = useRef(0),
    lastFrame = useRef(0),
    lastScale = useRef(100),
    cancel = useRef<(() => void) | null>(null);
  function limits() {
    return {
      x: Math.max(600, innerWidth * 1.3),
      y: Math.max(650, innerHeight * 1.4),
    };
  }
  function project(p: Point) {
    const glass = element.current?.closest(".crt-screen");
    return glass?.classList.contains("gpu-active")
      ? throughGlass(p, glass.getBoundingClientRect())
      : p;
  }
  function paint() {
    const node = element.current,
      world = node?.querySelector<HTMLElement>(".board-world");
    if (!node || !world) return;
    const v = current.current;
    world.style.transform =
      "translate(" + v.x + "px," + v.y + "px) scale(" + v.scale + ")";
    node.style.setProperty(
      "--pull-x",
      String(
        pointers.current.size
          ? Math.max(-1, Math.min(1, (target.current.x - v.x) / 100))
          : 0,
      ),
    );
    node.style.setProperty(
      "--pull-y",
      String(
        pointers.current.size
          ? Math.max(-1, Math.min(1, (target.current.y - v.y) / 100))
          : 0,
      ),
    );
    if (Math.round(v.scale * 100) !== lastScale.current) {
      lastScale.current = Math.round(v.scale * 100);
      publish({ ...v });
    }
  }
  function animate(time: number) {
    const dt = lastFrame.current
      ? Math.min(0.035, (time - lastFrame.current) / 1000)
      : 1 / 60;
    lastFrame.current = time;
    const bounds = limits();
    if (!pointers.current.size) {
      const flight = coast(velocity.current, dt);
      velocity.current = flight.velocity;
      target.current = {
        ...target.current,
        x: Math.max(
          -bounds.x,
          Math.min(bounds.x, target.current.x + flight.delta.x),
        ),
        y: Math.max(
          -bounds.y,
          Math.min(bounds.y, target.current.y + flight.delta.y),
        ),
      };
      if (Math.abs(target.current.x) >= bounds.x) velocity.current.x = 0;
      if (Math.abs(target.current.y) >= bounds.y) velocity.current.y = 0;
    }
    current.current = matchMedia("(prefers-reduced-motion:reduce)").matches
      ? { ...target.current }
      : followCamera(current.current, target.current, dt);
    paint();
    const error =
      Math.hypot(
        target.current.x - current.current.x,
        target.current.y - current.current.y,
      ) +
      Math.abs(target.current.scale - current.current.scale) * 1000;
    const speed = Math.hypot(velocity.current.x, velocity.current.y);
    if (element.current)
      element.current.dataset.motion = pointers.current.size
        ? dragged.current
          ? "pulling"
          : "pressed"
        : speed > cameraPhysics.stopSpeed
          ? "coasting"
          : "settling";
    if (
      error < 0.05 &&
      (pointers.current.size || speed < cameraPhysics.stopSpeed)
    ) {
      current.current = { ...target.current };
      velocity.current = { x: 0, y: 0 };
      paint();
      publish({ ...current.current });
      cancel.current = null;
      lastFrame.current = 0;
      if (element.current)
        element.current.dataset.motion = pointers.current.size
          ? "held"
          : "idle";
      return false;
    }
    return true;
  }
  function wake() {
    if (!cancel.current) {
      lastFrame.current = 0;
      cancel.current = requestFrames(animate, 0);
    }
  }
  function setView(action: SetStateAction<View>) {
    velocity.current = { x: 0, y: 0 };
    target.current =
      typeof action === "function" ? action(target.current) : action;
    wake();
  }
  function zoom(factor: number) {
    setView((v) => zoomAt(v, { x: 0, y: 0 }, factor));
  }
  useEffect(() => {
    cancel.current?.();
    cancel.current = null;
    pointers.current.clear();
    current.current = { ...initialView };
    target.current = { ...initialView };
    velocity.current = { x: 0, y: 0 };
    paint();
    publish({ ...initialView });
    if (element.current) element.current.dataset.motion = "idle";
  }, [resetKey]);
  useEffect(() => {
    const node = element.current!;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = node.getBoundingClientRect(),
        world = node.querySelector<HTMLElement>(".board-world")!,
        p = project({ x: e.clientX, y: e.clientY });
      setView((v) =>
        zoomAt(
          v,
          {
            x: p.x - r.left - world.offsetLeft,
            y: p.y - r.top - world.offsetTop,
          },
          Math.exp(-e.deltaY * motion.wheelSensitivity),
        ),
      );
    };
    const stop = () => {
      pointers.current.clear();
      velocity.current = { x: 0, y: 0 };
      target.current = { ...current.current };
      cancel.current?.();
      cancel.current = null;
      lastFrame.current = 0;
      paint();
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    node.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      node.removeEventListener("wheel", wheel);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", visibility);
      cancel.current?.();
      cancel.current = null;
    };
  }, []);
  const down = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    if (!pointers.current.size) {
      cancel.current?.();
      cancel.current = null;
      target.current = { ...current.current };
      raw.current = { x: current.current.x, y: current.current.y };
      velocity.current = { x: 0, y: 0 };
      origin.current = { x: e.clientX, y: e.clientY };
      dragged.current = false;
      lastMove.current = performance.now();
    }
    pointers.current.set(e.pointerId, project({ x: e.clientX, y: e.clientY }));
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: ReactPointerEvent) => {
    const old = pointers.current.get(e.pointerId);
    if (!old) return;
    const before = [...pointers.current.values()],
      now = project({ x: e.clientX, y: e.clientY });
    pointers.current.set(e.pointerId, now);
    if (
      origin.current &&
      passedDragThreshold(origin.current, { x: e.clientX, y: e.clientY })
    )
      dragged.current = true;
    if (pointers.current.size === 2) {
      dragged.current = true;
      velocity.current = { x: 0, y: 0 };
      const r = element.current!.getBoundingClientRect(),
        world = element.current!.querySelector<HTMLElement>(".board-world")!;
      target.current = pinchView(
        target.current,
        before,
        [...pointers.current.values()],
        { x: r.left + world.offsetLeft, y: r.top + world.offsetTop },
      );
      raw.current = { x: target.current.x, y: target.current.y };
      wake();
    } else if (dragged.current) {
      const time = performance.now(),
        dt = Math.max(8, Math.min(80, time - lastMove.current));
      const dx = now.x - old.x,
        dy = now.y - old.y,
        bounds = limits();
      velocity.current = {
        x: Math.max(
          -cameraPhysics.maxSpeed,
          Math.min(
            cameraPhysics.maxSpeed,
            velocity.current.x * 0.35 + (dx / dt) * 650,
          ),
        ),
        y: Math.max(
          -cameraPhysics.maxSpeed,
          Math.min(
            cameraPhysics.maxSpeed,
            velocity.current.y * 0.35 + (dy / dt) * 650,
          ),
        ),
      };
      lastMove.current = time;
      raw.current = { x: raw.current.x + dx, y: raw.current.y + dy };
      target.current = {
        ...target.current,
        x: rubberBand(raw.current.x, bounds.x),
        y: rubberBand(raw.current.y, bounds.y),
      };
      wake();
    }
  };
  const up = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    const canceled =
      e.type === "pointercancel" || e.type === "lostpointercapture";
    if (canceled) dragged.current = true;
    if (
      canceled ||
      performance.now() - lastMove.current > 90 ||
      matchMedia("(prefers-reduced-motion:reduce)").matches ||
      pointers.current.size
    )
      velocity.current = { x: 0, y: 0 };
    if (!pointers.current.size) {
      const b = limits();
      target.current = {
        ...target.current,
        x: Math.max(-b.x, Math.min(b.x, target.current.x)),
        y: Math.max(-b.y, Math.min(b.y, target.current.y)),
      };
      wake();
    }
  };
  const click = (e: MouseEvent) => {
    if (e.detail === 0) return;
    if (dragged.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const node = element.current!;
    if (!node.closest(".gpu-active")) return;
    const p = project({ x: e.clientX, y: e.clientY });
    const buttons = [
      ...node.querySelectorAll<HTMLButtonElement>(
        ".identity-trigger,.project-card",
      ),
    ];
    const found = buttons.find((b) => {
      const r = b.getBoundingClientRect();
      return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
    });
    const original = (e.target as HTMLElement).closest("button");
    if (found !== original) {
      e.preventDefault();
      e.stopPropagation();
      found?.click();
    }
  };
  return {
    element,
    view,
    setView,
    dragged,
    handlers: {
      onPointerDown: down,
      onPointerMove: move,
      onPointerUp: up,
      onPointerCancel: up,
      onLostPointerCapture: up,
      onClickCapture: click,
    },
    zoom,
  };
}
