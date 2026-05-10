<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Customer\Models\Customer;
use App\Modules\Inventory\Models\Barang;
use App\Modules\Inventory\Models\BatchOutflow;
use App\Modules\Inventory\Models\Gudang;
use App\Modules\Inventory\Models\Kategori;
use App\Modules\Inventory\Models\StockBatch;
use App\Modules\Supplier\Models\Supplier;
use App\Modules\Transaction\Models\Transaksi;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class RealisticDataSeeder extends Seeder
{
    public function run(): void
    {
        // ─── USERS: 1 Admin, 3 Manajer, 6 Petugas ───
        $users = [];
        $users[] = User::updateOrCreate(['username' => 'admin'], [
            'name' => 'Pak Sutrisno', 'email' => 'admin@adhitanimulyo.com',
            'password' => 'password', 'role' => 'admin',
            'phone' => '0812-3456-7890', 'address' => 'Jl. Raya Nganjuk No. 10',
        ]);

        $manajerData = [
            ['manajer1', 'Bu Wati Handayani', 'wati@adhitanimulyo.com', '0811-2233-4455', 'Jl. Diponegoro No. 25, Nganjuk'],
            ['manajer2', 'Pak Bambang Supriyadi', 'bambang@adhitanimulyo.com', '0812-5566-7788', 'Jl. Kartini No. 12, Nganjuk'],
            ['manajer3', 'Pak Heru Prasetyo', 'heru@adhitanimulyo.com', '0813-4455-6677', 'Jl. Ahmad Yani No. 45, Nganjuk'],
        ];
        $manajers = [];
        foreach ($manajerData as $m) {
            $manajers[] = User::updateOrCreate(['username' => $m[0]], [
                'name' => $m[1], 'email' => $m[2], 'password' => 'password',
                'role' => 'manajer', 'phone' => $m[3], 'address' => $m[4],
            ]);
        }

        $petugasData = [
            ['petugas1', 'Mas Andi Wijaya', 'andi@adhitanimulyo.com', '0813-1111-2222', 'Ds. Loceret, Nganjuk'],
            ['petugas2', 'Mas Rudi Hartono', 'rudi@adhitanimulyo.com', '0857-3333-4444', 'Ds. Bagor, Nganjuk'],
            ['petugas3', 'Mas Dedi Kurniawan', 'dedi@adhitanimulyo.com', '0821-5555-6666', 'Ds. Sukomoro, Nganjuk'],
            ['petugas4', 'Mbak Sari Dewi', 'sari@adhitanimulyo.com', '0858-7777-8888', 'Ds. Pace, Nganjuk'],
            ['petugas5', 'Mas Fajar Nugroho', 'fajar@adhitanimulyo.com', '0822-9999-0000', 'Ds. Tanjunganom, Nganjuk'],
            ['petugas6', 'Mas Yoga Pratama', 'yoga@adhitanimulyo.com', '0856-1212-3434', 'Ds. Gondang, Nganjuk'],
        ];
        $petugass = [];
        foreach ($petugasData as $p) {
            $petugass[] = User::updateOrCreate(['username' => $p[0]], [
                'name' => $p[1], 'email' => $p[2], 'password' => 'password',
                'role' => 'petugas', 'phone' => $p[3], 'address' => $p[4],
            ]);
        }
        $petugasNames = array_map(fn($p) => $p->name, $petugass);

        // ─── KATEGORI ───
        $katData = [
            ['KAT-001','Pupuk'], ['KAT-002','Pestisida & Herbisida'],
            ['KAT-003','Benih & Bibit'], ['KAT-004','Alat Pertanian'],
            ['KAT-005','Suku Cadang Alat Pertanian'], ['KAT-006','Pakan Ternak'],
            ['KAT-007','Obat Hewan'], ['KAT-008','Perlengkapan Irigasi'],
        ];
        $kats = [];
        foreach ($katData as $k) {
            $kats[] = Kategori::updateOrCreate(['kode_kategori' => $k[0]], [
                'kode_kategori' => $k[0], 'nama_kategori' => $k[1],
            ]);
        }

        // ─── GUDANG (12 lokasi) ───
        $gdgData = [
            ['G1-R1','Gudang 1 Rak 1','Pupuk granul & sak besar'],
            ['G1-R2','Gudang 1 Rak 2','Pupuk cair & daun'],
            ['G1-R3','Gudang 1 Rak 3','Pupuk organik & dolomit'],
            ['G2-R1','Gudang 2 Rak 1','Pestisida & herbisida cair'],
            ['G2-R2','Gudang 2 Rak 2','Fungisida & insektisida'],
            ['G3-R1','Gudang 3 Rak 1','Benih padi & palawija'],
            ['G3-R2','Gudang 3 Rak 2','Benih sayuran & bibit'],
            ['G4-R1','Gudang 4 Rak 1','Alat pertanian besar'],
            ['G4-R2','Gudang 4 Rak 2','Alat pertanian kecil & polybag'],
            ['G5-R1','Gudang 5 Rak 1','Suku cadang & sparepart'],
            ['G6-R1','Gudang 6 Rak 1','Pakan ternak & obat hewan'],
            ['G7-R1','Gudang 7 Rak 1','Perlengkapan irigasi & pipa'],
        ];
        $gudangs = [];
        foreach ($gdgData as $g) {
            $gudangs[] = Gudang::updateOrCreate(['kode_gudang' => $g[0]], [
                'kode_gudang' => $g[0], 'nama_gudang' => $g[1], 'deskripsi' => $g[2],
            ]);
        }

        // Map kategori_idx -> gudang indices
        $katGudangMap = [
            0 => [0,1,2], 1 => [3,4], 2 => [5,6], 3 => [7,8],
            4 => [9], 5 => [10], 6 => [10], 7 => [11],
        ];

        // ─── SUPPLIER (10) ───
        $supData = [
            ['SUP-001','PT Petrokimia Gresik','Hendra Wijaya','031-3981811','sales@petrokimia.com','Jl. Jend. A. Yani, Gresik','Gresik'],
            ['SUP-002','PT Pupuk Kalimantan Timur','Rina Sari','0542-765432','rina@pupukkaltim.com','Jl. James Simandjuntak, Bontang','Bontang'],
            ['SUP-003','CV Syngenta Indonesia','Budi Prasetyo','021-5512345','budi@syngenta.co.id','Jl. TB Simatupang, Jakarta','Jakarta'],
            ['SUP-004','PT Bayer CropScience','Dewi Lestari','021-5523456','dewi@bayer.co.id','Jl. Gatot Subroto, Jakarta','Jakarta'],
            ['SUP-005','PT EWINDO Seeds','Lisa Andani','022-7812345','lisa@ewindo.com','Jl. Raya Purwakarta, Subang','Subang'],
            ['SUP-006','CV Alat Tani Jaya','Agus Setiawan','0341-567890','agus@alattanijaya.com','Jl. Soekarno-Hatta, Malang','Malang'],
            ['SUP-007','UD Tani Makmur','Pak Darto','0858-1234-5678','darto@tanimakmur.com','Jl. Pasar Tani, Kediri','Kediri'],
            ['SUP-008','PT Charoen Pokphand','Surya Tan','031-8910111','surya@cp.co.id','Jl. Rungkut Industri, Surabaya','Surabaya'],
            ['SUP-009','PT Central Proteina Prima','Anton Halim','031-7654321','anton@cpp.co.id','Jl. Margomulyo, Surabaya','Surabaya'],
            ['SUP-010','CV Teknik Tani Mandiri','Pak Joko','0341-998877','joko@tekniktani.com','Jl. Industri, Malang','Malang'],
        ];
        $suppliers = [];
        foreach ($supData as $s) {
            $suppliers[] = Supplier::updateOrCreate(['kode_supplier' => $s[0]], [
                'kode_supplier'=>$s[0],'nama_supplier'=>$s[1],'nama_kontak'=>$s[2],
                'telepon'=>$s[3],'email'=>$s[4],'alamat'=>$s[5],'kota'=>$s[6],
            ]);
        }
        // Map kategori_idx -> supplier indices
        $katSupplierMap = [
            0=>[0,1], 1=>[2,3], 2=>[4,6], 3=>[5,9],
            4=>[5,9], 5=>[7,8], 6=>[3,7], 7=>[5,9],
        ];

        // ─── CUSTOMER (10) ───
        $cusData = [
            ['CUS-001','Toko Tani Berkah','0812-3456-1111','taniberkah@gmail.com','Jl. Raya Loceret No.5, Nganjuk'],
            ['CUS-002','KUD Sumber Rejeki','0813-2222-3333','kudsumberrejeki@yahoo.com','Ds. Bagor, Nganjuk'],
            ['CUS-003','Kelompok Tani Maju Jaya','0857-4444-5555','majujaya.tani@gmail.com','Ds. Sukomoro, Nganjuk'],
            ['CUS-004','UD Subur Tani','0821-6666-7777','suburtani@gmail.com','Jl. Pahlawan No.88, Jombang'],
            ['CUS-005','PT Agro Nusantara','0811-8888-9999','info@agronusantara.co.id','Jl. Industri Agro, Kediri'],
            ['CUS-006','Koperasi Petani Nganjuk','0822-1010-2020','koptani@gmail.com','Jl. A. Yani No.32, Nganjuk'],
            ['CUS-007','Toko Saprotan Jaya','0856-3030-4040','saprotanjaya@gmail.com','Jl. Raya Kertosono, Nganjuk'],
            ['CUS-008','CV Hasil Bumi Nusantara','0878-5050-6060','hasilbumi@gmail.com','Jl. Raya Madiun, Madiun'],
            ['CUS-009','Kelompok Tani Sejahtera','0819-7070-8080','tanisejahtera@gmail.com','Ds. Gondang, Nganjuk'],
            ['CUS-010','UD Berkah Tani','0838-9090-1010','berkahtani@gmail.com','Jl. Pasar Baru, Kediri'],
        ];
        $customers = [];
        foreach ($cusData as $c) {
            $customers[] = Customer::updateOrCreate(['kode_customer' => $c[0]], [
                'kode_customer'=>$c[0],'nama'=>$c[1],'telepon'=>$c[2],'email'=>$c[3],'alamat'=>$c[4],
            ]);
        }

        // ─── BARANG (200 produk) ───
        $products = ProductData::all();
        $this->command->info('Total produk: ' . count($products));

        $barangs = [];
        foreach ($products as $idx => $p) {
            $barangs[] = Barang::updateOrCreate(
                ['kode_barang' => sprintf('BRG-%03d', $idx + 1)],
                [
                    'kode_barang' => sprintf('BRG-%03d', $idx + 1),
                    'nama' => $p[0], 'satuan' => $p[1],
                    'kategori_id' => $kats[$p[2]]->id,
                    'stok' => 0, 'lokasi' => '-',
                    'harga_beli' => $p[3], 'harga_jual' => $p[4],
                    'kadaluarsa' => $p[5], 'stok_min' => $p[6],
                    'deskripsi' => $p[0], 'batas_aging_hari' => $p[7],
                ]
            );
        }

        // ─── TRANSAKSI MASUK (2-3 batch per barang, 3 bulan) ───
        $trxNum = 1;
        $batchNum = 1;

        foreach ($barangs as $idx => $brg) {
            $katIdx = $products[$idx][2];
            $gudangIdxs = $katGudangMap[$katIdx];
            $supIdxs = $katSupplierMap[$katIdx];

            // 2-3 batch masuk per barang
            $batchCount = ($idx % 3 === 0) ? 3 : 2;
            for ($b = 0; $b < $batchCount; $b++) {
                $daysAgo = rand(10, 90);
                $tgl = Carbon::now()->subDays($daysAgo);
                $gdg = $gudangs[$gudangIdxs[$b % count($gudangIdxs)]];
                $sup = $suppliers[$supIdxs[$b % count($supIdxs)]];
                $jumlah = $products[$idx][6] * rand(2, 6); // 2-6x stok_min
                $harga = $products[$idx][3] + ($b * rand(0, (int)($products[$idx][3] * 0.05)));
                $penerima = $petugasNames[array_rand($petugasNames)];
                $manajer = $manajers[array_rand($manajers)];

                $trx = Transaksi::create([
                    'kode_transaksi' => sprintf('TRM-%04d', $trxNum++),
                    'jenis' => 'masuk', 'tanggal' => $tgl->format('Y-m-d'),
                    'barang_id' => $brg->id, 'jumlah' => $jumlah,
                    'harga_satuan' => $harga, 'supplier_id' => $sup->id,
                    'gudang_id' => $gdg->id, 'gudang_rak' => $gdg->kode_gudang,
                    'penerima' => $penerima, 'status' => 'diterima',
                    'approved_by' => $manajer->id,
                    'approved_at' => $tgl->copy()->addHours(rand(1,4)),
                    'keterangan' => 'Pembelian dari ' . $sup->nama_supplier,
                ]);
                $trx->created_at = $tgl;
                $trx->save();

                StockBatch::create([
                    'kode_batch' => sprintf('BTH-%s-%03d', $tgl->format('Ymd'), $batchNum++),
                    'barang_id' => $brg->id, 'transaksi_masuk_id' => $trx->id,
                    'jumlah_masuk' => $jumlah, 'sisa_stok' => $jumlah,
                    'harga_satuan' => $harga,
                    'tanggal_masuk' => $tgl->format('Y-m-d'),
                    'tanggal_kadaluarsa' => $products[$idx][5],
                    'supplier_id' => $sup->id, 'gudang_id' => $gdg->id,
                    'keterangan' => 'Batch dari ' . $sup->nama_supplier,
                ]);
            }
        }
        $this->command->info('Transaksi masuk: ' . ($trxNum - 1));

        // ─── TRANSAKSI KELUAR (1-2 per barang, FIFO) ───
        $trxKelNum = 1;
        $invNum = 1;

        foreach ($barangs as $idx => $brg) {
            $keluarCount = ($idx % 4 === 0) ? 2 : 1;
            for ($k = 0; $k < $keluarCount; $k++) {
                $daysAgo = rand(3, 60);
                $tgl = Carbon::now()->subDays($daysAgo);
                $cust = $customers[array_rand($customers)];
                $manajer = $manajers[array_rand($manajers)];

                $totalStok = StockBatch::where('barang_id', $brg->id)->sum('sisa_stok');
                if ($totalStok < 2) continue;
                $jumlah = max(1, (int)($totalStok * rand(10, 30) / 100));

                $trx = Transaksi::create([
                    'kode_transaksi' => sprintf('TRK-%04d', $trxKelNum++),
                    'jenis' => 'keluar', 'tanggal' => $tgl->format('Y-m-d'),
                    'barang_id' => $brg->id, 'jumlah' => $jumlah,
                    'harga_satuan' => $products[$idx][4],
                    'customer_id' => $cust->id, 'pengambil' => $cust->nama,
                    'invoice_number' => sprintf('INV-OUT-%s-%03d', $tgl->format('Ymd'), $invNum++),
                    'status' => 'diterima',
                    'approved_by' => $manajer->id,
                    'approved_at' => $tgl->copy()->addHours(rand(1,5)),
                    'keterangan' => 'Penjualan ke ' . $cust->nama,
                ]);
                $trx->created_at = $tgl;
                $trx->save();

                // FIFO
                $remaining = $jumlah;
                $batches = StockBatch::where('barang_id', $brg->id)
                    ->where('sisa_stok', '>', 0)->orderBy('tanggal_masuk')->get();
                foreach ($batches as $batch) {
                    if ($remaining <= 0) break;
                    $take = min($remaining, $batch->sisa_stok);
                    $batch->sisa_stok -= $take;
                    $batch->save();
                    if (!$trx->gudang_id) {
                        $trx->update(['gudang_id' => $batch->gudang_id, 'gudang_rak' => $batch->gudang?->kode_gudang]);
                    }
                    BatchOutflow::create([
                        'transaksi_keluar_id' => $trx->id,
                        'stock_batch_id' => $batch->id, 'jumlah' => $take,
                    ]);
                    $remaining -= $take;
                }
            }
        }
        $this->command->info('Transaksi keluar: ' . ($trxKelNum - 1));

        // ─── TRANSAKSI PENDING (8 buah) ───
        $pendingItems = array_rand($barangs, 8);
        foreach ($pendingItems as $i => $bIdx) {
            $brg = $barangs[$bIdx];
            $isKeluar = $i >= 4;
            $tgl = Carbon::now()->subDays(rand(1, 3));
            Transaksi::create([
                'kode_transaksi' => $isKeluar ? sprintf('TRK-%04d', $trxKelNum++) : sprintf('TRM-%04d', $trxNum++),
                'jenis' => $isKeluar ? 'keluar' : 'masuk',
                'tanggal' => $tgl->format('Y-m-d'),
                'barang_id' => $brg->id,
                'jumlah' => rand(5, 30),
                'harga_satuan' => $isKeluar ? $products[$bIdx][4] : $products[$bIdx][3],
                'supplier_id' => $isKeluar ? null : $suppliers[array_rand($suppliers)]->id,
                'customer_id' => $isKeluar ? $customers[array_rand($customers)]->id : null,
                'gudang_id' => $isKeluar ? null : $gudangs[array_rand($gudangs)]->id,
                'penerima' => $isKeluar ? null : $petugasNames[array_rand($petugasNames)],
                'pengambil' => $isKeluar ? $customers[array_rand($customers)]->nama : null,
                'invoice_number' => $isKeluar ? sprintf('INV-OUT-%s-%03d', $tgl->format('Ymd'), $invNum++) : null,
                'status' => 'pending',
                'keterangan' => 'Menunggu approval manajer',
            ]);
        }

        // ─── Sync stok ───
        foreach ($barangs as $brg) {
            $brg->refresh();
            $brg->syncStokDariBatch();
        }

        $this->command->info('✅ Data realistis 200 barang berhasil di-seed!');
        $this->command->info('   Users: 1 admin + 3 manajer + 6 petugas (password: password)');
        $this->command->info('   Kategori: ' . count($kats) . ' | Gudang: ' . count($gudangs));
        $this->command->info('   Supplier: ' . count($suppliers) . ' | Customer: ' . count($customers));
        $this->command->info('   Barang: ' . count($barangs) . ' | Pending: 8');
    }
}
