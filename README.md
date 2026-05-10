# WMS Grow 🌾
Warehouse Management System (WMS) untuk Pergudangan Pertanian.

## Deskripsi Proyek
**WMS Grow** adalah sistem informasi manajemen pergudangan yang dikembangkan secara khusus untuk mengelola operasional logistik dan inventaris pada industri pertanian (meliputi manajemen stok pupuk, pestisida, benih, dan alat pertanian). 

Aplikasi ini dikembangkan sebagai bagian dari penelitian **Skripsi**, berfokus pada penerapan arsitektur **Modular Monolith (Modulith)** di *backend* untuk menghasilkan struktur kode sistem informasi skala menengah yang *scalable*, rapi, dan mudah di-*maintain*.

Sistem ini mendukung alur kerja persetujuan (*approval workflow*) terpusat, pengeluaran barang dengan metode FIFO (*First In, First Out*), pencatatan log aktivitas, serta pembuatan laporan dokumen otomatis (PDF).

## Fitur Utama
- **Arsitektur Modular Monolith (Modulith):** *Backend* dibangun dengan memisahkan kode berdasarkan *domain* bisnis (Inventory, Transaction, Shared, dsb.) secara modular dalam satu *codebase* Laravel.
- **Role-Based Access Control (RBAC):** Mendukung 3 tingkat pengguna:
  - **Admin:** Memiliki kontrol penuh untuk mengelola data *master* (Data Gudang, Kategori, User, Supplier, Customer).
  - **Manajer:** Bertanggung jawab melakukan peninjauan (*approval* / *reject*) terhadap permohonan transaksi keluar/masuk, serta memantau analitik stok.
  - **Petugas (Staff):** Menjalankan operasional harian berupa pengajuan (*input*) barang masuk dan barang keluar.
- **Manajemen Stok FIFO:** Algoritma otomatis yang mengurangi stok barang berdasarkan tanggal kedatangan (batch) paling awal untuk menjaga kualitas dan mencegah masa kedaluwarsa panjang pada produk pertanian.
- **Auto-Generate Dokumen PDF:** Cetak otomatis *invoice* transaksi barang keluar setelah disetujui Manajer.
- **Modern Dashboard & Log System:** Antarmuka (*User Interface*) responsif yang menampilkan *Key Performance Indicators* (KPI), Peringatan Stok Menipis (*Low Stock Alert*), serta *Audit Trail* (Log Aktivitas dan Log Mutasi Stok) secara *real-time*.

## Teknologi yang Digunakan

### Backend
- **Framework:** Laravel 10.x (PHP 8.x)
- **Arsitektur:** Modular Monolith
- **Database:** MySQL
- **Dokumen/Report:** DomPDF
- **Otentikasi:** Laravel Sanctum (JWT/Token-based)

### Frontend
- **Library:** React.js 18 (Vite)
- **Styling:** React Bootstrap & Custom Vanilla CSS (Modern, Card-Based UI)
- **Data Visualization:** Recharts
- **Networking/State:** Axios, React-Toastify

### Infrastruktur & Testing
- **Deployment/Container:** Docker & Docker Compose
- **Performance Testing:** K6 (Load Test)

---

## Cara Instalasi (Setup)

### Opsi 1: Menggunakan Docker (Rekomendasi)
Repositori ini telah dikonfigurasi untuk berjalan di atas *container* menggunakan Docker.

1. Buka terminal dan lakukan *clone* repositori ini.
2. Masuk ke direktori *backend*:
   ```bash
   cd be-WMS
   ```
3. Salin file konfigurasi:
   ```bash
   cp .env.example .env
   ```
   *(Pastikan kredensial `DB_HOST`, `DB_PORT`, `DB_DATABASE`, dll mengarah ke konfigurasi Docker Anda).*
4. *Build* dan jalankan *container*:
   ```bash
   docker-compose up -d --build
   ```
5. Masuk ke *container* Laravel untuk menjalankan migrasi dan *seeder*:
   ```bash
   docker-compose exec app php artisan migrate:fresh --seed
   ```
6. Jalankan layanan *frontend* secara terpisah (lihat instruksi Frontend di Opsi 2).

### Opsi 2: Instalasi Manual (XAMPP / Laragon)

#### Setup Backend (Laravel)
1. Masuk ke folder backend: `cd be-WMS`
2. Salin file `.env`: `cp .env.example .env`
3. Install dependensi PHP: `composer install`
4. Generate *application key*: `php artisan key:generate`
5. Buat database baru di MySQL (misal: `wms_modulith`), dan sesuaikan variabel `DB_DATABASE` pada file `.env`.
6. Migrasi database beserta data *dummy*: `php artisan migrate:fresh --seed`
7. Jalankan server lokal: `php artisan serve`

#### Setup Frontend (React)
1. Buka tab terminal baru dan masuk ke folder frontend: `cd fe-WMS`
2. Install dependensi Node.js: `npm install`
3. Jalankan server *development*: `npm run dev`
4. Aplikasi dapat diakses melalui browser pada `http://localhost:5173`.

---

## Akun Login Default
Sistem secara otomatis telah membuat akun *default* (melalui *Database Seeder*) untuk memudahkan pengujian sistem. Silakan gunakan kredensial berikut untuk *login*:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | admin@admin.com | `password` |
| **Manajer** | manajer@manajer.com | `password` |
| **Petugas** | petugas@petugas.com | `password` |

*(Kredensial spesifik ini dapat dilihat dan diubah pada file `DatabaseSeeder.php`)*.

---
**Dibuat untuk keperluan Penelitian Skripsi** - © 2026
