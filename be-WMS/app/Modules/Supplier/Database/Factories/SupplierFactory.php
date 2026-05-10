<?php

namespace App\Modules\Supplier\Database\Factories;

use App\Modules\Supplier\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Supplier\Models\Supplier>
 */
class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        return [
            'kode_supplier' => 'SUP' . Str::upper(Str::random(6)),
            'nama' => $this->faker->company(),
            'telepon' => $this->faker->phoneNumber(),
            'alamat' => $this->faker->address(),
            'email' => $this->faker->companyEmail(),
        ];
    }
}
