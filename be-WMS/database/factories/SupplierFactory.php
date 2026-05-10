<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Supplier>
 */
class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
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