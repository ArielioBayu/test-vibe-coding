import { Elysia } from "elysia";
import { itemRoutes } from "./routes/items";
import { usersRoute } from "./routes/users-route";

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .get("/", () => ({
    status: "ok",
    message: "Server is running smoothly with Elysia, Drizzle, and MySQL!",
    timestamp: new Date().toISOString(),
  }))
  .use(itemRoutes)
  .use(usersRoute);

if (import.meta.main) {
  app.listen(port);
  console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
}

export type App = typeof app;
