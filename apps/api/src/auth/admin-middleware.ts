import { bearerAuth } from "hono/bearer-auth";

export const adminMiddleware = bearerAuth({
  verifyToken: async (token, c) => {
    return token === c.env.ADMIN_AUTH_TOKEN;
  },
});
