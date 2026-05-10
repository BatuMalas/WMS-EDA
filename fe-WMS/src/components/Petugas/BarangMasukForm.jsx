import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Alert, Spinner, Table, Badge } from "react-bootstrap";
import { FaSave, FaArrowDown } from "react-icons/fa";
import { toast } from "react-toastify";
import TransaksiService from "../../services/transaksiService";
import BarangService from "../../services/barangService";
import SupplierService from "../../services/supplierService";
import GudangService from "../../services/gudangService";
import api from "../../services/api";

export default function BarangMasukForm() {
  const [barangs, setBarangs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [gudangs, setGudangs] = useState([]);
  const [recentData, setRecentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    kode_transaksi: "",
    jenis: "masuk",
    tanggal: new Date().toISOString().split("T")[0],
    barang_id: "",
    jumlah: "",
    harga_satuan: "",
    supplier_id: "",
    gudang_id: "",
    gudang_rak: "",
    keterangan: "",
  });

  useEffect(() => {
    Promise.all([
      BarangService.getAll(),
      SupplierService.getAll(),
      TransaksiService.getAll(),
      GudangService.getAll(),
    ]).then(([bRes, sRes, tRes, gRes]) => {
      setBarangs(bRes.data.data);
      setSuppliers(sRes.data.data);
      setGudangs(gRes.data.data || []);
      setRecentData(tRes.data.data.filter(t => t.jenis === "masuk").slice(0, 5));
      const count = tRes.data.data.filter(t => t.jenis === "masuk").length;
      setForm(f => ({ ...f, kode_transaksi: `TRM-${String(count + 1).padStart(4, "0")}` }));
    }).catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      await api.post("/transaksi", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Barang masuk berhasil dicatat (menunggu approval Manajer)");
      // Reset
      const count = recentData.length + 1;
      setForm({
        kode_transaksi: `TRM-${String(count + 1).padStart(4, "0")}`,
        jenis: "masuk",
        tanggal: new Date().toISOString().split("T")[0],
        barang_id: "", jumlah: "", harga_satuan: "",
        supplier_id: "", gudang_id: "", gudang_rak: "", keterangan: "",
      });
      // Refresh recent
      const tRes = await TransaksiService.getAll();
      setRecentData(tRes.data.data.filter(t => t.jenis === "masuk").slice(0, 5));
    } catch (err) { toast.error(err.response?.data?.message || "Gagal menyimpan"); }
    finally { setSubmitting(false); }
  };

  const statusBadge = (s) => {
    const map = { pending: "warning", diterima: "success", ditolak: "danger" };
    return <Badge bg={map[s] || "secondary"} pill className="px-3 py-2 fw-normal">{s?.charAt(0).toUpperCase() + s?.slice(1)}</Badge>;
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h3 className="mb-4"><FaArrowDown className="me-2 text-success" />Form Barang Masuk</h3>
      <Alert variant="info">Data yang diinput akan berstatus <strong>Pending</strong> dan perlu disetujui oleh Manajer.</Alert>

      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3"><Form.Label>Kode Transaksi</Form.Label>
                  <Form.Control required value={form.kode_transaksi} onChange={e => setForm({ ...form, kode_transaksi: e.target.value })} /></Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3"><Form.Label>Tanggal Masuk</Form.Label>
                  <Form.Control type="date" required value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} /></Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3"><Form.Label>Supplier *</Form.Label>
                  <Form.Select required value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.kode_supplier} - {s.nama_supplier}</option>)}
                  </Form.Select></Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3"><Form.Label>Barang *</Form.Label>
                  <Form.Select required value={form.barang_id} onChange={e => setForm({ ...form, barang_id: e.target.value })}>
                    <option value="">-- Pilih Barang --</option>
                    {barangs.map(b => <option key={b.id} value={b.id}>{b.kode_barang} - {b.nama}</option>)}
                  </Form.Select></Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3"><Form.Label>Jumlah *</Form.Label>
                  <Form.Control type="number" min={1} required value={form.jumlah} onChange={e => setForm({ ...form, jumlah: e.target.value })} /></Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3"><Form.Label>Harga Beli</Form.Label>
                  <Form.Control type="number" min={0} value={form.harga_satuan} onChange={e => setForm({ ...form, harga_satuan: e.target.value })} /></Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3"><Form.Label>Gudang *</Form.Label>
                  <Form.Select required value={form.gudang_id} onChange={e => {
                    const selected = gudangs.find(g => String(g.id) === String(e.target.value));
                    setForm({ ...form, gudang_id: e.target.value, gudang_rak: selected?.kode_gudang || "" });
                  }}>
                    <option value="">-- Pilih Gudang --</option>
                    {gudangs.map(g => <option key={g.id} value={g.id}>{g.kode_gudang} - {g.nama_gudang}</option>)}
                  </Form.Select></Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Keterangan</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} /></Form.Group>
            <Button type="submit" variant="success" disabled={submitting} className="rounded-pill px-4 shadow-sm">
              {submitting ? <Spinner size="sm" className="me-2" /> : <FaSave className="me-2" />}
              Simpan Barang Masuk
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0" style={{ borderRadius: "16px" }}>
        <Card.Header className="bg-white"><strong>📋 Riwayat Terakhir</strong></Card.Header>
        <Card.Body>
          <Table hover responsive size="sm" className="border-top">
            <thead><tr><th>Kode</th><th>Tanggal</th><th>Barang</th><th>Jumlah</th><th>Supplier</th><th>Status</th></tr></thead>
            <tbody>
              {recentData.map(t => (
                <tr key={t.id}>
                  <td>{t.kode_transaksi}</td>
                  <td>{new Date(t.tanggal).toLocaleDateString("id-ID")}</td>
                  <td>{t.barang?.nama}</td>
                  <td>{t.jumlah}</td>
                  <td>{t.supplier?.nama_supplier || "-"}</td>
                  <td>{statusBadge(t.status)}</td>
                </tr>
              ))}
              {recentData.length === 0 && <tr><td colSpan={6} className="text-center text-muted">Belum ada data</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}
