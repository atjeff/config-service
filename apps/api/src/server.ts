import type ConfigService from "@repo/config-service/src/server";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { adminMiddleware } from "./auth/admin-middleware";

export type ENV = {
  CONFIG_SERVICE: Service<ConfigService>;
};

const app = new Hono<{ Bindings: ENV }>();

app.use(secureHeaders(), adminMiddleware);

// Endpoint to get site-wide stats
app.get("/:key", async (c) => {
  const key = c.req.param("key");
  const result = c.env.CONFIG_SERVICE.get(key);

  if (!result) {
    return c.json({ error: "Key not found" }, { status: 404 });
  }

  return c.json({ key, value: result.val });
});

app.put("/:key", async (c) => {
  const key = c.req.param("key");
  const value = await c.req.json();

  const result = await c.env.CONFIG_SERVICE.set(key, value);

  if (result.err) {
    return c.json({ error: result.err }, { status: 500 });
  }

  return c.json({ key, value: result.val });
});

app.delete("/:key", async (c) => {
  const key = c.req.param("key");

  const result = await c.env.CONFIG_SERVICE.delete(key);

  if (result.err) {
    return c.json({ error: result.err }, { status: 500 });
  }

  return c.json({ key });
});

export default app;
