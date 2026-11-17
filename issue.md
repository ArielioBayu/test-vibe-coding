# Feature Plan: User Logout API (`DELETE /api/users/logout`)

## 1. Ringkasan Fitur
Implementasi endpoint API untuk proses logout pengguna. Fitur ini memvalidasi token sesi pengguna melalui header HTTP `Authorization: Bearer <token>`, kemudian menghapus record sesi yang cocok dari tabel `sessions` di database MySQL. Setelah sesi terhapus, token tersebut tidak lagi dapat digunakan untuk mengakses endpoint terproteksi.

Arsitektur kode harus memisahkan antara layer **Routing** (`routes`) dan layer **Business Logic** (`services`).

---

## 2. Spesifikasi Teknis

### A. Spesifikasi Endpoint
- **URL**: `/api/users/logout`
- **Method**: `DELETE`
- **Headers Wajib**:
  - `Authorization: Bearer <token>` (token UUID sesi login yang tersimpan di tabel `sessions`)

### B. Format Request & Response

#### 1. Request
Tidak memerlukan request body. Otentikasi dan identifikasi sesi dilakukan melalui header `Authorization`.

#### 2. Response Sukses (Status Code: `200 OK`)
Mengembalikan konfirmasi bahwa logout berhasil dan record sesi telah terhapus dari tabel `sessions`:
```json
{
  "data": "OK"
}
```

#### 3. Response Error (Status Code: `401 Unauthorized`)
Jika header `Authorization` tidak disertakan, format bukan Bearer token, atau token tidak ditemukan di tabel `sessions`:
```json
{
  "error": "Unauthorized"
}
```

---

## 3. Konvensi Struktur Folder & Penamaan File

Tetap gunakan struktur direktori modular yang telah ada:

```text
src/
├── services/
│   ├── users-service.ts       # Tambahkan method logoutUser(token)
│   └── users-service.test.ts  # Unit test
├── routes/
│   └── users-route.ts         # Tambahkan handler DELETE /logout
├── index.ts                   # Entry point server ElysiaJS
└── index.test.ts              # Integration test untuk DELETE /api/users/logout
```

> **Aturan Penamaan File**:
> - File routing menggunakan format `*-route.ts` (`src/routes/users-route.ts`).
> - File service menggunakan format `*-service.ts` (`src/services/users-service.ts`).
