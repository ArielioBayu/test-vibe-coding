import { describe, expect, it } from "bun:test";
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
} from "./users-service";

describe("UsersService", () => {
  it("should correctly hash passwords with bcrypt using Bun.password.hash", async () => {
    const plain = "mySecretPassword123";
    const hash = await Bun.password.hash(plain, {
      algorithm: "bcrypt",
      cost: 10,
    });

    expect(hash.startsWith("$2b$") || hash.startsWith("$2a$")).toBe(true);

    const isMatch = await Bun.password.verify(plain, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await Bun.password.verify("wrongPassword", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("should throw UserAlreadyExistsError with message 'Email sudah terdaftar'", () => {
    const error = new UserAlreadyExistsError();
    expect(error.message).toBe("Email sudah terdaftar");
    expect(error.name).toBe("UserAlreadyExistsError");
  });

  it("should throw InvalidCredentialsError with message 'Email atau password salah'", () => {
    const error = new InvalidCredentialsError();
    expect(error.message).toBe("Email atau password salah");
    expect(error.name).toBe("InvalidCredentialsError");
  });

  it("should generate valid UUID token for sessions", () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toBeDefined();
    expect(uuid.length).toBe(36);
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        uuid
      )
    ).toBe(true);
  });
});
