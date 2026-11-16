# Feature Plan: Get Current User API (`POST /api/users/current`)

## 1. Ringkasan Fitur
Implementasi endpoint API untuk mengambil data profil pengguna yang sedang login berdasarkan token sesi aktif. Token dikirim melalui header HTTP `Authorization: Bearer <token>`, dicocokkan dengan data pada tabel `sessions`, lalu mengambil informasi user terkait dari tabel `users` (tanpa menyertakan hash password demi keamanan).

Implementasi harus memisahkan antara layer **Routing** (`routes`) dan layer **Business Logic** (`services`).

---

## 2. Spesifikasi Teknis

### A. Spesifikasi Endpoint
- **URL**: `/api/users/current`
- **Method**: `POST`
- **Headers Wajib**:
  - `Authorization: Bearer <token>` (token UUID sesi login yang tersimpan di tabel `sessions`)

### B. Format Request & Response

#### 1. Request
Tidak memerlukan request body (atau body opsional kosong). Identifikasi user sepenuhnya dilakukan melalui header `Authorization`.

#### 2. Response Sukses (Status Code: `200 OK`)
Mengembalikan data profil pengguna (ID, Nama, Email, Waktu Dibuat). **PENTING**: Kolom `password` TIDAK BOLEH dikembalikan!
```json
{
  "data": {
    "id": 1,
    "name": "Bayu",
    "email": "bayu@gmail.com",
    "created_at": "2026-11-16T18:00:00.000Z"
  }
}
```

#### 3. Response Error (Status Code: `401 Unauthorized`)
Jika header `Authorization` tidak dikirim, format token tidak valid, atau token tidak ditemukan di tabel `sessions`:
```json
{
  "error": "Unauthorized"
}
```

---

## 3. Konvensi Struktur Folder & Penamaan File

Gunakan struktur folder yang sudah ada di direktori `src/`:

```text
src/
├── services/
│   ├── users-service.ts       # Tambahkan method getCurrentUser(token) & UnauthorizedError
│   └── users-service.test.ts  # Unit test untuk UnauthorizedError & session logic
├── routes/
│   └── users-route.ts         # Tambahkan route POST /current di sini
├── index.ts                   # Entry point server ElysiaJS
└── index.test.ts              # Integration test endpoint POST /api/users/current
```

> **Aturan Penamaan File**:
> - File routing menggunakan format `*-route.ts` (`src/routes/users-route.ts`).
> - File service menggunakan format `*-service.ts` (`src/services/users-service.ts`).

---

## 4. Panduan Langkah Implementasi (Step-by-Step)

### Langkah 1: Tambahkan Logic di Service Layer (`src/services/users-service.ts`)
1. Buka file `src/services/users-service.ts`.
2. Buat class error khusus untuk autentikasi gagal:
   ```ts
   export class UnauthorizedError extends Error {
     constructor(message: string = "Unauthorized") {
       super(message);
       this.name = "UnauthorizedError";
     }
   }
   ```
3. Tambahkan method `getCurrentUser(token: string)` ke dalam class `UsersService`:
   - **Cari Session**: Query ke tabel `sessions` berdasarkan kolom `token`:
     ```ts
     const [session] = await db
       .select()
       .from(sessions)
       .where(eq(sessions.token, token))
       .limit(1);
     ```
   - **Validasi Session**: Jika session tidak ditemukan, throw `new UnauthorizedError("Unauthorized")`.
   - **Ambil Data User**: Query ke tabel `users` berdasarkan `session.userId`:
     ```ts
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
     ```
   - **Validasi User**: Jika user tidak ditemukan, throw `new UnauthorizedError("Unauthorized")`.
   - **Return Data**: Kembalikan object data user yang aman (tanpa password).

### Langkah 2: Tambahkan Endpoint di Route Layer (`src/routes/users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Import `UnauthorizedError` dari `../services/users-service`.
3. Tambahkan route handler `POST /current` pada `usersRoute` (karena prefix-nya `/api/users`, maka URL lengkapnya adalah `/api/users/current`):
   ```ts
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
   ```

### Langkah 3: Pengujian & Verifikasi
1. **Typecheck**:
   ```bash
   bun run typecheck
   ```
   Pastikan tidak ada error tipe TypeScript.
2. **Automated Testing**:
   - Di `src/services/users-service.test.ts`: Uji bahwa `UnauthorizedError` memiliki message `"Unauthorized"`.
   - Di `src/index.test.ts`:
     - Uji request tanpa header `Authorization` $\rightarrow$ pastikan respons status `401` dengan `{ "error": "Unauthorized" }`.
     - Uji request dengan token palsu / tidak valid $\rightarrow$ pastikan respons status `401` dengan `{ "error": "Unauthorized" }`.
   - Jalankan:
     ```bash
     bun test
     ```
3. **Manual Testing**:
   - Jalankan server `bun run dev`.
   - Lakukan login ke `POST /api/users/login` untuk mendapatkan token.
   - Kirim request `POST /api/users/current` dengan header `Authorization: Bearer <token_dari_login>`.
   - Pastikan response mengembalikan data user (id, name, email, created_at) dan tidak ada kolom password.

---

## 5. Acceptance Criteria (Kriteria Keberhasilan)
- [ ] Terdapat class `UnauthorizedError` dan method `getCurrentUser(token)` di `src/services/users-service.ts`.
- [ ] Method `getCurrentUser` mencari token di tabel `sessions` dan merelasikannya ke tabel `users`.
- [ ] Endpoint `POST /api/users/current` terdaftar di `src/routes/users-route.ts`.
- [ ] Endpoint mengekstrak token dari header `Authorization: Bearer <token>`.
- [ ] Jika token valid, endpoint mengembalikan status 200 dengan format `{ "data": { "id", "name", "email", "created_at" } }` tanpa menyertakan password.
- [ ] Jika header tidak ada, format salah, atau token tidak valid, endpoint mengembalikan status 401 dengan format `{ "error": "Unauthorized" }`.
- [ ] `bun run typecheck` dan `bun test` berjalan sukses tanpa error.
