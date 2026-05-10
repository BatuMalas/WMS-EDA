# WMS Modular Monolith — Panduan Load Test

Suite pengujian beban untuk arsitektur **Modular Monolith WMS** menggunakan [Grafana k6](https://k6.io/).  
Panduan ini mencakup semua langkah mulai dari instalasi hingga cara membaca data untuk **Bab IV Tesis**.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Struktur Folder](#2-struktur-folder)
3. [Persiapan Lingkungan](#3-persiapan-lingkungan)
4. [Menjalankan Load Test](#4-menjalankan-load-test)
5. [Memantau Resource (CPU & Memory)](#5-memantau-resource-cpu--memory)
6. [Membaca Hasil & Mengisi Tabel Bab IV](#6-membaca-hasil--mengisi-tabel-bab-iv)
7. [Referensi Skenario](#7-referensi-skenario)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prasyarat

### Install k6

```powershell
# Opsi A: via winget (Windows Package Manager)
winget install k6 --source winget

# Opsi B: download installer langsung
# https://dl.k6.io/msi/k6-latest-amd64.msi
```

Verifikasi instalasi berhasil:

```powershell
k6 version
# Output: k6 v0.x.x (...)
```

### Prasyarat Lain

- Docker Desktop sudah berjalan
- Backend WMS sudah jalan di `http://localhost:8000`
- Database sudah di-seed dengan `RealisticDataSeeder`

---

## 2. Struktur Folder

```
load-test/
├── README.md                    ← Panduan ini
├── run-tests.ps1                ← Script otomatis (jalankan semua 9 skenario)
├── monitor-resources.ps1        ← Pantau CPU/Memory Docker → output CSV
├── results/                     ← Hasil JSON tersimpan di sini (auto-created)
│
└── scripts/
    ├── config.js                ← Konfigurasi global (URL, credentials, stages)
    ├── run-all.js               ← Jalankan semua UC dalam 1 eksekusi k6
    │
    ├── uc01-inbound-50rps.js    ← UC-01 Inbound  @ 50 RPS
    ├── uc01-inbound-100rps.js   ← UC-01 Inbound  @ 100 RPS
    ├── uc01-inbound-200rps.js   ← UC-01 Inbound  @ 200 RPS
    │
    ├── uc02-stock-50rps.js      ← UC-02 Stock Adjustment @ 50 RPS
    ├── uc02-stock-100rps.js     ← UC-02 Stock Adjustment @ 100 RPS
    ├── uc02-stock-200rps.js     ← UC-02 Stock Adjustment @ 200 RPS
    │
    ├── uc03-outbound-50rps.js   ← UC-03 Outbound @ 50 RPS
    ├── uc03-outbound-100rps.js  ← UC-03 Outbound @ 100 RPS
    └── uc03-outbound-200rps.js  ← UC-03 Outbound @ 200 RPS
```

---

## 3. Persiapan Lingkungan

### Langkah 3.1 — Jalankan Backend (Docker)

```powershell
cd be-WMS
docker compose up -d
```

Cek container berjalan:

```powershell
docker ps
# Harus ada: wms-app (port 8000) dan wms-mysql (port 3306)
```

> **Resource Limits:** `docker-compose.yml` sudah dikonfigurasi membatasi container `wms-app` pada **1 vCPU dan 512 MB RAM** sesuai variabel kontrol tesis.

### Langkah 3.2 — Seed Database (PENTING — lakukan sekali)

```powershell
docker exec wms-app php artisan db:seed --class=RealisticDataSeeder --force
```

Proses ini memakan waktu ~1-2 menit. Tunggu hingga muncul output:

```
✅ Data realistis 200 barang berhasil di-seed!
   Users: 1 admin + 3 manajer + 6 petugas (password: password)
   Barang: 200 | Pending: 8
```

> ⚠️ **JANGAN** gunakan `migrate:fresh --seed` — perintah itu hanya menjalankan `DatabaseSeeder` lama (3 user saja) dan menghapus semua data!

### Langkah 3.3 — Verifikasi Login

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"petugas1","password":"password"}'
```

Harus mengembalikan `success: True` dan `access_token`. Jika gagal → ulangi Langkah 3.2.

### Daftar Akun Pengujian

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `password` |
| Manajer | `manajer1`, `manajer2`, `manajer3` | `password` |
| Petugas | `petugas1` s/d `petugas6` | `password` |

---

## 4. Menjalankan Load Test

Buka terminal, masuk ke folder `load-test`:

```powershell
cd "C:\Users\CANDRA BAGUS AINUR R\OneDrive\Desktop\Buku Kas\WMS-modulith\load-test"
```

### Opsi A — Otomatis Semua Skenario (Direkomendasikan)

Script ini menjalankan **9 skenario secara berurutan**, menyimpan hasil JSON per skenario, dan memberi jeda 30 detik antar skenario.

```powershell
.\run-tests.ps1
```

Perkiraan waktu total: **~55 menit**.

Hanya satu Use Case:

```powershell
.\run-tests.ps1 -Only UC01   # Hanya UC-01
.\run-tests.ps1 -Only UC02   # Hanya UC-02
.\run-tests.ps1 -Only UC03   # Hanya UC-03
```

---

### Opsi B — Manual Per Skenario (Paling Terkontrol)

Jalankan tiap skenario satu per satu dari dalam folder `load-test/`:

**UC-01: Inbound / Receiving**

```powershell
# 50 RPS (sustain 90 detik)
k6 run --out json=results/uc01-50rps.json `
       --summary-export=results/uc01-50rps-summary.json `
       scripts/uc01-inbound-50rps.js

# 100 RPS (sustain 90 detik)
k6 run --out json=results/uc01-100rps.json `
       --summary-export=results/uc01-100rps-summary.json `
       scripts/uc01-inbound-100rps.js

# 200 RPS (sustain 120 detik)
k6 run --out json=results/uc01-200rps.json `
       --summary-export=results/uc01-200rps-summary.json `
       scripts/uc01-inbound-200rps.js
```

**UC-02: Stock Adjustment**

```powershell
k6 run --out json=results/uc02-50rps.json `
       --summary-export=results/uc02-50rps-summary.json `
       scripts/uc02-stock-50rps.js

k6 run --out json=results/uc02-100rps.json `
       --summary-export=results/uc02-100rps-summary.json `
       scripts/uc02-stock-100rps.js

k6 run --out json=results/uc02-200rps.json `
       --summary-export=results/uc02-200rps-summary.json `
       scripts/uc02-stock-200rps.js
```

**UC-03: Outbound Confirmation**

```powershell
k6 run --out json=results/uc03-50rps.json `
       --summary-export=results/uc03-50rps-summary.json `
       scripts/uc03-outbound-50rps.js

k6 run --out json=results/uc03-100rps.json `
       --summary-export=results/uc03-100rps-summary.json `
       scripts/uc03-outbound-100rps.js

k6 run --out json=results/uc03-200rps.json `
       --summary-export=results/uc03-200rps-summary.json `
       scripts/uc03-outbound-200rps.js
```

---

## 5. Memantau Resource (CPU & Memory)

Buka **terminal terpisah** (jangan ditutup) saat load test berjalan:

```powershell
cd load-test
.\monitor-resources.ps1
```

Script ini mencatat `CPU%` dan `Memory%` container `wms-app` setiap 10 detik ke file CSV di `results/`.

**Atau pantau secara manual real-time:**

```powershell
# Update tiap detik (tekan Ctrl+C untuk berhenti)
docker stats wms-app

# Snapshot satu kali
docker stats --no-stream wms-app
```

> **Cara catat ke tabel Bab IV:** Amati nilai CPU% dan Memory% **saat fase sustain** (ketika beban stabil di 50/100/200 RPS). Catat nilai **puncak tertinggi** yang muncul selama fase tersebut.

---

## 6. Membaca Hasil & Mengisi Tabel Bab IV

### File yang Dihasilkan

Setiap skenario menghasilkan dua file:

| File | Kegunaan |
|---|---|
| `uc01-50rps.json` | Raw data semua data point (besar, untuk grafik) |
| `uc01-50rps-summary.json` | Ringkasan statistik → **digunakan untuk tabel Bab IV** |

### Cara Membaca `*-summary.json`

Buka file summary, cari key berikut di bagian `metrics`:

```json
"http_req_duration": {
  "avg":   123.45,    ← Latency Mean (ms) → kolom "Rata-rata"
  "p(95)": 456.78,   ← Latency P95 (ms)  → kolom "P95"
  ...
},
"http_reqs": {
  "rate": 48.32       ← Throughput (req/s) → kolom "Throughput"
},
"http_req_failed": {
  "rate": 0.023       ← Error Rate (2.3%)  → kolom "Error Rate"
}
```

### Template Tabel Bab IV

| Skenario | Beban | Latency Mean (ms) | Latency P95 (ms) | Throughput (req/s) | Error Rate (%) | CPU (%) | Memori (%) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| UC-01 Inbound | 50 RPS | | | | | | |
| UC-01 Inbound | 100 RPS | | | | | | |
| UC-01 Inbound | 200 RPS | | | | | | |
| UC-02 Stock Adj | 50 RPS | | | | | | |
| UC-02 Stock Adj | 100 RPS | | | | | | |
| UC-02 Stock Adj | 200 RPS | | | | | | |
| UC-03 Outbound | 50 RPS | | | | | | |
| UC-03 Outbound | 100 RPS | | | | | | |
| UC-03 Outbound | 200 RPS | | | | | | |

---

## 7. Referensi Skenario

### UC-01: Inbound / Receiving

**Endpoint:** `POST /api/transaksi` → `PUT /api/transaksi/{id}/approve`

**Alur per Virtual User:**
1. Petugas membuat transaksi masuk → sistem catat di DB, status `pending`
2. Manajer approve → sistem update stok barang secara **sinkron**
3. Metrik utama: `uc01_create_duration`, `uc01_approve_duration`, `uc01_e2e_duration`

---

### UC-02: Stock Adjustment

**Endpoint:** `POST /api/barang/{id}/stok/tambah` → `GET /api/dashboard`

**Alur per Virtual User:**
1. Petugas tambah stok langsung → sistem buat `StockBatch` baru, perbarui rekap stok
2. Baca dashboard → verifikasi data rekap ter-update langsung (sinkron)
3. Metrik utama: `uc02_adjustment_duration`, `uc02_dashboard_duration`

---

### UC-03: Outbound Confirmation *(Skenario Paling Berat)*

**Endpoint:** `POST /api/transaksi` → `PUT /api/transaksi/{id}/approve`

**Alur per Virtual User:**
1. Petugas buat transaksi keluar → status `pending`
2. Manajer approve → sistem secara **sinkron** menjalankan:
   - Pengurangan stok FIFO (ambil dari batch tertua)
   - Buat `BatchOutflow` (audit trail per batch)
   - Generate nomor invoice keluar
   - Tulis activity log
3. Verifikasi detail transaksi
4. Metrik utama: `uc03_approve_duration` (paling lambat karena operasi FIFO)

> **Catatan:** Error HTTP 422 pada UC-03 bukan kegagalan sistem — ini validasi bisnis normal ketika stok suatu barang habis. Bedakan dari error HTTP 5xx (kegagalan sistem) saat mengisi kolom Error Rate.

---

### Parameter Beban

| Fase | Target | Durasi Sustain | Durasi Total (termasuk ramp) |
|---|:---:|:---:|:---:|
| Fase 1 | 50 RPS | 90 detik | ~110 detik |
| Fase 2 | 100 RPS | 90 detik | ~115 detik |
| Fase 3 | 200 RPS | 120 detik | ~150 detik |

---

### Variabel Kontrol

| Parameter | Nilai | Implementasi |
|---|---|---|
| Dataset Barang | 200 produk pertanian | `RealisticDataSeeder` |
| Dataset User | 10 user (1+3+6) | `RealisticDataSeeder` |
| CPU Limit | 2 vCPU | `docker-compose.yml: cpus: '2.0'` |
| RAM Limit | 2 GB | `docker-compose.yml: memory: 2G` |
| Stack | Laravel 11 + MySQL 8 | Docker |

---

## 8. Troubleshooting

### Login gagal (401 Unauthorized)

```powershell
# Jalankan ulang seeder
docker exec wms-app php artisan db:seed --class=RealisticDataSeeder --force
```

### Endpoint 404 (route tidak ditemukan)

```powershell
# Cek daftar route
docker exec wms-app php artisan route:list --path=transaksi
docker exec wms-app php artisan route:list --path=barang
```

### k6: "no such file or directory"

Pastikan menjalankan dari dalam folder `load-test/`:

```powershell
cd load-test
k6 run scripts/uc01-inbound-50rps.js
```

### Container restart atau OOM saat 200 RPS

Ini adalah **data valid** untuk tesis — artinya 200 RPS melampaui kapasitas sistem dengan limit 512MB RAM. Catat sebagai temuan bottleneck di analisis Bab IV.

Cek log container:

```powershell
docker logs wms-app --tail 50
```
