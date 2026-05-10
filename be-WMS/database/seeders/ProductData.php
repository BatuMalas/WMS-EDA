<?php
namespace Database\Seeders;

class ProductData
{
    // Format: [nama, satuan, kat_idx, harga_beli, harga_jual, kadaluarsa(null/date), stok_min, batas_aging]
    public static function all(): array
    {
        return array_merge(
            self::pupuk(),
            self::pestisida(),
            self::benih(),
            self::alatPertanian(),
            self::sukuCadang(),
            self::pakanTernak(),
            self::obatHewan(),
            self::irigasi()
        );
    }

    private static function pupuk(): array
    {
        return [
            ['Pupuk Urea Petrokimia 50kg','sak',0,115000,135000,null,20,180],
            ['Pupuk Urea Non-Subsidi 50kg','sak',0,145000,170000,null,15,180],
            ['Pupuk NPK Phonska 50kg','sak',0,135000,160000,null,15,180],
            ['Pupuk NPK Mutiara 16-16-16 25kg','sak',0,185000,215000,null,10,180],
            ['Pupuk NPK Mahkota 15-15-15 50kg','sak',0,155000,180000,null,12,180],
            ['Pupuk ZA Petrokimia 50kg','sak',0,95000,115000,null,10,180],
            ['Pupuk SP-36 Superfosfat 50kg','sak',0,120000,145000,null,10,180],
            ['Pupuk SP-18 50kg','sak',0,85000,105000,null,8,180],
            ['Pupuk KCl Muriate of Potash 50kg','sak',0,180000,210000,null,8,180],
            ['Pupuk Organik Petroganik 40kg','sak',0,25000,35000,null,20,365],
            ['Pupuk Organik Super Bionik 25kg','sak',0,32000,45000,null,15,365],
            ['Pupuk Kandang Fermentasi 25kg','sak',0,15000,25000,null,25,365],
            ['Pupuk Kompos Granul 25kg','sak',0,20000,30000,null,20,365],
            ['Pupuk Dolomit 50kg','sak',0,18000,28000,null,15,365],
            ['Kapur Pertanian (Kaptan) 50kg','sak',0,12000,20000,null,20,365],
            ['Pupuk Daun Gandasil D 500gr','bungkus',0,28000,38000,null,10,120],
            ['Pupuk Daun Gandasil B 500gr','bungkus',0,30000,42000,null,10,120],
            ['Pupuk Daun Growmore 32-10-10 100gr','bungkus',0,22000,32000,null,8,120],
            ['Pupuk Daun Growmore 10-55-10 100gr','bungkus',0,25000,35000,null,8,120],
            ['Pupuk Cair NASA 500ml','botol',0,65000,85000,null,10,120],
            ['Pupuk Cair Super NASA 500ml','botol',0,75000,95000,null,8,120],
            ['Pupuk Cair POC Hayati 1L','botol',0,35000,48000,null,12,120],
            ['Pupuk TSP 46% 50kg','sak',0,140000,165000,null,8,180],
            ['Pupuk MKP (Mono Potassium) 1kg','bungkus',0,45000,60000,null,5,120],
            ['Pupuk Kalsium Boron 1kg','bungkus',0,35000,48000,null,5,120],
            ['Pupuk Magnesium Sulfat (MgSO4) 1kg','bungkus',0,18000,28000,null,5,120],
            ['Pupuk Mikro Lengkap 1kg','bungkus',0,42000,55000,null,5,120],
            ['Pupuk Humic Acid Granul 25kg','sak',0,55000,72000,null,8,180],
            ['Pupuk Silika 50kg','sak',0,38000,52000,null,10,365],
            ['Pupuk Borat 1kg','bungkus',0,28000,38000,null,5,120],
            ['Pupuk Kieserit (MgSO4) 50kg','sak',0,75000,95000,null,8,180],
            ['Pupuk Rock Phosphate 50kg','sak',0,45000,60000,null,10,180],
            ['Pupuk Amonium Nitrat 25kg','sak',0,125000,150000,null,5,180],
            ['Pupuk Cair Bioboost 500ml','botol',0,55000,72000,null,8,120],
            ['Pupuk Guano Kelelawar 25kg','sak',0,35000,48000,null,10,365],
        ];
    }

