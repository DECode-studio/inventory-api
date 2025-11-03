# Inventory API (NestJS + PostgreSQL)

API ini menyediakan manajemen pengguna dan master barang lengkap dengan autentikasi JWT, otorisasi berbasis signature HMAC, manajemen stok, histori harga, serta dokumentasi Swagger. Stack data layer kini menggunakan Prisma ORM di atas PostgreSQL.

## Fitur Utama
- NestJS + Prisma dengan PostgreSQL (konfigurasi lewat variabel lingkungan).
- Tabel `users` dengan CRUD + login (hash password BCrypt).
- Modul `barang` dengan kode otomatis (`BRG/YY/MM/XXXXX`), upload foto, stok, dan harga.
- Penyesuaian stok via ledger serta histori harga per tanggal.
- Seluruh endpoint (kecuali Swagger docs) divalidasi menggunakan signature HMAC dan memerlukan JWT.
- Swagger tersedia di `/docs` untuk eksplorasi dan uji coba.

## Langkah Setup
1. **Persiapan Database**
   - Jalankan PostgreSQL dan buat database kosong, misal `inventory`.
2. **Buat berkas `.env` di root proyek** sesuai contoh berikut (opsional Anda juga bisa langsung mengisi `DATABASE_URL` ala Prisma):
   ```bash
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASS=postgres
   DB_NAME=inventory

   JWT_SECRET=super-secret-jwt
   JWT_EXPIRES=1d

   API_KEY_ID=sample-key
   API_SECRET=sample-secret
   API_SIG_TTL=300
   ```
   Jika `DATABASE_URL` belum di-set, aplikasi akan merangkai URL otomatis dari variabel di atas.
3. **Instal dependensi**
   ```bash
   pnpm install
   ```
4. **Generate client Prisma**
   ```bash
   pnpm prisma:generate
   ```
5. **Siapkan skema database**
   ```bash
   pnpm prisma:migrate:dev
   ```
   Perintah ini membaca `prisma/schema.prisma` dan membuat tabel sesuai kebutuhan aplikasi.
6. **Jalankan server**
   ```bash
   pnpm run start:dev
   ```
   Prisma bergantung pada koneksi yang sudah dimigrasikan.

## Autentikasi & Signature
1. **Register & Login**
   - `POST /api/auth/register`
   - `POST /api/auth/login` → respon `{ "access_token": "<JWT>" }`
2. **Header Wajib**
   - `Authorization: Bearer <JWT>`
   - `x-api-key-id: <API_KEY_ID>`
   - `x-api-ts: <unix timestamp detik>`
   - `x-api-sig: <signature>`
3. **Cara Hitung Signature**
   ```
   payload = `${METHOD}\n${PATH}\n${BODY_JSON}\n${TIMESTAMP}`
   signature = HMAC_SHA256(API_SECRET, payload) -> hex lowercase
   ```
   - `PATH` harus relatif terhadap host, termasuk prefix `/api`.
   - `BODY_JSON` adalah string JSON persis seperti yang dikirim (gunakan string kosong `""` untuk body kosong).
   - Untuk request `multipart/form-data`, gunakan JSON dari field teks yang dikirim (file tidak perlu dihitung).
   - Pastikan `x-api-ts` berada dalam rentang `±API_SIG_TTL` detik dari waktu server.

Contoh cepat memakai Node.js:
```bash
TIMESTAMP=$(date +%s)
PAYLOAD='{"username":"admin","password":"secret"}'
SIGNATURE=$(node -e "const crypto=require('crypto');const secret=process.env.API_SECRET;const payload=['POST','/api/auth/login','$PAYLOAD','$TIMESTAMP'].join('\n');console.log(crypto.createHmac('sha256', secret).update(payload).digest('hex'))" )
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-api-key-id: $API_KEY_ID" \
  -H "x-api-ts: $TIMESTAMP" \
  -H "x-api-sig: $SIGNATURE" \
  -d '$PAYLOAD'
```

## Endpoint Barang (ringkasan)
- `POST /api/barang` (multipart) → buat barang baru; field: `nama`, opsional `stok`, `harga`, `foto`.
- `GET /api/barang` → daftar barang.
- `GET /api/barang/:id` → detail barang.
- `PATCH /api/barang/:id` (multipart) → ubah data barang.
- `DELETE /api/barang/:id` → hapus barang.
- `POST /api/barang/:id/stock` → tambah/kurangi stok (`delta`, `note?`, `txnDate?`).
- `POST /api/barang/:id/price` → set harga per tanggal (`harga`, `tanggalBerlaku`).
- `GET /api/barang/report/stock?date=YYYY-MM-DD` → total stok kumulatif per barang.
- `GET /api/barang/report/price?date=YYYY-MM-DD` → harga berlaku per barang pada tanggal tertentu.

Upload file disimpan pada folder `uploads/` (dibuat otomatis). Properti `fotoPath` pada respons berisi path relatif menuju file tersebut.

## Swagger
Akses dokumentasi dan uji coba API melalui `http://localhost:3000/docs`. Saat mencoba endpoint dari Swagger UI:
- Isi `Authorize` → `Bearer` token dengan JWT.
- Tambahkan header signature (`x-api-key-id`, `x-api-ts`, `x-api-sig`) pada setiap request secara manual.

## Pengembangan & Pengujian
- Jalankan lint: `pnpm run lint`
- Build production: `pnpm run build`
- Unit test: `pnpm test`
- E2E test (membutuhkan PostgreSQL aktif + skema Prisma sudah dimigrasikan):
  ```bash
  pnpm prisma:migrate:dev   # pastikan sekali sebelum test
  pnpm run test:e2e
  ```
  Test otomatis akan dilewati apabila variabel koneksi database belum di-set.

Selamat mencoba!
