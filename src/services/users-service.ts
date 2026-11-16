import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, type NewUser } from "../db/schema";

export class UserAlreadyExistsError extends Error {
  constructor(message: string = "Email sudah terdaftar") {
    super(message);
    this.name = "UserAlreadyExistsError";
  }
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class UsersService {
  /**
   * Mendaftarkan pengguna baru dengan email unik dan password ter-hash bcrypt.
   */
  async registerUser(input: RegisterUserInput) {
    const { name, email, password } = input;

    // 1. Cek apakah email sudah terdaftar
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      throw new UserAlreadyExistsError("Email sudah terdaftar");
    }

    // 2. Hash password menggunakan bcrypt bawaan Bun
    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // 3. Simpan data user ke database MySQL
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return { success: true };
  }
}

export const usersService = new UsersService();
