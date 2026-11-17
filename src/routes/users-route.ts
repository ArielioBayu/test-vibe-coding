import { Elysia, t } from "elysia";
import {
  usersService,
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UnauthorizedError,
} from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        await usersService.registerUser(body);
        set.status = 201;
        return { data: "OK" };
      } catch (error) {
        if (
          error instanceof UserAlreadyExistsError ||
          (error instanceof Error && error.message === "Email sudah terdaftar")
        ) {
          set.status = 400;
          return { error: "Email sudah terdaftar" };
        }

        const errMessage = error instanceof Error ? error.message : String(error);
        if (errMessage.includes("Duplicate entry") || errMessage.includes("ER_DUP_ENTRY")) {
          set.status = 400;
          return { error: "Email sudah terdaftar" };
        }

        set.status = 500;
        return {
          error: "Terjadi kesalahan pada server",
          details: errMessage,
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const { token } = await usersService.loginUser(body);
        set.status = 200;
        return { data: token };
      } catch (error) {
        if (
          error instanceof InvalidCredentialsError ||
          (error instanceof Error && error.message === "Email atau password salah")
        ) {
          set.status = 400;
          return { error: "Email atau password salah" };
        }

        const errMessage = error instanceof Error ? error.message : String(error);
        set.status = 500;
        return {
          error: "Terjadi kesalahan pada server",
          details: errMessage,
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    "/current",
    async ({ headers, set }) => {
      try {
        const authHeader = headers["authorization"] || headers["Authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const token = authHeader.slice(7).trim();
        if (!token) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const user = await usersService.getCurrentUser(token);
        set.status = 200;
        return { data: user };
      } catch (error) {
        if (
          error instanceof UnauthorizedError ||
          (error instanceof Error && error.message === "Unauthorized")
        ) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const errMessage = error instanceof Error ? error.message : String(error);
        set.status = 500;
        return {
          error: "Terjadi kesalahan pada server",
          details: errMessage,
        };
      }
    }
  )
  .delete(
    "/logout",
    async ({ headers, set }) => {
      try {
        const authHeader = headers["authorization"] || headers["Authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const token = authHeader.slice(7).trim();
        if (!token) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        await usersService.logoutUser(token);
        set.status = 200;
        return { data: "OK" };
      } catch (error) {
        if (
          error instanceof UnauthorizedError ||
          (error instanceof Error && error.message === "Unauthorized")
        ) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const errMessage = error instanceof Error ? error.message : String(error);
        set.status = 500;
        return {
          error: "Terjadi kesalahan pada server",
          details: errMessage,
        };
      }
    }
  );
