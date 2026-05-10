<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Customer\Models\Customer;
use App\Modules\Inventory\Models\Kategori;
use App\Modules\Inventory\Models\Barang;
use App\Modules\Supplier\Models\Supplier;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Users ───

        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Admin Gudang',
                'email' => 'admin@wms.com',
                'password' => 'password',
                'role' => 'admin',
                'phone' => '+62 812 3456 7890',
                'address' => 'Jl. Gudang Raya No. 123, Jakarta',
            ]
        );

        User::updateOrCreate(
            ['username' => 'manajer'],
            [
                'name' => 'Manajer Gudang',
                'email' => 'manajer@wms.com',
                'password' => 'password',
                'role' => 'manajer',
                'phone' => '+62 811 2233 4455',
                'address' => 'Jl. Gudang Raya No. 789, Jakarta',
            ]
        );

        User::updateOrCreate(
            ['username' => 'petugas'],
            [
                'name' => 'Petugas Gudang',
                'email' => 'petugas@wms.com',
                'password' => 'password',
                'role' => 'petugas',
                'phone' => '+62 813 9876 5432',
                'address' => 'Jl. Gudang Raya No. 456, Jakarta',
            ]
        );

        // ─── Kategori ───

        $kategoris = [
            ['kode_kategori' => 'KAT-001', 'nama_kategori' => 'Elektronik'],
            ['kode_kategori' => 'KAT-002', 'nama_kategori' => 'Makanan & Minuman'],
            ['kode_kategori' => 'KAT-003', 'nama_kategori' => 'Alat Tulis Kantor'],
            ['kode_kategori' => 'KAT-004', 'nama_kategori' => 'Bahan Bangunan'],
            ['kode_kategori' => 'KAT-005', 'nama_kategori' => 'Peralatan Rumah Tangga'],
        ];

        foreach ($kategoris as $kat) {
            Kategori::updateOrCreate(['kode_kategori' => $kat['kode_kategori']], $kat);
        }

        // ─── Suppliers ───

        $suppliers = [
            ['kode_supplier' => 'SUP-001', 'nama_supplier' => 'PT Sukses Jaya', 'nama_kontak' => 'Budi Santoso', 'telepon' => '081234567890', 'email' => 'budi@suksesjaya.com', 'alamat' => 'Jl. Industri No. 10, Cikarang', 'kota' => 'Bekasi'],
            ['kode_supplier' => 'SUP-002', 'nama_supplier' => 'CV Maju Bersama', 'nama_kontak' => 'Siti Aminah', 'telepon' => '081298765432', 'email' => 'siti@majubersama.com', 'alamat' => 'Jl. Raya Bogor KM 30', 'kota' => 'Bogor'],
            ['kode_supplier' => 'SUP-003', 'nama_supplier' => 'UD Sinar Terang', 'nama_kontak' => 'Ahmad Hidayat', 'telepon' => '081355544433', 'email' => 'ahmad@sinarterang.com', 'alamat' => 'Jl. Pasar Baru No. 5', 'kota' => 'Surabaya'],
        ];

        foreach ($suppliers as $sup) {
            Supplier::updateOrCreate(['kode_supplier' => $sup['kode_supplier']], $sup);
        }

        // ─── Customers ───

        $customers = [
            ['kode_customer' => 'CUS-001', 'nama' => 'Toko Sejahtera', 'telepon' => '081211112222', 'email' => 'toko@sejahtera.com', 'alamat' => 'Jl. Menteng No. 15, Jakarta Pusat'],
            ['kode_customer' => 'CUS-002', 'nama' => 'CV Makmur Sentosa', 'telepon' => '081233334444', 'email' => 'info@makmursentosa.com', 'alamat' => 'Jl. Gatot Subroto No. 88, Bandung'],
            ['kode_customer' => 'CUS-003', 'nama' => 'PT Global Trade', 'telepon' => '081255556666', 'email' => 'contact@globaltrade.co.id', 'alamat' => 'Jl. Sudirman No. 200, Jakarta Selatan'],
        ];

        foreach ($customers as $cus) {
            Customer::updateOrCreate(['kode_customer' => $cus['kode_customer']], $cus);
        }

        // ─── Barang ───

        $barangs = [
            ['kode_barang' => 'BRG-001', 'nama' => 'Laptop Asus X515', 'satuan' => 'unit', 'kategori_id' => 1, 'stok' => 25, 'gudang_rak' => 'G1-R1', 'harga_beli' => 7500000, 'harga_jual' => 8500000, 'kadaluarsa' => null, 'stok_min' => 5, 'deskripsi' => 'Laptop Asus 15 inch, Intel i5'],
            ['kode_barang' => 'BRG-002', 'nama' => 'Mouse Logitech M330', 'satuan' => 'pcs', 'kategori_id' => 1, 'stok' => 100, 'gudang_rak' => 'G1-R2', 'harga_beli' => 150000, 'harga_jual' => 200000, 'kadaluarsa' => null, 'stok_min' => 20, 'deskripsi' => 'Mouse wireless silent click'],
            ['kode_barang' => 'BRG-003', 'nama' => 'Kertas HVS A4 70gsm', 'satuan' => 'rim', 'kategori_id' => 3, 'stok' => 200, 'gudang_rak' => 'G2-R1', 'harga_beli' => 35000, 'harga_jual' => 45000, 'kadaluarsa' => null, 'stok_min' => 50, 'deskripsi' => 'Kertas HVS putih 500 lembar'],
            ['kode_barang' => 'BRG-004', 'nama' => 'Mie Instan Goreng', 'satuan' => 'karton', 'kategori_id' => 2, 'stok' => 150, 'gudang_rak' => 'G3-R1', 'harga_beli' => 85000, 'harga_jual' => 100000, 'kadaluarsa' => '2027-06-15', 'stok_min' => 30, 'deskripsi' => 'Mie instan goreng 40pcs/karton'],
            ['kode_barang' => 'BRG-005', 'nama' => 'Semen Portland 50kg', 'satuan' => 'sak', 'kategori_id' => 4, 'stok' => 80, 'gudang_rak' => 'G4-R1', 'harga_beli' => 55000, 'harga_jual' => 70000, 'kadaluarsa' => '2027-12-01', 'stok_min' => 15, 'deskripsi' => 'Semen Portland tipe I'],
        ];

        foreach ($barangs as $brg) {
            Barang::updateOrCreate(['kode_barang' => $brg['kode_barang']], $brg);
        }
    }
}