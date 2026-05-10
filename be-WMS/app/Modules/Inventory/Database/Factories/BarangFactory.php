<?php

namespace App\Modules\Inventory\Database\Factories;

use App\Modules\Inventory\Models\Barang;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Inventory\Models\Barang>
 */
class BarangFactory extends Factory
{
    protected $model = Barang::class;

    public function definition(): array
    {
        return [
            'kode_barang' => 'BRG' . Str::upper(Str::random(6)),
            'nama' => $this->faker->words(3, true),
            'stok' => $this->faker->numberBetween(0, 100),
            'lokasi' => 'RAK-' . $this->faker->randomElement(['A', 'B', 'C']) . $this->faker->numberBetween(1, 20),
            'keterangan' => $this->faker->sentence(),
        ];
    }
}
