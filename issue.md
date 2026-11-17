# Testing Plan: Integration & Unit Test untuk Seluruh API

## 1. Tujuan & Gambaran Umum
Membuat rangkaian test otomatis (*automated test*) yang komprehensif untuk seluruh endpoint API yang tersedia pada aplikasi menggunakan **Bun Test** (`bun test`).

Semua file test harus ditempatkan di dalam folder khusus `tests/` pada root project. Untuk menjaga konsistensi dan independensi antar pengujian, **setiap skenario test wajib membersihkan data di database terlebih dahulu** sebelum skenario dijalankan.

---

## 2. Aturan Umum Implementasi

1. **Lokasi Folder**:
   - Simpan seluruh file test di dalam folder `tests/` (misal: `tests/health.test.ts`, `tests/items.test.ts`, `tests/users.test.ts`, `tests/users-service.test.ts`).
2. **Test Runner**:
   - Gunakan `bun:test` (`describe`, `it`, `expect`, `beforeEach`, dll.) dan jalankan dengan `bun test`.
3. **Konsistensi Data (Database Cleanup)**:
   - Setiap skenario test diawali dengan kondisi database bersih (`sessions` -> `users` -> `items`) menggunakan helper `tests/test-helper.ts`.
4. **Cakupan Pengujian**:
   - Verifikasi HTTP status code, format response body (sukses & error), validasi input, serta kondisi data di database.

---

## 3. Daftar Skenario Test per API
- **Health Check API**: `GET /`
- **Items API**: `GET /items`, `POST /items`, `GET /items/:id`
- **Users API**:
  - `POST /api/users` (Registrasi user baru & validasi)
  - `POST /api/users/login` (Login, multi-sesi, dan validasi)
  - `POST /api/users/current` (Get current user dengan Bearer token)
  - `DELETE /api/users/logout` (Logout & penghapusan sesi)
