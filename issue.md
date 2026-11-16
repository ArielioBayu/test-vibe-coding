# Project Setup Plan: ElysiaJS + Drizzle ORM + MySQL (Bun Runtime)

## 1. Overview & Objective
Dokumen ini merupakan panduan implementasi tingkat tinggi (*high-level plan*) untuk menginisialisasi project backend baru menggunakan runtime **Bun**, framework **ElysiaJS**, dan **Drizzle ORM** dengan database **MySQL**.

Target pembaca: Programmer atau AI coding agent yang akan mengeksekusi implementasi teknis.

---

## 2. Tech Stack
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Driver**: MySQL driver (`mysql2`)
- **Language**: TypeScript

---

## 3. High-Level Implementation Phases

### Phase 1: Inisialisasi Project & Dependencies
1. Inisialisasi project Bun baru di direktori ini (`bun init` atau setup `package.json`).
2. Pasang dependencies utama:
   - `elysia`
   - `drizzle-orm`
   - `mysql2`
3. Pasang dev dependencies pendukung:
   - `drizzle-kit` (untuk migrasi dan schema management)
   - `@types/bun`

### Phase 2: Konfigurasi Environment & Database Connection
1. Buat template file konfigurasi environment (`.env` dan `.env.example`) yang memuat:
   - Port server
   - Kredensial koneksi database MySQL (`DATABASE_URL` atau host, port, user, password, database).
2. Konfigurasi **Drizzle Kit** (`drizzle.config.ts`):
   - Tentukan lokasi schema files (`./src/db/schema.ts`).
   - Tentukan direktori output migrasi (`./drizzle`).
   - Set dialect ke `mysql`.

### Phase 3: Arsitektur & Struktur Folder
Terapkan struktur folder modular dan sederhana:
```text
.
├── drizzle/              # File hasil migrasi SQL Drizzle
├── src/
│   ├── db/
│   ├── routes/           # Handler route ElysiaJS
│   └── index.ts          # Entry point server ElysiaJS
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

### Phase 4: Definisi Schema & Migrasi Database
1. Buat schema tabel awal di `src/db/schema.ts` (misal: tabel `items` sederhana dengan `id`, `name`, `createdAt`).
2. Sediakan script npm di `package.json` untuk manajemen database:
   - `db:generate`: Generate migrasi via `drizzle-kit`.
   - `db:migrate` / `db:push`: Terapkan skema langsung ke MySQL.
   - `db:studio`: Buka Drizzle Studio untuk inspeksi data.

### Phase 5: Setup ElysiaJS Server & Endpoint Contoh
1. Di `src/index.ts`, inisialisasi instance Elysia app.
2. Buat endpoint dasar:
   - `GET /`: Health check / status server.
   - Minimal 1 contoh route integrasi database (`GET /items`, `POST /items`, `GET /items/:id`) untuk memvalidasi interaksi Drizzle dengan MySQL.
3. Jalankan server pada port yang ditentukan (default `3000`).

### Phase 6: Verifikasi & Testing
1. Pastikan server dapat berjalan lancar menggunakan `bun run dev` (atau `bun --watch src/index.ts`).
2. Uji endpoint via automated test (`bun test`).
3. Pastikan query baca/tulis ke database MySQL terkonfigurasi melalui Drizzle ORM.
