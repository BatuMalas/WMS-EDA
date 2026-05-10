<?php

namespace App\Modules\Supplier\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $table = 'suppliers';

    protected $fillable = [
        'kode_supplier',
        'nama_supplier',
        'nama_kontak',
        'telepon',
        'alamat',
        'email',
        'kota',
    ];

    /**
     * Relasi ke transaksi.
     */
    public function transaksis()
    {
        return $this->hasMany(\App\Modules\Transaction\Models\Transaksi::class);
    }

    /**
     * Override factory untuk mendukung namespace modul.
     */
    protected static function newFactory()
    {
        return \App\Modules\Supplier\Database\Factories\SupplierFactory::new();
    }
}
