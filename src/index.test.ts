import { describe, expect, it } from "bun:test";
import { app } from "./index";

describe("Elysia App", () => {
  it("should return 200 and greeting on GET /", async () => {
    const response = await app.handle(new Request("http://localhost:3000/"));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.message).toContain("Elysia");
  });

  it("should handle GET /items route", async () => {
    const response = await app.handle(new Request("http://localhost:3000/items"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(typeof data).toBe("object");
  });
});