    private static function pestisida(): array
    {
        return [
            ['Herbisida Roundup 486SL 1L','botol',1,85000,105000,'2027-08-15',15,90],
            ['Herbisida Gramoxone 276SL 1L','botol',1,92000,115000,'2027-09-10',12,90],
            ['Herbisida Ally Plus 77WP 10gr','sachet',1,18000,25000,'2027-07-20',20,90],
            ['Herbisida Clincher 100EC 250ml','botol',1,55000,72000,'2027-10-01',8,90],
            ['Herbisida Nominee 100OD 250ml','botol',1,62000,80000,'2027-11-15',8,90],
            ['Insektisida Decis 25EC 250ml','botol',1,65000,82000,'2027-06-20',10,90],
            ['Insektisida Regent 50SC 250ml','botol',1,78000,98000,'2027-08-01',8,90],
            ['Insektisida Prevathon 50SC 100ml','botol',1,85000,108000,'2027-09-15',6,90],
            ['Insektisida Virtako 300SC 100ml','botol',1,72000,92000,'2027-07-10',8,90],
            ['Insektisida Furadan 3GR 1kg','bungkus',1,35000,48000,'2027-12-01',10,90],
            ['Insektisida Marshal 200EC 500ml','botol',1,58000,75000,'2027-10-20',8,90],
            ['Insektisida Confidor 200SL 250ml','botol',1,82000,105000,'2027-08-25',6,90],
            ['Insektisida Demolish 18EC 250ml','botol',1,45000,60000,'2027-11-10',8,90],
            ['Fungisida Dithane M-45 80WP 1kg','bungkus',1,75000,95000,'2027-10-01',10,90],
            ['Fungisida Antracol 70WP 1kg','bungkus',1,85000,108000,'2027-09-20',8,90],
            ['Fungisida Score 250EC 250ml','botol',1,95000,120000,'2027-11-01',6,90],
            ['Fungisida Amistartop 325SC 250ml','botol',1,110000,140000,'2027-12-15',5,90],
            ['Fungisida Nativo 75WG 30gr','sachet',1,35000,48000,'2027-08-10',10,90],
            ['Fungisida Folicur 250EC 250ml','botol',1,88000,112000,'2027-10-25',6,90],
            ['Akarisida Omite 570EC 500ml','botol',1,72000,92000,'2027-09-05',5,90],
            ['Moluskisida Bayluscide 250EC 100ml','botol',1,42000,55000,'2027-07-30',6,90],
            ['Rodentisida Racun Tikus Petrokimia 50gr','sachet',1,8000,12000,'2027-06-15',15,90],
            ['Perekat Perata Agristick 500ml','botol',1,28000,38000,'2027-12-01',8,120],
            ['ZPT Atonik 6.5L 250ml','botol',1,32000,45000,'2027-10-15',6,120],
            ['Pupuk Cair + Pestisida Orgenik 1L','botol',1,48000,65000,'2027-08-20',8,120],
            ['Insektisida Lannate 25WP 100gr','bungkus',1,35000,48000,'2027-09-25',8,90],
            ['Herbisida Goal 240EC 250ml','botol',1,52000,68000,'2027-10-10',6,90],
            ['Fungisida Benlox 50WP 100gr','bungkus',1,28000,38000,'2027-08-30',8,90],
            ['Insektisida Curacron 500EC 250ml','botol',1,68000,88000,'2027-11-20',6,90],
            ['Herbisida Lindomin 865SL 1L','botol',1,72000,92000,'2027-12-10',8,90],
        ];
    }

