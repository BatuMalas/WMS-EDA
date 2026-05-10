<?php

namespace App\Modules\Customer\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';

    protected $fillable = [
        'kode_customer',
        'nama',
        'telepon',
        'email',
        'alamat',
    ];

    /**
     * Relasi ke transaksi keluar.
     */
    public function transaksis()
    {
        return $this->hasMany(\App\Modules\Transaction\Models\Transaksi::class);
    }
}
