# Feature Plan: Login User & Session Management (Users API)

## 1. Ringkasan Fitur
Implementasi fitur autentikasi user (login) dan pembuatan sesi pengguna dengan token berbasis **UUID**. Fitur ini mencakup penambahan tabel `sessions` di database MySQL menggunakan **Drizzle ORM**, validasi password dengan **bcrypt** via runtime **Bun**, serta eksposur endpoint login menggunakan framework **ElysiaJS**.

Implementasi harus memisahkan antara layer **Routing** (`routes`) dan layer **Business Logic** (`services`).

---

## 2. Spesifikasi Teknis

### A. Skema Tabel Database (`sessions`)
Tambahkan tabel `sessions` pada file `src/db/schema.ts` dengan kolom berikut:
- `id`: Integer, auto increment, primary key (`int("id").autoincrement().primaryKey()`).
- `token`: VARCHAR(255), NOT NULL, UNIQUE (berisi UUID token login).
- `user_id`: Integer, NOT NULL, Foreign Key merujuk ke kolom `users.id` (`references(() => users.id)`).
- `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP (`timestamp("created_at").defaultNow().notNull()`).

### B. Spesifikasi Endpoint Login
- **URL**: `/api/users/login`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "email": "bayu@gmail.com",
  "password": "secret"
}
```

#### Response Body & Status Code

**1. Sukses (Status Code: `200 OK`)**
Mengembalikan token UUID yang berhasil dibuat dan disimpan:
```json
{
  "data": "a50c82fb-6d60-449e-ba63-df691456d396"
}
```

**2. Error - Email atau Password Salah (Status Code: `400 Bad Request` atau `401 Unauthorized`)**
Mengembalikan pesan error seragam (untuk alasan keamanan, pesan kesalahan tidak membedakan email tidak ditemukan vs password salah):
```json
{
  "error": "Email atau password salah"
}
```

**3. Error - Validasi Input (Status Code: `400 Bad Request` / `422 Unprocessable Entity`)**
Mengembalikan pesan validasi jika field `email` tidak valid atau `password` kosong.

---

## 3. Konvensi Struktur Folder & Penamaan File

Tetap pertahankan arsitektur modular di direktori `src/`:

```text
src/
├── db/
│   ├── index.ts          # Koneksi Drizzle ke MySQL
│   └── schema.ts         # Tambahkan skema tabel sessions di sini
├── services/
│   ├── users-service.ts  # Tambahkan method loginUser() & logic session di sini
│   └── users-service.test.ts # Unit test login & hashing
├── routes/
│   └── users-route.ts    # Tambahkan handler POST /login di sini
├── index.ts              # Entry point utama server ElysiaJS
└── index.test.ts         # Integration test endpoint API
```

> **Aturan Penamaan File**:
> - File routing menggunakan format `*-route.ts` (misal: `src/routes/users-route.ts`).
> - File service menggunakan format `*-service.ts` (misal: `src/services/users-service.ts`).
