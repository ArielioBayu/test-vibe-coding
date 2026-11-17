import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { clearDatabase } from "./test-helper";

describe("Health Check API - GET /", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("should return 200 OK with server health info", async () => {
    const response = await app.handle(new Request("http://localhost:3000/"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      message: string;
      timestamp: string;
    };

    expect(body.status).toBe("ok");
    expect(body.message).toContain("Elysia");
    expect(body.timestamp).toBeDefined();
  });
});
