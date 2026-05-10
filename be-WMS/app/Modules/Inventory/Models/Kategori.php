<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    use HasFactory;

    protected $table = 'kategoris';

    protected $fillable = [
        'kode_kategori',
        'nama_kategori',
    ];

    /**
     * Relasi ke barang.
     */
    public function barangs()
    {
        return $this->hasMany(Barang::class, 'kategori_id');
    }
}
