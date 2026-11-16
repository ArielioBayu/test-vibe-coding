# Feature Plan: Registrasi User Baru (Users API)

## 1. Ringkasan Fitur
Implementasi fitur registrasi user baru dengan penyimpanan data ke database MySQL menggunakan **Drizzle ORM**, password hashing menggunakan **bcrypt**, dan framework **ElysiaJS** pada runtime **Bun**.

Arsitektur kode harus memisahkan antara **Routing Layer** (`routes`) dan **Business Logic Layer** (`services`).

---

## 2. Spesifikasi Teknis

### A. Skema Tabel Database (`users`)
Tambahkan tabel `users` pada database dengan kolom berikut:
- `id`: Integer, auto increment, primary key (`serial` di Drizzle MySQL).
- `name`: VARCHAR(255), NOT NULL.
- `email`: VARCHAR(255), NOT NULL, UNIQUE.
- `password`: VARCHAR(255), NOT NULL (disimpan dalam bentuk hash bcrypt).
- `created_at`: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP.

### B. Spesifikasi Endpoint
- **URL**: `/api/users`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "name": "Bayu",
  "email": "bayu@gmail.com",
  "password": "secret"
}
```

#### Response Body & Status Code

**1. Sukses (Status Code: `201 Created` / `200 OK`)**
```json
{
  "data": "OK"
}
```

**2. Error - Email Sudah Terdaftar (Status Code: `400 Bad Request` atau `409 Conflict`)**
```json
{
  "error": "Email sudah terdaftar"
}
```

---

## 3. Konvensi Struktur Folder & Penamaan File
- `src/services/users-service.ts`: Business logic (hashing password bcrypt, cek email, insert DB).
- `src/routes/users-route.ts`: Route handler ElysiaJS untuk `POST /api/users`.
