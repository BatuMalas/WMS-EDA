<?php

namespace App\Modules\Transaction\Database\Factories;

use App\Modules\Inventory\Models\Barang;
use App\Modules\Supplier\Models\Supplier;
use App\Modules\Transaction\Models\Transaksi;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Transaction\Models\Transaksi>
 */
class TransaksiFactory extends Factory
{
    protected $model = Transaksi::class;

    public function definition(): array
    {
        $jenis = $this->faker->randomElement(['masuk', 'keluar']);

        return [
            'kode_transaksi' => 'TRX' . date('Ymd') . $this->faker->unique()->numberBetween(1000, 9999),
            'jenis' => $jenis,
            'tanggal' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'barang_id' => Barang::factory(),
            'jumlah' => $this->faker->numberBetween(1, 50),
            'supplier_id' => $jenis === 'masuk' ? Supplier::factory() : null,
            'penerima' => $jenis === 'masuk' ? $this->faker->name() : null,
            'pengambil' => $jenis === 'keluar' ? $this->faker->name() : null,
            'keterangan' => $this->faker->sentence(),
        ];
    }
}