    private static function benih(): array
    {
        return [
            ['Benih Padi Ciherang 5kg','bungkus',2,65000,82000,'2027-03-01',25,120],
            ['Benih Padi IR64 5kg','bungkus',2,60000,75000,'2027-04-01',20,120],
            ['Benih Padi Inpari 32 5kg','bungkus',2,72000,90000,'2027-05-15',15,120],
            ['Benih Padi Mekongga 5kg','bungkus',2,68000,85000,'2027-04-20',15,120],
            ['Benih Padi Situ Bagendit 5kg','bungkus',2,62000,78000,'2027-03-15',12,120],
            ['Benih Jagung BISI-18 1kg','bungkus',2,85000,110000,'2027-05-01',15,120],
            ['Benih Jagung Pioneer P-21 1kg','bungkus',2,95000,125000,'2027-06-01',12,120],
            ['Benih Jagung NK-7328 1kg','bungkus',2,88000,115000,'2027-05-20',10,120],
            ['Benih Kedelai Anjasmoro 5kg','bungkus',2,55000,70000,'2027-04-10',12,120],
            ['Benih Kacang Tanah Kelinci 5kg','bungkus',2,48000,62000,'2027-03-25',10,120],
            ['Benih Cabai Merah TM-999 10gr','sachet',2,35000,48000,'2027-07-01',20,120],
            ['Benih Cabai Rawit Dewata 10gr','sachet',2,32000,45000,'2027-06-15',18,120],
            ['Benih Cabai Keriting Lado F1 10gr','sachet',2,38000,52000,'2027-08-01',15,120],
            ['Benih Tomat Permata F1 5gr','sachet',2,28000,38000,'2027-06-15',15,120],
            ['Benih Tomat Servo F1 5gr','sachet',2,32000,42000,'2027-07-20',12,120],
            ['Benih Bawang Merah Bima 500gr','bungkus',2,45000,60000,'2027-05-10',10,120],
            ['Benih Terong Ungu Antaboga 10gr','sachet',2,15000,22000,'2027-08-15',12,120],
            ['Benih Mentimun Harmony F1 50gr','bungkus',2,42000,55000,'2027-07-01',10,120],
            ['Benih Kangkung Bangkok LP-1 500gr','bungkus',2,18000,25000,'2027-09-01',15,120],
            ['Benih Bayam Maestro 500gr','bungkus',2,20000,28000,'2027-08-20',12,120],
            ['Benih Sawi Pagoda 100gr','bungkus',2,12000,18000,'2027-09-10',15,120],
            ['Benih Kacang Panjang Parade 100gr','bungkus',2,25000,35000,'2027-07-15',10,120],
            ['Benih Semangka Baginda F1 10gr','sachet',2,35000,48000,'2027-06-01',8,120],
            ['Benih Melon Action 434 10gr','sachet',2,38000,52000,'2027-06-20',8,120],
            ['Benih Labu Siam 5 biji','sachet',2,8000,12000,'2027-10-01',10,120],
            ['Bibit Singkong UJ-5 (100 stek)','ikat',2,85000,110000,null,5,90],
            ['Bibit Pisang Cavendish Kultur Jaringan','pcs',2,12000,18000,null,20,60],
            ['Bibit Pepaya California','pcs',2,8000,12000,null,15,60],
            ['Bibit Kelapa Sawit (umur 6 bulan)','pcs',2,25000,38000,null,10,90],
            ['Bibit Jeruk Siam Pontianak','pcs',2,15000,25000,null,10,90],
        ];
    }

    private static function alatPertanian(): array
    {
        return [
            ['Cangkul Baja Cap Garuda','pcs',3,45000,62000,null,5,365],
            ['Cangkul Baja Stainless Premium','pcs',3,65000,85000,null,3,365],
            ['Sabit Rumput Baja','pcs',3,25000,35000,null,8,365],
            ['Sabit Padi Bergerigi','pcs',3,18000,28000,null,8,365],
            ['Sprayer Manual 16L Swan','unit',3,185000,245000,null,3,365],
            ['Sprayer Manual 14L Tasco','unit',3,165000,215000,null,3,365],
            ['Sprayer Elektrik 16L CBA','unit',3,450000,575000,null,2,365],
            ['Sprayer Elektrik 20L Yoto','unit',3,520000,650000,null,2,365],
            ['Hand Tractor Quick G-1000','unit',3,28500000,32000000,null,1,730],
            ['Mesin Perontok Padi (Power Thresher)','unit',3,7500000,8800000,null,1,730],
            ['Mesin Penggiling Padi Mini','unit',3,4500000,5200000,null,1,730],
            ['Pompa Air Irigasi Alkon 2 inch','unit',3,1850000,2200000,null,2,365],
            ['Pompa Air Irigasi Alkon 3 inch','unit',3,2500000,2900000,null,1,365],
            ['Mesin Potong Rumput 2-Tak','unit',3,1250000,1500000,null,2,365],
            ['Mesin Potong Rumput 4-Tak Honda','unit',3,2800000,3250000,null,1,365],
            ['Knapsack Sprayer Maspion 5L','unit',3,85000,115000,null,5,365],
            ['Gembor Plastik 10L','pcs',3,35000,48000,null,5,365],
            ['Polybag 25x30cm (100pcs)','pack',3,18000,25000,null,10,365],
            ['Polybag 30x35cm (100pcs)','pack',3,22000,30000,null,10,365],
            ['Mulsa Plastik Hitam Perak 1.2m x 500m','roll',3,350000,420000,null,3,365],
            ['Paranet 65% Lebar 3m (per meter)','meter',3,8000,12000,null,20,365],
            ['Tali Rafia (1kg)','roll',3,18000,25000,null,8,365],
            ['Karung Plastik 50kg (100pcs)','ikat',3,150000,185000,null,5,365],
            ['Sekop Baja Gagang Kayu','pcs',3,55000,72000,null,3,365],
            ['Garpu Tanah 4 Mata','pcs',3,48000,65000,null,3,365],
            ['Gunting Dahan Bypass 8 inch','pcs',3,42000,58000,null,3,365],
            ['Pisau Okulasi Tempel','pcs',3,35000,48000,null,5,365],
            ['Ember Plastik 20L','pcs',3,15000,22000,null,10,365],
            ['Timba Cor 15L','pcs',3,12000,18000,null,10,365],
            ['Terpal Plastik 4x6m','lembar',3,65000,85000,null,5,365],
            ['Gerobak Dorong Roda 1','unit',3,285000,350000,null,2,365],
            ['Timbangan Duduk 100kg','unit',3,350000,425000,null,1,365],
            ['Jaring Penjemuran 3x4m','lembar',3,45000,60000,null,5,365],
            ['Plastik UV Greenhouse 6m x 1m','meter',3,12000,18000,null,15,365],
            ['Drum Plastik HDPE 200L','pcs',3,185000,235000,null,3,365],
        ];
    }

