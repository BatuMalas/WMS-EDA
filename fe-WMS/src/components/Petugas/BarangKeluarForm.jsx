import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Alert, Spinner, Table, Badge } from "react-bootstrap";
import { FaSave, FaArrowUp, FaWarehouse } from "react-icons/fa";
import { toast } from "react-toastify";
import TransaksiService from "../../services/transaksiService";
import BarangService from "../../services/barangService";
import CustomerService from "../../services/customerService";
import GudangService from "../../services/gudangService";
import api from "../../services/api";

export default function BarangKeluarForm() {
  const [barangs, setBarangs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [gudangs, setGudangs] = useState([]);
  const [gudangAvailable, setGudangAvailable] = useState([]);
  const [recentData, setRecentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    kode_transaksi: "",
    jenis: "keluar",
    tanggal: new Date().toISOString().split("T")[0],
    barang_id: "",
    jumlah: "",
    harga_satuan: "",
    customer_id: "",
    gudang_id: "",
    gudang_rak: "",
    keterangan: "",
  });

  useEffect(() => {
    Promise.all([
      BarangService.getAll(),
      CustomerService.getAll(),
      TransaksiService.getAll(),
      GudangService.getAll(),
    ]).then(([bRes, cRes, tRes, gRes]) => {
      setBarangs(bRes.data.data);
      setCustomers(cRes.data.data);
      setGudangs(gRes.data.data || []);
      // TransaksiService.getAll() returns paginated data
      const paginationData = tRes.data.data;
      const transaksiList = paginationData.data || paginationData || [];
      setRecentData(transaksiList.filter(t => t.jenis === "keluar").slice(0, 5));
      // Gunakan total dari pagination agar kode tidak duplikat
      const totalKeluar = paginationData.total || transaksiList.length;
      setForm(f => ({ ...f, kode_transaksi: `TRK-${String(totalKeluar + 1).padStart(4, "0")}` }));
    }).catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, []);

  // Saat barang dipilih, ambil gudang yang punya stok
  const handleBarangChange = async (barangId) => {
    setForm(f => ({ ...f, barang_id: barangId, gudang_id: "", gudang_rak: "" }));
    setGudangAvailable([]);

    if (barangId) {
      try {
        const res = await BarangService.getGudang(barangId);
        setGudangAvailable(res.data.data || []);
      } catch (err) {
        console.error("Gagal memuat gudang:", err);
      }
    }
  };

  const handleGudangChange = (gudangId) => {
    const selected = gudangs.find(g => String(g.id) === String(gudangId));
    setForm(f => ({
      ...f,
      gudang_id: gudangId,
      gudang_rak: selected?.kode_gudang || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validasi: harga jual tidak boleh di bawah harga beli
    const barangDipilih = barangs.find(b => String(b.id) === String(form.barang_id));
    if (barangDipilih?.harga_terakhir > 0 && Number(form.harga_satuan) < Number(barangDipilih.harga_terakhir)) {
      toast.error(`Harga jual tidak boleh di bawah harga beli (Rp ${Number(barangDipilih.harga_terakhir).toLocaleString("id-ID")})`);
      return;
    }
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
      toast.success("Barang keluar berhasil dicatat (menunggu approval Manajer)");
      setGudangAvailable([]);
      const tRes = await TransaksiService.getAll();
      const paginationData = tRes.data.data;
      const transaksiList = paginationData.data || paginationData || [];
      const totalKeluar = paginationData.total || transaksiList.length;
      setRecentData(transaksiList.filter(t => t.jenis === "keluar").slice(0, 5));
      setForm({
        kode_transaksi: `TRK-${String(totalKeluar + 1).padStart(4, "0")}`,
        jenis: "keluar",
        tanggal: new Date().toISOString().split("T")[0],
        barang_id: "", jumlah: "", harga_satuan: "",
        customer_id: "", gudang_id: "", gudang_rak: "", keterangan: "",
      });
    } catch (err) { toast.error(err.response?.data?.message || "Gagal menyimpan"); }
    finally { setSubmitting(false); }
  };

  const statusBadge = (s) => {
    const map = { pending: "warning", diterima: "success", ditolak: "danger" };
    return <Badge bg={map[s] || "secondary"} pill className="px-3 py-2 fw-normal">{s?.charAt(0).toUpperCase() + s?.slice(1)}</Badge>;
  };

  const selectedBarang = barangs.find(b => String(b.id) === String(form.barang_id));

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h3 className="mb-4"><FaArrowUp className="me-2 text-danger" />Form Barang Keluar</h3>
      <Alert variant="info">Data yang diinput akan berstatus <strong>Pending</strong> dan perlu disetujui oleh Manajer. Invoice number akan <strong>otomatis digenerate</strong>.</Alert>

      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3"><Form.Label>Kode Transaksi</Form.Label>
                  <Form.Control required value={form.kode_transaksi} onChange={e => setForm({ ...form, kode_transaksi: e.target.value })} /></Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3"><Form.Label>Tanggal Keluar</Form.Label>
                  <Form.Control type="date" required value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} /></Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3"><Form.Label>No. Invoice</Form.Label>
                  <Form.Control value="Auto-generate" disabled readOnly />
                  <Form.Text className="text-muted">Invoice number akan otomatis dibuat (INV-OUT-...)</Form.Text></Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3"><Form.Label>Barang *</Form.Label>
                  <Form.Select required value={form.barang_id} onChange={e => handleBarangChange(e.target.value)}>
                    <option value="">-- Pilih Barang --</option>
                    {barangs.map(b => <option key={b.id} value={b.id}>{b.kode_barang} - {b.nama} (Stok: {b.stok})</option>)}
                  </Form.Select></Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3"><Form.Label>Jumlah *</Form.Label>
                  <Form.Control type="number" min={1} max={selectedBarang?.stok || undefined} required value={form.jumlah} onChange={e => setForm({ ...form, jumlah: e.target.value })} />
                  {selectedBarang && <Form.Text className="text-muted">Maks: {selectedBarang.stok} unit</Form.Text>}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3"><Form.Label>Harga Jual *</Form.Label>
                  <Form.Control
                    type="number"
                    min={selectedBarang?.harga_terakhir || 0}
                    required
                    value={form.harga_satuan}
                    onChange={e => setForm({ ...form, harga_satuan: e.target.value })}
                    isInvalid={selectedBarang?.harga_terakhir > 0 && form.harga_satuan && Number(form.harga_satuan) < Number(selectedBarang.harga_terakhir)}
                  />
                  {selectedBarang?.harga_terakhir > 0 && (
                    <Form.Text className={form.harga_satuan && Number(form.harga_satuan) < Number(selectedBarang.harga_terakhir) ? "text-danger fw-bold" : "text-muted"}>
                      {form.harga_satuan && Number(form.harga_satuan) < Number(selectedBarang.harga_terakhir)
                        ? `⚠️ Harga jual tidak boleh di bawah harga beli (Rp ${Number(selectedBarang.harga_terakhir).toLocaleString("id-ID")})`
                        : `Harga beli: Rp ${Number(selectedBarang.harga_terakhir).toLocaleString("id-ID")}`}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label><FaWarehouse className="me-1" />Gudang *</Form.Label>
                  <Form.Select
                    required
                    value={form.gudang_id}
                    onChange={e => handleGudangChange(e.target.value)}
                    disabled={!form.barang_id}
                  >
                    <option value="">{form.barang_id ? "-- Pilih Gudang --" : "Pilih barang dulu"}</option>
                    {gudangAvailable.length > 0 ? (
                      gudangAvailable.map(g => (
                        <option key={g.gudang_id} value={g.gudang_id}>
                          {g.kode_gudang} - {g.nama_gudang} (Stok: {g.total_stok})
                        </option>
                      ))
                    ) : (
                      gudangs.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.kode_gudang} - {g.nama_gudang}
                        </option>
                      ))
                    )}
                  </Form.Select>
                  {form.barang_id && gudangAvailable.length === 0 && (
                    <Form.Text className="text-warning">
                      Belum ada stok di gudang manapun. Pilih gudang tujuan manual.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3"><Form.Label>Customer / Tujuan</Form.Label>
                  <Form.Select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                    <option value="">-- Pilih Customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.kode_customer} - {c.nama}</option>)}
                  </Form.Select></Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3"><Form.Label>Keterangan</Form.Label>
                  <Form.Control value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} /></Form.Group>
              </Col>
            </Row>

            {selectedBarang && (
              <Alert variant="warning" className="mb-3">
                <small>
                  📤 Stok <strong>{selectedBarang.nama}</strong> akan dikurangi via <strong>FIFO</strong> (dari batch tertua).
                  Stok: {selectedBarang.stok} → <strong>{selectedBarang.stok - (parseInt(form.jumlah) || 0)}</strong> unit.
                  <br />📄 <strong>Invoice PDF akan otomatis digenerate</strong> setelah Manajer menyetujui.
                </small>
              </Alert>
            )}

            <Button type="submit" variant="danger" disabled={submitting} className="rounded-pill px-4 shadow-sm">
              {submitting ? <Spinner size="sm" className="me-2" /> : <FaSave className="me-2" />}
              Simpan Barang Keluar
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0" style={{ borderRadius: "16px" }}>
        <Card.Header className="bg-white"><strong>📋 Riwayat Terakhir</strong></Card.Header>
        <Card.Body>
          <Table hover responsive size="sm" className="border-top">
            <thead><tr><th>Kode</th><th>Tanggal</th><th>Barang</th><th>Jumlah</th><th>Gudang</th><th>Customer</th><th>Status</th></tr></thead>
            <tbody>
              {recentData.map(t => (
                <tr key={t.id}>
                  <td>{t.kode_transaksi}</td>
                  <td>{new Date(t.tanggal).toLocaleDateString("id-ID")}</td>
                  <td>{t.barang?.nama}</td>
                  <td>{t.jumlah}</td>
                  <td>{t.gudang?.kode_gudang || t.gudang_rak || "-"}</td>
                  <td>{t.customer?.nama || "-"}</td>
                  <td>{statusBadge(t.status)}</td>
                </tr>
              ))}
              {recentData.length === 0 && <tr><td colSpan={7} className="text-center text-muted">Belum ada data</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}
