import React, { useState, useEffect } from "react";
import { Card, Table, Button, InputGroup, Form, Badge, Spinner, Modal } from "react-bootstrap";
import { FaSearch, FaCheck, FaTimes, FaInfoCircle, FaTrash, FaDownload, FaFilePdf, FaExclamationCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toast } from "react-toastify";
import TransaksiService from "../../services/transaksiService";

export default function BarangKeluarPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [approvedItem, setApprovedItem] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ lastPage: 1, total: 0, from: 0, to: 0 });

  useEffect(() => { fetchData(); }, [currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await TransaksiService.getAll({ jenis: 'keluar', per_page: 10, page: currentPage });
      const pg = res.data.data;
      setData(pg.data);
      setPagination({ lastPage: pg.last_page, total: pg.total, from: pg.from || 0, to: pg.to || 0 });
    } catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  };

  const filtered = data.filter(t =>
    (t.barang?.nama || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.barang?.kode_barang || "").toLowerCase().includes(search.toLowerCase()) ||
    t.kode_transaksi.toLowerCase().includes(search.toLowerCase())
  );

  const getPageNumbers = () => {
    const { lastPage } = pagination;
    if (lastPage <= 5) return Array.from({ length: lastPage }, (_, i) => i + 1);
    const pages = new Set([1, lastPage]);
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) pages.add(i);
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((p, idx) => { if (idx > 0 && p - sorted[idx - 1] > 1) result.push("..."); result.push(p); });
    return result;
  };

  const handleApprove = (id) => {
    setConfirmAction("approve");
    setConfirmId(id);
    setShowConfirmModal(true);
  };

  const handleReject = (id) => {
    setConfirmAction("reject");
    setConfirmId(id);
    setShowConfirmModal(true);
  };

  const handleDelete = (id) => {
    setConfirmAction("delete");
    setConfirmId(id);
    setShowConfirmModal(true);
  };

  const executeConfirmAction = async () => {
    setShowConfirmModal(false);
    const id = confirmId;
    try {
      if (confirmAction === "approve") {
        const res = await TransaksiService.approve(id);
        toast.success("Transaksi disetujui! Invoice PDF sudah digenerate.");
        const approved = res.data.data;
        setApprovedItem(approved);
        setShowInvoiceModal(true);
      } else if (confirmAction === "reject") {
        await TransaksiService.reject(id);
        toast.success("Transaksi ditolak");
      } else if (confirmAction === "delete") {
        await TransaksiService.delete(id);
        toast.success("Transaksi berhasil dihapus");
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operasi gagal");
    }
  };

  const handleDownloadInvoice = async (id) => {
    try {
      const response = await TransaksiService.downloadInvoice(id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const contentDisposition = response.headers["content-disposition"];
      let filename = `invoice-${id}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Invoice tidak ditemukan");
    }
  };

  const statusBadge = (status) => {
    const map = { pending: "warning", diterima: "success", ditolak: "danger" };
    return <Badge bg={map[status] || "secondary"} pill className="px-3 py-2 fw-normal">{status?.charAt(0).toUpperCase() + status?.slice(1)}</Badge>;
  };

  if (loading && data.length === 0) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h3 className="mb-1">📤 Data Barang Keluar</h3>
      <p className="text-muted mb-4"><small>Menampilkan 10 data per halaman — prioritas: belum diverifikasi</small></p>
      <Card className="shadow-sm border-0" style={{ borderRadius: "16px" }}>
        <Card.Body>
          <div className="d-flex justify-content-end mb-3">
            <InputGroup style={{ maxWidth: 300 }}>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control placeholder="Cari Data..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
          </div>
          <Table hover responsive className="border-top">
            <thead className="table-dark">
              <tr>
                <th>#</th><th>Tanggal Keluar</th><th>Invoice</th><th>Kode Barang</th>
                <th>Nama Barang</th><th>Jumlah</th><th>Harga Jual</th><th>Gudang</th>
                <th>Tujuan/Customer</th><th>Keterangan</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id}>
                  <td>{(pagination.from || 0) + i}</td>
                  <td>{new Date(t.tanggal).toLocaleDateString("id-ID")}</td>
                  <td>
                    {t.invoice_number ? (
                      <small className="font-monospace">{t.invoice_number}</small>
                    ) : "-"}
                  </td>
                  <td><Badge bg="secondary" pill className="px-3 py-2 fw-normal">{t.barang?.kode_barang}</Badge></td>
                  <td>{t.barang?.nama}</td>
                  <td>{t.jumlah} {t.barang?.satuan || ""}</td>
                  <td>Rp {Number(t.harga_satuan || 0).toLocaleString("id-ID")}</td>
                  <td>{t.gudang?.kode_gudang || t.gudang_rak || "-"}</td>
                  <td>{t.customer?.nama || t.pengambil || "-"}</td>
                  <td>{t.keterangan || "-"}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td className="text-nowrap">
                    <Button size="sm" variant="outline-info" className="me-1" onClick={() => { setSelected(t); setShowInfo(true); }}><FaInfoCircle /></Button>
                    {t.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline-success" className="me-1" onClick={() => handleApprove(t.id)} title="Setujui"><FaCheck /></Button>
                        <Button size="sm" variant="outline-danger" className="me-1" onClick={() => handleReject(t.id)} title="Tolak"><FaTimes /></Button>
                      </>
                    )}
                    {t.status === "diterima" && (t.invoice_generated || t.invoice_file) && (
                      <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleDownloadInvoice(t.id)} title="Download Invoice">
                        <FaDownload />
                      </Button>
                    )}
                    {t.status !== "diterima" && (
                      <Button size="sm" variant="outline-dark" onClick={() => handleDelete(t.id)} title="Hapus"><FaTrash /></Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={12} className="text-center text-muted">Tidak ada data</td></tr>}
            </tbody>
          </Table>

          {/* Pagination Controls */}
          {pagination.lastPage > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <small className="text-muted">
                Menampilkan {pagination.from}–{pagination.to} dari {pagination.total} data
              </small>
              <div className="d-flex align-items-center gap-1">
                <Button size="sm" variant="outline-primary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <FaChevronLeft className="me-1" /> Previous
                </Button>
                {getPageNumbers().map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-muted">…</span>
                  ) : (
                    <Button key={p} size="sm" variant={p === currentPage ? "primary" : "outline-primary"} onClick={() => setCurrentPage(p)} style={{ minWidth: 36 }}>
                      {p}
                    </Button>
                  )
                )}
                <Button size="sm" variant="outline-primary" disabled={currentPage === pagination.lastPage} onClick={() => setCurrentPage(p => p + 1)}>
                  Next <FaChevronRight className="ms-1" />
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Detail Modal */}
      <Modal show={showInfo} onHide={() => setShowInfo(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Detail Barang Keluar</Modal.Title></Modal.Header>
        <Modal.Body>
          {selected && (
            <div>
              <p><strong>Kode Transaksi:</strong> {selected.kode_transaksi}</p>
              <p><strong>Tanggal:</strong> {new Date(selected.tanggal).toLocaleDateString("id-ID")}</p>
              <p><strong>Invoice:</strong> {selected.invoice_number || "-"}</p>
              <p><strong>Barang:</strong> {selected.barang?.kode_barang} - {selected.barang?.nama}</p>
              <p><strong>Jumlah:</strong> {selected.jumlah} {selected.barang?.satuan}</p>
              <p><strong>Harga Jual:</strong> Rp {Number(selected.harga_satuan || 0).toLocaleString("id-ID")}</p>
              <p><strong>Customer:</strong> {selected.customer?.nama || selected.pengambil || "-"}</p>
              <p><strong>Gudang:</strong> {selected.gudang?.kode_gudang ? `${selected.gudang.kode_gudang} - ${selected.gudang.nama_gudang}` : (selected.gudang_rak || "-")}</p>
              <p><strong>Status:</strong> {statusBadge(selected.status)}</p>
              <p><strong>Keterangan:</strong> {selected.keterangan || "-"}</p>
              {selected.status === "diterima" && selected.approved_by_user && (
                <p><strong>Disetujui oleh:</strong> {selected.approved_by_user.name} pada {selected.approved_at ? new Date(selected.approved_at).toLocaleString("id-ID") : "-"}</p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selected?.status === "diterima" && (selected.invoice_generated || selected.invoice_file) && (
            <Button variant="primary" onClick={() => handleDownloadInvoice(selected.id)}>
              <FaDownload className="me-2" />Download Invoice
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowInfo(false)}>Tutup</Button>
        </Modal.Footer>
      </Modal>

      {/* Invoice Success Modal - shown after approve */}
      <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>✅ Transaksi Disetujui!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <FaFilePdf size={64} className="text-danger" />
          </div>
          <h5>Invoice PDF telah dibuat otomatis</h5>
          <p className="text-muted">
            Transaksi <strong>{approvedItem?.kode_transaksi}</strong> berhasil disetujui.
            <br />Stok telah dikurangi dan invoice PDF sudah digenerate.
          </p>
          {approvedItem?.invoice_number && (
            <Badge bg="info" className="fs-6 mb-2">
              No. Invoice: {approvedItem.invoice_number}
            </Badge>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="primary" size="lg" onClick={() => approvedItem && handleDownloadInvoice(approvedItem.id)}>
            <FaDownload className="me-2" />Download Invoice PDF
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowInvoiceModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered size="sm">
        <Modal.Body className="p-4 text-center">
          <FaExclamationCircle size={48} className={`mb-3 ${confirmAction === 'delete' ? 'text-danger' : 'text-warning'}`} />
          <h5 className="mb-3 fw-bold">Konfirmasi</h5>
          <p className="text-muted mb-4">
            {confirmAction === 'approve' && "Setujui transaksi ini? Stok akan dikurangi dan invoice PDF akan otomatis digenerate."}
            {confirmAction === 'reject' && "Apakah Anda yakin ingin menolak transaksi ini?"}
            {confirmAction === 'delete' && "Hapus transaksi ini? Data yang sudah dihapus tidak bisa dikembalikan."}
          </p>
          <div className="d-flex gap-2">
            <Button 
              variant={confirmAction === 'delete' || confirmAction === 'reject' ? "danger" : "primary"}
              className="w-50 rounded-pill" 
              onClick={executeConfirmAction}
            >
              Ya, Lanjutkan
            </Button>
            <Button 
              variant="outline-secondary" 
              className="w-50 rounded-pill" 
              onClick={() => setShowConfirmModal(false)}
            >
              Batal
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
