<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaksi>
 */
class TransaksiFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $jenis = $this->faker->randomElement(['masuk', 'keluar']);
        
        return [
            'kode_transaksi' => 'TRX' . date('Ymd') . $this->faker->unique()->numberBetween(1000, 9999),
            'jenis' => $jenis,
            'tanggal' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'barang_id' => \App\Models\Barang::factory(),
            'jumlah' => $this->faker->numberBetween(1, 50),
            'supplier_id' => $jenis === 'masuk' ? \App\Models\Supplier::factory() : null,
            'penerima' => $jenis === 'masuk' ? $this->faker->name() : null,
            'pengambil' => $jenis === 'keluar' ? $this->faker->name() : null,
            'keterangan' => $this->faker->sentence(),
        ];
    }
}