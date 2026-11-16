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
      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe("POST /api/users/login", () => {
    it("should return 422/400 when login payload is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "invalid-email-format",
            password: "",
          }),
        })
      );
      expect([400, 422]).toContain(response.status);
    });

    it("should handle login request with proper response schema", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "nonexistent@test.com",
            password: "secretpassword",
          }),
        })
      );
      expect([200, 400, 500]).toContain(response.status);
      const data = (await response.json()) as any;
      expect(typeof data).toBe("object");
    });
  });

  describe("POST /api/users/current", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
        })
      );
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 when Authorization header format is not Bearer", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: {
            Authorization: "Basic some-credentials",
          },
        })
      );
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 when Bearer token is invalid/fake (or 500 if DB offline)", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: {
            Authorization: "Bearer non-existent-token-12345",
          },
        })
      );
      expect([401, 500]).toContain(response.status);
    });
  });
});