    private static function sukuCadang(): array
    {
        return [
            ['Pisau Mesin Potong Rumput (1 set)','set',4,35000,48000,null,5,365],
            ['Senar Potong Rumput 2.4mm 100m','roll',4,25000,35000,null,8,365],
            ['Nozzle Sprayer Kuningan 4 Lubang','pcs',4,8000,12000,null,10,365],
            ['Nozzle Sprayer Kerucut','pcs',4,5000,8000,null,10,365],
            ['Selang Sprayer PE 8.5mm (per meter)','meter',4,3000,5000,null,20,365],
            ['Pompa Sprayer Manual (Replacement)','pcs',4,45000,62000,null,3,365],
            ['Seal Kit Pompa Alkon 2 inch','set',4,35000,48000,null,3,365],
            ['Seal Kit Pompa Alkon 3 inch','set',4,42000,58000,null,3,365],
            ['Impeller Pompa Alkon 2 inch','pcs',4,85000,110000,null,2,365],
            ['Busi Mesin Potong Rumput NGK','pcs',4,15000,22000,null,8,365],
            ['Filter Udara Mesin Potong Rumput','pcs',4,18000,25000,null,5,365],
            ['V-Belt Mesin Perontok Padi A-68','pcs',4,28000,38000,null,3,365],
            ['V-Belt Mesin Perontok Padi B-72','pcs',4,32000,42000,null,3,365],
            ['Bearing 6205 (Mesin Pertanian)','pcs',4,18000,25000,null,5,365],
            ['Bearing 6204 (Pompa Air)','pcs',4,15000,22000,null,5,365],
            ['Piston Ring Mesin Diesel R-175','set',4,45000,62000,null,2,365],
            ['Liner Cylinder R-175','pcs',4,65000,85000,null,2,365],
            ['Fuel Injection Nozzle Diesel','pcs',4,55000,72000,null,2,365],
            ['Mata Pisau Bajak Singkal','pcs',4,75000,95000,null,3,365],
            ['Rantai Mesin Perontok (per meter)','meter',4,22000,32000,null,5,365],
            ['Gagang Cangkul Kayu Jati','pcs',4,15000,22000,null,8,365],
            ['Gagang Sabit Kayu','pcs',4,8000,12000,null,10,365],
            ['Roda Ban Gerobak 14 inch','pcs',4,85000,110000,null,3,365],
            ['Oli Mesin SAE 40 1L','botol',4,28000,38000,null,10,365],
            ['Gemuk/Grease Stempet 500gr','kaleng',4,22000,32000,null,5,365],
            ['Karburator Mesin Potong Rumput','pcs',4,65000,85000,null,2,365],
            ['Coil Ignition Mesin Diesel','pcs',4,42000,58000,null,3,365],
            ['Selang Bensin Mesin 5mm (per meter)','meter',4,5000,8000,null,15,365],
            ['Pulley Mesin Perontok 6 inch','pcs',4,38000,52000,null,3,365],
            ['Kampas Kopling Mesin Diesel R-175','set',4,55000,72000,null,2,365],
        ];
    }

