import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions, type NewUser } from "../db/schema";

export class UserAlreadyExistsError extends Error {
  constructor(message: string = "Email sudah terdaftar") {
    super(message);
    this.name = "UserAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message: string = "Email atau password salah") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
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

  /**
   * Mengautentikasi pengguna dan membuat sesi login baru (UUID token).
   */
  async loginUser(input: LoginUserInput) {
    const { email, password } = input;

    // 1. Cari pengguna berdasarkan email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new InvalidCredentialsError("Email atau password salah");
    }

    // 2. Verifikasi password dengan hash bcrypt
    const isPasswordValid = await Bun.password.verify(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError("Email atau password salah");
    }

    // 3. Generate token UUID
    const token = crypto.randomUUID();

    // 4. Simpan session ke database MySQL
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return { token };
  }

  /**
   * Mengambil data profil pengguna yang sedang login berdasarkan token session.
   */
  async getCurrentUser(token: string) {
    // 1. Cari session berdasarkan token
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (!session) {
      throw new UnauthorizedError("Unauthorized");
    }

    // 2. Cari data user berdasarkan user_id di session (password tidak disertakan)
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        created_at: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError("Unauthorized");
    }

    return user;
  }

  /**
   * Menghapus sesi login pengguna berdasarkan token (logout).
   */
  async logoutUser(token: string) {
    // 1. Cek apakah session ada di database
    const [session] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (!session) {
      throw new UnauthorizedError("Unauthorized");
    }

    // 2. Hapus session dari tabel sessions
    await db.delete(sessions).where(eq(sessions.token, token));

    return { success: true };
  }
}

export const usersService = new UsersService();
