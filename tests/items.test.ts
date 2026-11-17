import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { items } from "../src/db/schema";
import { clearDatabase } from "./test-helper";

describe("Items API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("GET /items", () => {
    it("should return empty array when database has no items", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/items")
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        success: boolean;
        data: any[];
      };
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(0);
    });

    it("should return all items when database has data", async () => {
      await db.insert(items).values([
        { name: "Item 1", description: "Desc 1" },
        { name: "Item 2", description: "Desc 2" },
      ]);

      const response = await app.handle(
        new Request("http://localhost:3000/items")
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        success: boolean;
        data: any[];
      };
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(2);
      expect(body.data[0].name).toBe("Item 1");
      expect(body.data[1].name).toBe("Item 2");
    });
  });

  describe("POST /items", () => {
    it("should create item successfully with complete payload", async () => {
      const payload = {
        name: "Mechanical Keyboard",
        description: "Hot-swappable tactile switch keyboard",
      };

      const response = await app.handle(
        new Request("http://localhost:3000/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );
      expect(response.status).toBe(201);

      const body = (await response.json()) as {
        success: boolean;
        message: string;
      };
      expect(body.success).toBe(true);
      expect(body.message).toContain("created successfully");

      const savedItems = await db.select().from(items);
      expect(savedItems.length).toBe(1);
      expect(savedItems[0]!.name).toBe(payload.name);
      expect(savedItems[0]!.description).toBe(payload.description);
    });

    it("should create item successfully without optional description", async () => {
      const payload = {
        name: "Item without description",
      };

      const response = await app.handle(
        new Request("http://localhost:3000/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );
      expect(response.status).toBe(201);

      const body = (await response.json()) as { success: boolean };
      expect(body.success).toBe(true);

      const savedItems = await db.select().from(items);
      expect(savedItems.length).toBe(1);
      expect(savedItems[0]!.name).toBe(payload.name);
      expect(savedItems[0]!.description).toBeNull();
    });

    it("should reject creation when name is empty", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "" }),
        })
      );
      expect(response.status).toBe(422);

      const savedItems = await db.select().from(items);
      expect(savedItems.length).toBe(0);
    });

    it("should reject creation when name exceeds 255 characters", async () => {
      const longName = "A".repeat(300);
      const response = await app.handle(
        new Request("http://localhost:3000/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: longName }),
        })
      );
      expect(response.status).toBe(422);

      const savedItems = await db.select().from(items);
      expect(savedItems.length).toBe(0);
    });

    it("should reject creation when request body is empty / invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );
      expect(response.status).toBe(422);
    });
  });

  describe("GET /items/:id", () => {
    it("should return item detail when ID exists", async () => {
      await db.insert(items).values({
        name: "Specific Item",
        description: "Detail of specific item",
      });

      const [inserted] = await db.select().from(items).limit(1);
      expect(inserted).toBeDefined();

      const response = await app.handle(
        new Request(`http://localhost:3000/items/${inserted!.id}`)
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        success: boolean;
        data: any;
      };
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(inserted!.id);
      expect(body.data.name).toBe("Specific Item");
    });

    it("should return 404 when item ID is not found", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/items/999999")
      );
      expect(response.status).toBe(404);

      const body = (await response.json()) as {
        success: boolean;
        message: string;
      };
      expect(body.success).toBe(false);
      expect(body.message).toBe("Item not found");
    });

    it("should return 400 when item ID is non-numeric", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/items/invalid-id")
      );
      expect(response.status).toBe(400);

      const body = (await response.json()) as {
        success: boolean;
        message: string;
      };
      expect(body.success).toBe(false);
      expect(body.message).toBe("Invalid ID");
    });
  });
});
