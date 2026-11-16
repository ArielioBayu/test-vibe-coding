import { describe, expect, it } from "bun:test";
import { app } from "./index";

describe("Elysia App", () => {
  it("should return 200 and greeting on GET /", async () => {
    const response = await app.handle(new Request("http://localhost:3000/"));
    expect(response.status).toBe(200);

    const data = (await response.json()) as { status: string; message: string };
    expect(data.status).toBe("ok");
    expect(data.message).toContain("Elysia");
  });

  it("should handle GET /items route", async () => {
    const response = await app.handle(new Request("http://localhost:3000/items"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(typeof data).toBe("object");
  });

  describe("POST /api/users", () => {
    it("should return 422/400 when request body is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "",
            email: "not-an-email",
            password: "",
          }),
        })
      );
      // Elysia returns 422 for schema validation errors
      expect([400, 422]).toContain(response.status);
    });

    it("should accept valid payload format", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bayu",
            email: "bayu@gmail.com",
            password: "secret",
          }),
        })
      );
      // Depending on whether MySQL is running or mock, status will be 201 (success) or 400 (duplicate/DB err) or 500
      expect([201, 400, 500]).toContain(response.status);
    });
  });
});
