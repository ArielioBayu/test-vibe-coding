# ElysiaJS + Drizzle ORM + MySQL (Bun Runtime)

Project backend modern dan performan menggunakan **Bun**, framework **ElysiaJS**, dan **Drizzle ORM** dengan database **MySQL**.

---

## 🛠️ Tech Stack
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Driver**: [MySQL2](https://github.com/sidorares/node-mysql2)
- **Language**: TypeScript

---

## 📁 Struktur Direktori
```text
.
├── drizzle/              # File migrasi SQL hasil generate Drizzle
│   └── 0000_*.sql
├── src/
│   ├── db/
│   │   ├── index.ts      # Koneksi database MySQL & Drizzle instance
│   │   └── schema.ts     # Definisi schema database
│   ├── routes/
│   │   └── items.ts      # Endpoint items CRUD
│   ├── index.ts          # Entry point server ElysiaJS
│   └── index.test.ts     # Automated unit/integration tests
├── .env                  # Environment variables lokal
├── .env.example          # Template konfigurasi environment
├── drizzle.config.ts     # Konfigurasi Drizzle Kit
├── package.json
└── tsconfig.json
```

---

## 🚀 Memulai (Getting Started)

### 1. Prasyarat
- [Bun](https://bun.sh/) (v1.0+)
- MySQL Server yang sedang aktif (misal via Laragon, XAMPP, atau Docker)

### 2. Konfigurasi Environment
Salin template konfigurasi `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Sesuaikan variabel koneksi database di `.env`:
```env
PORT=3000
DATABASE_URL=mysql://root:password@localhost:3306/test_vibe_coding
```

### 3. Migrasi Database (Drizzle Kit)
Generate migrasi SQL:
```bash
bun run db:generate
```

Push schema langsung ke database MySQL:
```bash
bun run db:push
```

Buka visual database viewer (Drizzle Studio):
```bash
bun run db:studio
```

### 4. Menjalankan Server
Mode development (dengan auto-reload):
```bash
bun run dev
```

Mode production:
```bash
bun run start
```

### 5. Menjalankan Test & Typecheck
```bash
bun test
bun run typecheck
```

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Health check & status server |
| `GET` | `/items` | Mengambil seluruh data items dari MySQL |
| `POST` | `/items` | Menambahkan item baru (Body: `{ name: string, description?: string }`) |
| `GET` | `/items/:id` | Mengambil detail item berdasarkan ID |
