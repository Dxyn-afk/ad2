# 🌿 day Web — Panduan Deployment

## Tech Stack
- **Frontend + API**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Auth**: JWT custom (cookies httpOnly)

---

## Langkah 1: Setup Supabase

1. Buka [supabase.com](https://supabase.com) → buat project baru
2. Tunggu project siap (~2 menit)
3. Buka **SQL Editor** → paste seluruh isi file `supabase/schema.sql` → klik Run
4. Ambil credentials di **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Langkah 2: Setup Repository

```bash
# Clone / download project
cd day-web

# Install dependencies
npm install

# Copy env file
cp .env.example .env.local

# Edit .env.local — isi semua nilai dari Supabase
nano .env.local
```

Isi `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=buat-string-random-min-32-karakter
NEXT_PUBLIC_APP_URL=https://nama-app-kamu.vercel.app
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Langkah 3: Test Lokal

```bash
npm run dev
# Buka http://localhost:3000
# Halaman register admin akan muncul pertama kali
```

---

## Langkah 4: Deploy ke Vercel

### Cara A: Via Vercel CLI (Recommended)
```bash
npm i -g vercel
vercel login
vercel

# Saat diminta env variables, masukkan semua dari .env.local
# Atau tambah via dashboard setelah deploy
```

### Cara B: Via GitHub
1. Push ke GitHub repository
2. Buka [vercel.com](https://vercel.com) → Import repository
3. Set environment variables di Settings → Environment Variables
4. Deploy otomatis

---

## Langkah 5: Setup Environment Variables di Vercel

Di Vercel dashboard → Settings → Environment Variables, tambahkan:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | url dari supabase | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | All |
| `JWT_SECRET` | string random 32 char | All |
| `NEXT_PUBLIC_APP_URL` | https://app-kamu.vercel.app | Production |

---

## Agar Tidak Logout Sendiri

Masalah umum di serverless hosting: session expire karena cold start.

Solusi yang sudah diimplementasikan:
1. **SessionKeepAlive component** — ping `/api/auth/refresh` setiap 8 menit
2. **JWT expiry 7 hari** — tidak perlu login ulang setiap hari
3. **Cookie httpOnly** — aman dan persistent
4. **Auto-refresh saat tab aktif** — ping saat user kembali ke tab
5. **Fail-safe** — network error tidak langsung logout

Untuk mencegah cold start yang panjang:
- Gunakan **Vercel Hobby** atau **Pro** plan
- Aktifkan **Fluid Compute** di Vercel (jika tersedia)
- Atau gunakan **cron job** external untuk ping /api/auth/refresh setiap 10 menit
  (contoh: gunakan cron-job.org untuk hit URL app setiap 10 menit)

---

## Alur Pertama Kali Buka Website

```
Buka URL
  ↓
Cek admin sudah ada?
  ├── BELUM → Halaman Register Admin (hanya muncul sekali!)
  │             Isi nama & password → Simpan → Login otomatis
  └── SUDAH → Halaman Login
                ├── Admin/Petugas → isi nama + password
                └── Pengunjung → tap "Masuk sebagai Pengunjung" → isi nama
```

---

## Role & Akses

| Fitur | Admin | Petugas | Pengunjung |
|-------|-------|---------|------------|
| Dashboard | ✅ | ✅ | ✅ |
| Lihat Data | ✅ | ✅ | ✅ (filter, no export) |
| Input Data | ✅ | ✅ | ❌ |
| Edit Data | ✅ | ❌ | ❌ |
| Hapus Data | ✅ | ❌ | ❌ |
| Export PDF | ✅ | ✅ | ❌ |
| Export Excel | ✅ | ✅ | ❌ |
| Cetak/Print | ✅ | ✅ | ❌ |
| Kelola Petugas | ✅ | ❌ | ❌ |
| Pengaturan | ✅ | ❌ | ❌ |
| Activity Log | ✅ | ❌ | ❌ |

---

## Struktur File

```
day-web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register-admin/page.tsx
│   │   └── visitor/page.tsx
│   ├── (app)/               ← halaman protected
│   │   ├── layout.tsx       ← cek session server-side
│   │   ├── dashboard/
│   │   ├── data/
│   │   ├── input/
│   │   ├── laporan/
│   │   ├── users/           ← admin only
│   │   └── admin/           ← admin only
│   ├── api/
│   │   ├── auth/            ← login, logout, refresh, visitor
│   │   ├── data/            ← CRUD data harian
│   │   ├── stats/           ← statistik & ringkasan
│   │   ├── kategori/        ← kategori pengeluaran
│   │   ├── users/           ← manajemen pengguna
│   │   └── activity/        ← activity log
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             ← redirect root
├── components/
│   ├── Layout.tsx           ← sidebar + mobile nav
│   └── SessionKeepAlive.tsx ← mencegah logout otomatis
├── hooks/
│   └── useSession.ts
├── lib/
│   ├── auth.ts              ← JWT + session management
│   ├── db.ts                ← database queries
│   ├── format.ts            ← format helpers
│   └── supabase.ts          ← supabase client
├── types/
│   └── index.ts
├── supabase/
│   └── schema.sql           ← jalankan di Supabase SQL Editor
├── .env.example
├── middleware.ts             ← route protection
├── next.config.ts
├── tailwind.config.ts
└── vercel.json
```

---

## Troubleshooting

### Logout sendiri setelah beberapa menit
- Cek apakah `JWT_SECRET` sudah diset di Vercel environment variables
- Pastikan `SessionKeepAlive` component ter-render (ada di Layout.tsx)
- Cek network tab browser: apakah `/api/auth/refresh` di-call secara berkala

### Halaman register admin muncul terus
- Jalankan SQL schema dulu di Supabase
- Cek koneksi Supabase (env vars benar?)

### Error 500 saat login
- Cek `SUPABASE_SERVICE_ROLE_KEY` sudah benar
- Lihat Vercel function logs di dashboard

### Data tidak tersimpan
- Cek tabel sudah dibuat (jalankan schema.sql)
- Cek Row Level Security sudah dimatikan (schema.sql sudah handle ini)
