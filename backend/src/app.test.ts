import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "./app.js";
import type { PortfolioRepository } from "./repositories/portfolio.js";
test("API serves content, validates IDs and returns consistent errors", async () => {
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    assert.deepEqual(await (await fetch(base + "/api/health")).json(), {
      status: "ok",
    });
    const profile = await (await fetch(base + "/api/profile")).json();
    assert.equal(profile.name, "Ayush");
    const response = await fetch(base + "/api/projects", {
      headers: { Origin: "http://localhost:5178" },
    });
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:5178",
    );
    const denied = await fetch(base + "/api/projects", {
      headers: { Origin: "https://unconfigured.example" },
    });
    assert.equal(denied.headers.get("access-control-allow-origin"), null);
    const projects = await response.json();
    assert.equal(projects.length, 3);
    for (const p of projects) {
      assert(p.sample);
      assert.equal(
        (await (await fetch(base + "/api/projects/" + p.id)).json()).title,
        p.title,
      );
    }
    for (const [path, status, code] of [
      ["/api/projects/INVALID!", 400, "INVALID_ID"],
      ["/api/projects/missing", 404, "NOT_FOUND"],
      ["/api/missing", 404, "NOT_FOUND"],
    ] as const) {
      const r = await fetch(base + path);
      assert.equal(r.status, status);
      assert.equal((await r.json()).error.code, code);
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
test("repository failures do not expose internal details", async () => {
  const repository: PortfolioRepository = {
    read: async () => {
      throw new Error("private file path");
    },
  };
  const server = createApp(repository).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  try {
    const r = await fetch(`http://127.0.0.1:${address.port}/api/projects`);
    assert.equal(r.status, 500);
    assert.deepEqual(await r.json(), {
      error: {
        code: "INTERNAL_ERROR",
        message: "The broadcast is temporarily unavailable.",
      },
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
