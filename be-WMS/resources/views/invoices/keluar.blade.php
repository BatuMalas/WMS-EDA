<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $transaksi->kode_transaksi }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }

        .header { border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { font-size: 22px; color: #2563eb; margin-bottom: 2px; }
        .header .company { font-size: 10px; color: #666; }

        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 28px; color: #2563eb; text-transform: uppercase; }
        .invoice-title .invoice-number { font-size: 14px; color: #666; }

        .info-table { width: 100%; margin-bottom: 20px; }
        .info-table td { padding: 4px 8px; vertical-align: top; }
        .info-label { font-weight: bold; color: #555; width: 140px; }

        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background-color: #2563eb; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
        .items-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .items-table tr:nth-child(even) { background-color: #f9fafb; }

        .fifo-section { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
        .fifo-section h3 { color: #92400e; font-size: 13px; margin-bottom: 8px; }
        .fifo-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .fifo-table th { background-color: #f59e0b; color: white; padding: 6px; text-align: left; }
        .fifo-table td { padding: 6px; border-bottom: 1px solid #fcd34d; }

        .footer { margin-top: 40px; }
        .signature-area { display: flex; width: 100%; margin-top: 30px; }
        .signature-box { width: 33%; text-align: center; padding: 10px; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }

        .stamp { text-align: center; margin-top: 20px; padding: 8px; background-color: #f0f9ff; border: 1px dashed #2563eb; border-radius: 4px; }
        .stamp small { color: #2563eb; }

        .total-box { background-color: #2563eb; color: white; padding: 12px 20px; display: inline-block; border-radius: 6px; font-size: 16px; }
    </style>
</head>
<body>
    {{-- Header --}}
    <table style="width: 100%; margin-bottom: 20px;">
        <tr>
            <td style="width: 60%;">
                <div class="header" style="border: none; padding: 0;">
                    <h1>UD. ADHI TANI MULYO</h1>
                    <div class="company">
                        Warehouse Management System<br>
                        Invoice Barang Keluar
                    </div>
                </div>
            </td>
            <td style="width: 40%; text-align: right;">
                <div class="invoice-title">
                    <h2>INVOICE</h2>
                    <div class="invoice-number">{{ $transaksi->kode_transaksi }}</div>
                </div>
            </td>
        </tr>
    </table>

    <hr style="border: 1.5px solid #2563eb; margin-bottom: 20px;">

    {{-- Info Transaksi --}}
    <table class="info-table">
        <tr>
            <td class="info-label">Kode Transaksi</td>
            <td>: {{ $transaksi->kode_transaksi }}</td>
            <td class="info-label">Tanggal</td>
            <td>: {{ $transaksi->tanggal->format('d F Y') }}</td>
        </tr>
        <tr>
            <td class="info-label">Jenis Transaksi</td>
            <td>: <strong style="color: #dc2626;">BARANG KELUAR</strong></td>
            <td class="info-label">Dibuat</td>
            <td>: {{ $transaksi->created_at->format('d/m/Y H:i') }}</td>
        </tr>
        <tr>
            <td class="info-label">Pengambil</td>
            <td>: {{ $transaksi->pengambil ?? '-' }}</td>
            <td class="info-label">Penerima</td>
            <td>: {{ $transaksi->penerima ?? '-' }}</td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 12%;">Kode Barang</th>
                <th style="width: 25%;">Nama Barang</th>
                <th style="width: 10%;">Lokasi</th>
                <th style="width: 10%;">Jumlah</th>
                <th style="width: 15%;">Harga Satuan</th>
                <th style="width: 15%;">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>{{ $transaksi->barang->kode_barang ?? '-' }}</td>
                <td><strong>{{ $transaksi->barang->nama ?? '-' }}</strong></td>
                <td>{{ $transaksi->barang->lokasi ?? '-' }}</td>
                <td style="text-align: center;">{{ $transaksi->jumlah }} unit</td>
                <td style="text-align: right;">Rp {{ number_format($transaksi->harga_satuan ?? 0, 0, ',', '.') }}</td>
                <td style="text-align: right;"><strong>Rp {{ number_format(($transaksi->jumlah ?? 0) * ($transaksi->harga_satuan ?? 0), 0, ',', '.') }}</strong></td>
            </tr>
        </tbody>
    </table>

    {{-- FIFO Detail --}}
    @if(!empty($fifoDetail) && count($fifoDetail) > 0)
    <div class="fifo-section">
        <h3>📦 Detail FIFO — Batch yang Dikeluarkan</h3>
        <table class="fifo-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Kode Batch</th>
                    <th>Tanggal Masuk</th>
                    <th>Diambil</th>
                    <th>Sisa Batch</th>
                </tr>
            </thead>
            <tbody>
                @foreach($fifoDetail as $index => $detail)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $detail['kode_batch'] }}</td>
                    <td>{{ $detail['tanggal_masuk'] }}</td>
                    <td><strong>{{ $detail['diambil'] }} unit</strong></td>
                    <td>{{ $detail['sisa_stok_batch'] }} unit</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- Total --}}
    <div style="text-align: right; margin-bottom: 30px;">
        <table style="margin-left: auto;">
            <tr>
                <td style="padding: 4px 12px; text-align: right;">Jumlah:</td>
                <td style="padding: 4px 12px; text-align: right;"><strong>{{ $transaksi->jumlah }} unit</strong></td>
            </tr>
            @if(($transaksi->harga_satuan ?? 0) > 0)
            <tr>
                <td style="padding: 4px 12px; text-align: right;">Harga Satuan:</td>
                <td style="padding: 4px 12px; text-align: right;">Rp {{ number_format($transaksi->harga_satuan, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 12px; text-align: right; border-top: 2px solid #333;"><strong>TOTAL:</strong></td>
                <td style="padding: 8px 12px; text-align: right; border-top: 2px solid #333;">
                    <div class="total-box">Rp {{ number_format($transaksi->jumlah * $transaksi->harga_satuan, 0, ',', '.') }}</div>
                </td>
            </tr>
            @endif
        </table>
    </div>

    {{-- Keterangan --}}
    @if($transaksi->keterangan)
    <div style="background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
        <strong>Keterangan:</strong><br>
        {{ $transaksi->keterangan }}
    </div>
    @endif

    {{-- Tanda Tangan --}}
    <div class="footer">
        <table style="width: 100%;">
            <tr>
                <td style="width: 33%; text-align: center; padding: 10px;">
                    <p>Disetujui oleh,</p>
                    <div class="signature-line">
                        <strong>Kepala Gudang</strong>
                    </div>
                </td>
                <td style="width: 33%; text-align: center; padding: 10px;">
                    <p>Diserahkan oleh,</p>
                    <div class="signature-line">
                        <strong>Petugas Gudang</strong>
                    </div>
                </td>
                <td style="width: 33%; text-align: center; padding: 10px;">
                    <p>Diterima oleh,</p>
                    <div class="signature-line">
                        <strong>{{ $transaksi->pengambil ?? '________________' }}</strong>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- Stamp --}}
    <div class="stamp">
        <small>Dokumen ini digenerate secara otomatis oleh sistem WMS — UD. ADHI TANI MULYO</small><br>
        <small>{{ now()->format('d/m/Y H:i:s') }}</small>
    </div>
</body>
</html>
