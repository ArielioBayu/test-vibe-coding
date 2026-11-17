import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { clearDatabase } from "./test-helper";

describe("Users API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /api/users (Registration)", () => {
    it("should register new user successfully with hashed password", async () => {
      const payload = {
        name: "Bayu Aji",
        email: "bayu.register@gmail.com",
        password: "secretpassword123",
      };

      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );
      expect(response.status).toBe(201);

      const body = (await response.json()) as { data: string };
      expect(body.data).toBe("OK");

      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, payload.email));

      expect(savedUser).toBeDefined();
      expect(savedUser!.name).toBe(payload.name);
      expect(savedUser!.email).toBe(payload.email);
      expect(savedUser!.password).not.toBe(payload.password);
      expect(savedUser!.password.startsWith("$2b$") || savedUser!.password.startsWith("$2a$")).toBe(true);

      const isPasswordMatch = await Bun.password.verify(payload.password, savedUser!.password);
      expect(isPasswordMatch).toBe(true);
    });

    it("should reject registration when email already exists", async () => {
      const payload = {
        name: "Bayu",
        email: "duplicate@gmail.com",
        password: "password123",
      };

      const firstResponse = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );
      expect(firstResponse.status).toBe(201);

      const secondResponse = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );
      expect(secondResponse.status).toBe(400);

      const body = (await secondResponse.json()) as { error: string };
      expect(body.error).toBe("Email sudah terdaftar");
    });

    it("should reject registration with invalid email format", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bayu",
            email: "not-an-email-format",
            password: "password123",
          }),
        })
      );
      expect(response.status).toBe(422);
    });

    it("should reject registration with empty or missing name", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "",
            email: "valid@gmail.com",
            password: "password123",
          }),
        })
      );
      expect(response.status).toBe(422);
    });

    it("should reject registration with empty or missing password", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bayu",
            email: "valid@gmail.com",
            password: "",
          }),
        })
      );
      expect(response.status).toBe(422);
    });

    it("should reject registration with empty body", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );
      expect(response.status).toBe(422);
    });

    it("should reject registration when name exceeds 255 characters", async () => {
      const longName = "A".repeat(300);
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longName,
            email: "boundary@gmail.com",
            password: "password123",
          }),
        })
      );
      expect(response.status).toBe(422);

      const allUsers = await db.select().from(users);
      expect(allUsers.length).toBe(0);
    });
  });

  describe("POST /api/users/login (Login)", () => {
    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bayu Login",
            email: "bayu.login@gmail.com",
            password: "correctpassword",
          }),
        })
      );
    });

    it("should login successfully with valid credentials and store token in sessions", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "bayu.login@gmail.com",
            password: "correctpassword",
          }),
        })
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as { data: string };
      expect(body.data).toBeDefined();
      expect(body.data.length).toBe(36);

      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, body.data));
      expect(session).toBeDefined();
      expect(session!.token).toBe(body.data);
    });

    it("should allow multi-session login for the same user with distinct tokens", async () => {
      const res1 = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "bayu.login@gmail.com",
            password: "correctpassword",
          }),
        })
      );
      const { data: token1 } = (await res1.json()) as { data: string };

      const res2 = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "bayu.login@gmail.com",
            password: "correctpassword",
          }),
        })
      );
      const { data: token2 } = (await res2.json()) as { data: string };

      expect(token1).not.toBe(token2);

      const allSessions = await db.select().from(sessions);
      expect(allSessions.length).toBe(2);
    });

    it("should reject login when email is not registered", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "unregistered@gmail.com",
            password: "correctpassword",
          }),
        })
      );
      expect(response.status).toBe(400);

      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Email atau password salah");
    });

    it("should reject login when password is wrong", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "bayu.login@gmail.com",
            password: "wrongpassword123",
          }),
        })
      );
      expect(response.status).toBe(400);

      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Email atau password salah");
    });

    it("should reject login with invalid payload format", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "not-an-email",
            password: "",
          }),
        })
      );
      expect(response.status).toBe(422);
    });
  });

  describe("POST /api/users/current (Get Current User)", () => {
    let validToken: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Current User Profile",
            email: "current@gmail.com",
            password: "password123",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "current@gmail.com",
            password: "password123",
          }),
        })
      );
      const body = (await loginRes.json()) as { data: string };
      validToken = body.data;
    });

    it("should return user profile without password when token is valid", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as { data: any };
      expect(body.data).toBeDefined();
      expect(body.data.name).toBe("Current User Profile");
      expect(body.data.email).toBe("current@gmail.com");
      expect(body.data.created_at).toBeDefined();
      expect(body.data.password).toBeUndefined();
    });

    it("should return 401 when Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
        })
      );
      expect(response.status).toBe(401);

      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when Authorization header format is not Bearer", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: {
            Authorization: `Basic ${validToken}`,
          },
        })
      );
      expect(response.status).toBe(401);

      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when Bearer token is invalid / fake", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: {
            Authorization: "Bearer fake-token-uuid-00000000",
          },
        })
      );
      expect(response.status).toBe(401);

      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when token has been logged out", async () => {
      await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );

      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        })
      );
      expect(response.status).toBe(401);

      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("DELETE /api/users/logout (Logout)", () => {
    let tokenA: string;
    let tokenB: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Logout User",
            email: "logout@gmail.com",
            password: "password123",
          }),
        })
      );

      const resA = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@gmail.com",
            password: "password123",
          }),
        })
      );
      tokenA = ((await resA.json()) as { data: string }).data;

      const resB = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@gmail.com",
            password: "password123",
          }),
        })
      );
      tokenB = ((await resB.json()) as { data: string }).data;
    });

    it("should logout successfully and remove session from database", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenA}`,
          },
        })
      );
      expect(response.status).toBe(200);

      const body = (await response.json()) as { data: string };
      expect(body.data).toBe("OK");

      const [deletedSession] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, tokenA));
      expect(deletedSession).toBeUndefined();
    });

    it("should not invalidate other active sessions when logging out", async () => {
      const logoutRes = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenA}`,
          },
        })
      );
      expect(logoutRes.status).toBe(200);

      const currentRes = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenB}`,
          },
        })
      );
      expect(currentRes.status).toBe(200);

      const currentBody = (await currentRes.json()) as { data: any };
      expect(currentBody.data.email).toBe("logout@gmail.com");
    });

    it("should return 401 when Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(401);

      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when Authorization header format is not Bearer", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Basic some-token",
          },
        })
      );
      expect(response.status).toBe(401);

      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when token is fake / non-existent", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer non-existent-token-12345",
          },
        })
      );
      expect(response.status).toBe(401);

      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when attempting to logout twice with the same token", async () => {
      const firstLogout = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenA}`,
          },
        })
      );
      expect(firstLogout.status).toBe(200);

      const secondLogout = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenA}`,
          },
        })
      );
      expect(secondLogout.status).toBe(401);

      const body = (await secondLogout.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
    });
  });
});
