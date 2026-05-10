import React, { useState, useEffect } from "react";
import { Card, Table, Button, InputGroup, Form, Badge, Spinner, Modal } from "react-bootstrap";
import { FaSearch, FaCheck, FaTimes, FaInfoCircle, FaTrash, FaExclamationCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import TransaksiService from "../../services/transaksiService";

export default function BarangMasukPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await TransaksiService.getAll();
      setData(res.data.data.filter(t => t.jenis === "masuk"));
    } catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  };

  const filtered = data.filter(t =>
    (t.barang?.nama || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.barang?.kode_barang || "").toLowerCase().includes(search.toLowerCase()) ||
    t.kode_transaksi.toLowerCase().includes(search.toLowerCase())
  );

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
        await TransaksiService.approve(id);
        toast.success("Transaksi disetujui");
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

  const statusBadge = (status) => {
    const map = { pending: "warning", diterima: "success", ditolak: "danger" };
    return <Badge bg={map[status] || "secondary"} pill className="px-3 py-2 fw-normal">{status?.charAt(0).toUpperCase() + status?.slice(1)}</Badge>;
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h3 className="mb-4">📥 Data Barang Masuk</h3>
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
                <th>#</th><th>Tanggal Masuk</th><th>Kode Barang</th><th>Nama Barang</th>
                <th>Jumlah</th><th>Harga Beli</th><th>Supplier</th><th>Gudang-Rak</th>
                <th>Keterangan</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id}>
                  <td>{i + 1}</td>
                  <td>{new Date(t.tanggal).toLocaleDateString("id-ID")}</td>
                  <td><Badge bg="secondary" pill className="px-3 py-2 fw-normal">{t.barang?.kode_barang}</Badge></td>
                  <td>{t.barang?.nama}</td>
                  <td>{t.jumlah} {t.barang?.satuan || ""}</td>
                  <td>Rp {Number(t.harga_satuan || 0).toLocaleString("id-ID")}</td>
                  <td>{t.supplier?.nama_supplier || "-"}</td>
                  <td>{t.gudang_rak || "-"}</td>
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
                    {t.status !== "diterima" && (
                      <Button size="sm" variant="outline-dark" onClick={() => handleDelete(t.id)} title="Hapus"><FaTrash /></Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={11} className="text-center text-muted">Tidak ada data</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showInfo} onHide={() => setShowInfo(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Detail Barang Masuk</Modal.Title></Modal.Header>
        <Modal.Body>
          {selected && (
            <div>
              <p><strong>Kode Transaksi:</strong> {selected.kode_transaksi}</p>
              <p><strong>Tanggal:</strong> {new Date(selected.tanggal).toLocaleDateString("id-ID")}</p>
              <p><strong>Barang:</strong> {selected.barang?.kode_barang} - {selected.barang?.nama}</p>
              <p><strong>Jumlah:</strong> {selected.jumlah} {selected.barang?.satuan}</p>
              <p><strong>Harga Beli:</strong> Rp {Number(selected.harga_satuan || 0).toLocaleString("id-ID")}</p>
              <p><strong>Supplier:</strong> {selected.supplier?.nama_supplier || "-"}</p>
              <p><strong>Gudang-Rak:</strong> {selected.gudang_rak || "-"}</p>
              <p><strong>Status:</strong> {statusBadge(selected.status)}</p>
              <p><strong>Keterangan:</strong> {selected.keterangan || "-"}</p>
              {selected.approved_by_user && <p><strong>Diproses oleh:</strong> {selected.approved_by_user.name}</p>}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered size="sm">
        <Modal.Body className="p-4 text-center">
          <FaExclamationCircle size={48} className={`mb-3 ${confirmAction === 'delete' ? 'text-danger' : 'text-warning'}`} />
          <h5 className="mb-3 fw-bold">Konfirmasi</h5>
          <p className="text-muted mb-4">
            {confirmAction === 'approve' && "Apakah Anda yakin ingin menyetujui transaksi ini?"}
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
