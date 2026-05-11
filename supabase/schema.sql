-- ============================================================
-- day-sawit-web: Supabase SQL Schema
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABEL USERS (admin + petugas)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'petugas')),
  keterangan TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hanya boleh 1 admin
CREATE UNIQUE INDEX idx_single_admin ON users (role) WHERE role = 'admin';

-- ============================================================
-- TABEL SESSIONS (login tracking — admin hanya 1 sesi)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL VISITOR LOG (role "melihat" — nama saja)
-- ============================================================
CREATE TABLE IF NOT EXISTS visitor_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  ip_address TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL DATA HARIAN
-- ============================================================
CREATE TABLE IF NOT EXISTS data_harian (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal DATE NOT NULL UNIQUE,
  harga_per_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
  catatan TEXT,
  created_by UUID REFERENCES users(id),
  created_by_nama TEXT,
  updated_by UUID REFERENCES users(id),
  updated_by_nama TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL SUPIR TONASE
-- ============================================================
CREATE TABLE IF NOT EXISTS supir_tonase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_harian_id UUID NOT NULL REFERENCES data_harian(id) ON DELETE CASCADE,
  nama_supir TEXT NOT NULL,
  tonase NUMERIC(12,2) NOT NULL,
  tanggal DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL PEMANEN TANDAN
-- ============================================================
CREATE TABLE IF NOT EXISTS pemanen_tandan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_harian_id UUID NOT NULL REFERENCES data_harian(id) ON DELETE CASCADE,
  nama_pemanen TEXT NOT NULL,
  jumlah_tandan INTEGER NOT NULL,
  tanggal DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL PENGELUARAN
-- ============================================================
CREATE TABLE IF NOT EXISTS pengeluaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_harian_id UUID REFERENCES data_harian(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT,
  jumlah NUMERIC(14,2) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_by_nama TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL KATEGORI PENGELUARAN
-- ============================================================
CREATE TABLE IF NOT EXISTS kategori_pengeluaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'other',
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default kategori
INSERT INTO kategori_pengeluaran (nama, icon) VALUES
  ('Upah Panen', 'harvest'),
  ('Upah Tarik Bargas', 'transport'),
  ('Upah Muat', 'load'),
  ('Biaya Transportasi', 'truck'),
  ('Biaya Lainnya', 'other')
ON CONFLICT (nama) DO NOTHING;

-- ============================================================
-- TABEL ACTIVITY LOG (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_nama TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (nonaktifkan untuk service role)
-- ============================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_harian DISABLE ROW LEVEL SECURITY;
ALTER TABLE supir_tonase DISABLE ROW LEVEL SECURITY;
ALTER TABLE pemanen_tandan DISABLE ROW LEVEL SECURITY;
ALTER TABLE pengeluaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE kategori_pengeluaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_log DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- VIEWS untuk kemudahan query
-- ============================================================

-- View: data harian lengkap dengan kalkulasi
CREATE OR REPLACE VIEW v_data_harian AS
SELECT
  dh.id,
  dh.tanggal,
  dh.harga_per_kg,
  dh.catatan,
  dh.created_by_nama,
  dh.updated_by_nama,
  dh.created_at,
  dh.updated_at,
  COALESCE(SUM(st.tonase), 0) AS total_tonase,
  COALESCE(SUM(st.tonase), 0) * dh.harga_per_kg AS total_pemasukan,
  COALESCE((
    SELECT SUM(p.jumlah) FROM pengeluaran p
    WHERE p.data_harian_id = dh.id
  ), 0) AS total_pengeluaran,
  COALESCE(SUM(st.tonase), 0) * dh.harga_per_kg - COALESCE((
    SELECT SUM(p.jumlah) FROM pengeluaran p
    WHERE p.data_harian_id = dh.id
  ), 0) AS keuntungan,
  COALESCE((
    SELECT SUM(pt.jumlah_tandan) FROM pemanen_tandan pt
    WHERE pt.data_harian_id = dh.id
  ), 0) AS total_tandan,
  COUNT(DISTINCT st.id) AS jumlah_supir,
  COUNT(DISTINCT (SELECT pt.id FROM pemanen_tandan pt WHERE pt.data_harian_id = dh.id)) AS jumlah_pemanen
FROM data_harian dh
LEFT JOIN supir_tonase st ON st.data_harian_id = dh.id
GROUP BY dh.id, dh.tanggal, dh.harga_per_kg, dh.catatan,
         dh.created_by_nama, dh.updated_by_nama, dh.created_at, dh.updated_at;
