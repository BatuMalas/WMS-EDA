import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Export ke Excel
export const exportToExcel = (data, filename = "laporan") => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Export ke PDF
export const exportToPDF = (title, headers, data, filename = "laporan") => {
  const doc = new jsPDF();

  // Judul
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Tanggal
  doc.setFontSize(11);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 32);

  // Table
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 40,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save(`${filename}.pdf`);
};

// Format data untuk export
export const formatBarangForExport = (barang) => {
  return barang.map((item) => ({
    "Kode Barang": item.kode_barang,
    Nama: item.nama,
    Stok: item.stok,
    Lokasi: item.lokasi,
    Keterangan: item.keterangan || "-",
    Status: item.stok < 5 ? "Rendah" : item.stok < 10 ? "Sedang" : "Aman",
  }));
};

export const formatTransaksiForExport = (transaksi) => {
  return transaksi.map((item) => ({
    "Kode Transaksi": item.kode_transaksi,
    Tanggal: new Date(item.tanggal).toLocaleDateString("id-ID"),
    Jenis: item.jenis,
    Barang: item.barang?.nama || "-",
    Jumlah: item.jumlah,
    Supplier: item.supplier?.nama || "-",
    Keterangan: item.keterangan || "-",
  }));
};