    private static function pakanTernak(): array
    {
        return [
            ['Pakan Ayam Broiler BR-1 Starter 50kg','sak',5,310000,345000,'2027-02-15',10,90],
            ['Pakan Ayam Broiler BR-2 Grower 50kg','sak',5,295000,330000,'2027-03-01',8,90],
            ['Pakan Ayam Layer (Petelur) 50kg','sak',5,285000,320000,'2027-02-20',8,90],
            ['Pakan Ayam Kampung 50kg','sak',5,265000,295000,'2027-03-10',8,90],
            ['Pakan Ikan Lele Hi-Pro 781-2 30kg','sak',5,245000,280000,'2027-03-20',8,90],
            ['Pakan Ikan Lele PF-500 10kg','sak',5,95000,115000,'2027-04-01',10,90],
            ['Pakan Ikan Nila 30kg','sak',5,225000,260000,'2027-03-15',6,90],
            ['Pakan Itik/Bebek 50kg','sak',5,275000,310000,'2027-02-25',6,90],
            ['Pakan Sapi Konsentrat 50kg','sak',5,195000,230000,'2027-04-10',5,90],
            ['Pakan Kambing Konsentrat 50kg','sak',5,185000,215000,'2027-04-05',5,90],
            ['Dedak Padi Halus 50kg','sak',5,65000,82000,'2027-05-01',10,90],
            ['Jagung Pipil Kering (Pakan) 50kg','sak',5,125000,148000,'2027-06-01',8,120],
            ['Bungkil Kedelai 50kg','sak',5,185000,215000,'2027-04-15',5,90],
            ['Tepung Ikan 25kg','sak',5,145000,175000,'2027-03-25',5,90],
            ['Premix Vitamin Ternak 1kg','bungkus',5,45000,60000,'2027-12-01',5,120],
        ];
    }

    private static function obatHewan(): array
    {
        return [
            ['Vitamin Ternak B-Complex 1L','botol',6,55000,72000,'2027-12-01',5,120],
            ['Vaksin ND (Newcastle Disease) 1000 dosis','vial',6,28000,38000,'2027-06-01',8,60],
            ['Vaksin Gumboro (IBD) 1000 dosis','vial',6,32000,42000,'2027-07-01',6,60],
            ['Antibiotik Oxytetracycline 100ml','botol',6,25000,35000,'2027-10-01',8,120],
            ['Antibiotik Enrofloxacin 100ml','botol',6,32000,45000,'2027-11-15',6,120],
            ['Obat Cacing Ternak Albendazole 10ml','botol',6,18000,25000,'2027-09-01',8,120],
            ['Vitamin Unggas Vitastress 100gr','sachet',6,12000,18000,'2027-08-15',10,120],
            ['Desinfektan Kandang Medisep 1L','botol',6,35000,48000,'2027-12-01',5,120],
            ['Antiseptik Luka Ternak Gusanex 100ml','botol',6,28000,38000,'2027-10-20',6,120],
            ['Probiotik Ternak EM4 Peternakan 1L','botol',6,25000,35000,'2027-11-01',8,120],
        ];
    }

    private static function irigasi(): array
    {
        return [
            ['Selang Irigasi PE 1 inch 100m','roll',7,125000,165000,null,5,365],
            ['Selang Irigasi PE 3/4 inch 100m','roll',7,95000,125000,null,5,365],
            ['Pipa PVC 1 inch 4m','batang',7,22000,32000,null,10,365],
            ['Pipa PVC 2 inch 4m','batang',7,42000,55000,null,8,365],
            ['Pipa PVC 3 inch 4m','batang',7,65000,82000,null,5,365],
            ['Sambungan Pipa PVC 1 inch Elbow','pcs',7,3000,5000,null,15,365],
            ['Sambungan Pipa PVC 1 inch Tee','pcs',7,4000,6000,null,15,365],
            ['Kran Air PVC 1 inch','pcs',7,8000,12000,null,10,365],
            ['Kran Air PVC 2 inch','pcs',7,15000,22000,null,8,365],
            ['Lem Pipa PVC 100gr','tube',7,12000,18000,null,10,365],
            ['Seal Tape PTFE (10pcs)','pack',7,15000,22000,null,10,365],
            ['Sprinkler Taman Putar 1/2 inch','pcs',7,8000,12000,null,10,365],
            ['Drip Irrigation Kit (100 titik)','set',7,185000,245000,null,3,365],
            ['Timer Irigasi Digital Otomatis','unit',7,125000,165000,null,2,365],
            ['Selang Layflat 2 inch 100m','roll',7,185000,235000,null,3,365],
        ];
    }
}
