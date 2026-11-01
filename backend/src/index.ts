import { createApp } from "./app.js";
import { env } from "./config/env.js";
createApp().listen(env.port, env.host, () =>
  console.log(`Portfolio API http://${env.host}:${env.port}`),
);
