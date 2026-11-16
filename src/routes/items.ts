import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { items } from "../db/schema";

export const itemRoutes = new Elysia({ prefix: "/items" })
  .get("/", async () => {
    try {
      const allItems = await db.select().from(items);
      return { success: true, data: allItems };
    } catch (error) {
      return {
        success: false,
        message: "Failed to fetch items from database. Ensure MySQL is running.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await db.insert(items).values({
          name: body.name,
          description: body.description,
        });
        set.status = 201;
        return { success: true, message: "Item created successfully", data: result };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to create item in database. Ensure MySQL is running.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
      }),
    }
  )
  .get("/:id", async ({ params: { id }, set }) => {
    try {
      const parsedId = Number(id);
      if (isNaN(parsedId)) {
        set.status = 400;
        return { success: false, message: "Invalid ID" };
      }
      const [foundItem] = await db.select().from(items).where(eq(items.id, parsedId)).limit(1);
      if (!foundItem) {
        set.status = 404;
        return { success: false, message: "Item not found" };
      }
      return { success: true, data: foundItem };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        message: "Failed to fetch item. Ensure MySQL is running.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
