import { describe, expect, it, spyOn } from "bun:test";
import { app } from "./index";
import {
  usersService,
  UnauthorizedError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
} from "./services/users-service";

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
    it("should return 422 when request body is invalid", async () => {
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
      expect(response.status).toBe(422);
    });

    it("should return 201 with data OK when registration is successful", async () => {
      const spy = spyOn(usersService, "registerUser").mockResolvedValue({
        success: true,
      });

      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bayu",
            email: "bayu@gmail.com",
            password: "secretpassword",
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { data: string };
      expect(data).toEqual({ data: "OK" });

      spy.mockRestore();
    });

    it("should return 400 when email already exists", async () => {
      const spy = spyOn(usersService, "registerUser").mockRejectedValue(
        new UserAlreadyExistsError("Email sudah terdaftar")
      );

      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bayu",
            email: "bayu@gmail.com",
            password: "secretpassword",
          }),
        })
      );

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data).toEqual({ error: "Email sudah terdaftar" });

      spy.mockRestore();
    });
  });

  describe("POST /api/users/login", () => {
    it("should return 422 when login payload is invalid", async () => {
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
      expect(response.status).toBe(422);
    });

    it("should return 200 with token when login credentials are valid", async () => {
      const mockToken = "12345678-1234-1234-1234-123456789abc";
      const spy = spyOn(usersService, "loginUser").mockResolvedValue({
        token: mockToken,
      });

      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "bayu@gmail.com",
            password: "secretpassword",
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as { data: string };
      expect(data).toEqual({ data: mockToken });

      spy.mockRestore();
    });

    it("should return 400 when login credentials are invalid", async () => {
      const spy = spyOn(usersService, "loginUser").mockRejectedValue(
        new InvalidCredentialsError("Email atau password salah")
      );

      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "wrong@test.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data).toEqual({ error: "Email atau password salah" });

      spy.mockRestore();
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
      expect(data).toEqual({ error: "Unauthorized" });
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
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 401 with expected error body when Bearer token is invalid/fake", async () => {
      const spy = spyOn(usersService, "getCurrentUser").mockRejectedValue(
        new UnauthorizedError("Unauthorized")
      );

      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: {
            Authorization: "Bearer non-existent-token-12345",
          },
        })
      );

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data).toEqual({ error: "Unauthorized" });

      spy.mockRestore();
    });

    it("should return 200 with user profile when token is valid", async () => {
      const mockUser = {
        id: 1,
        name: "Bayu",
        email: "bayu@gmail.com",
        created_at: new Date("2026-11-16T18:00:00.000Z"),
      };
      const spy = spyOn(usersService, "getCurrentUser").mockResolvedValue(mockUser);

      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: {
            Authorization: "Bearer valid-token-uuid-123",
          },
        })
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as { data: typeof mockUser };
      expect(data.data.name).toBe("Bayu");
      expect(data.data.email).toBe("bayu@gmail.com");

      spy.mockRestore();
    });
  });

  describe("DELETE /api/users/logout", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 401 when Authorization header format is not Bearer", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Basic some-credentials",
          },
        })
      );
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 401 with expected error body when Bearer token is invalid/fake", async () => {
      const spy = spyOn(usersService, "logoutUser").mockRejectedValue(
        new UnauthorizedError("Unauthorized")
      );

      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer non-existent-token-12345",
          },
        })
      );

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data).toEqual({ error: "Unauthorized" });

      spy.mockRestore();
    });

    it("should return 200 with data OK when logout is successful", async () => {
      const spy = spyOn(usersService, "logoutUser").mockResolvedValue({
        success: true,
      });

      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-token-uuid-123",
          },
        })
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as { data: string };
      expect(data).toEqual({ data: "OK" });

      spy.mockRestore();
    });
  });
});
