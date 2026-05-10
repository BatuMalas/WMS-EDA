import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Form,
  Modal,
  Spinner,
  Alert,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import {
  FaExchangeAlt,
  FaArrowDown,
  FaArrowUp,
  FaHistory,
  FaPlus,
  FaSearch,
  FaFileInvoice,
  FaFilePdf,
  FaFileImage,
  FaDownload,
  FaEye,
  FaTrash,
  FaTruck,
  FaCalendarAlt,
} from "react-icons/fa";
import api from "../../services/api";
import BarangService from "../../services/barangService";
import GudangService from "../../services/gudangService";
import { toast } from "react-toastify";

export default function TransaksiPage() {
  // Data
  const [transaksi, setTransaksi] = useState([]);
  const [barangList, setBarangList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [gudangList, setGudangList] = useState([]);
  const [gudangAvailable, setGudangAvailable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");

  // Form
  const [form, setForm] = useState({
    jenis: "masuk",
    tanggal: new Date().toISOString().split("T")[0],
    barang_id: "",
    jumlah: 1,
    harga_satuan: "",
    supplier_id: "",
    penerima: "",
    pengambil: "",
    keterangan: "",
    tanggal_kadaluarsa: "",
    gudang_id: "",
  });
  const [invoiceFile, setInvoiceFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, barangRes, supplierRes, gudangRes] = await Promise.all([
        api.get("/transaksi"),
        api.get("/barang"),
        api.get("/supplier"),
        GudangService.getAll(),
      ]);
      setTransaksi(transRes.data.data || []);
      setBarangList(barangRes.data.data || []);
      setSupplierList(supplierRes.data.data || []);
      setGudangList(gudangRes.data.data || []);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const generateKodeTransaksi = useCallback(() => {
    const prefix = form.jenis === "masuk" ? "TRX-IN" : "TRX-OUT";
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${date}-${random}`;
  }, [form.jenis]);

  const resetForm = () => {
    setForm({
      jenis: "masuk",
      tanggal: new Date().toISOString().split("T")[0],
      barang_id: "",
      jumlah: 1,
      harga_satuan: "",
      supplier_id: "",
      penerima: "",
      pengambil: "",
      keterangan: "",
      tanggal_kadaluarsa: "",
      gudang_id: "",
    });
    setInvoiceFile(null);
    setGudangAvailable([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("kode_transaksi", generateKodeTransaksi());
      formData.append("jenis", form.jenis);
      formData.append("tanggal", form.tanggal);
      formData.append("barang_id", form.barang_id);
      formData.append("jumlah", form.jumlah);

      if (form.supplier_id) {
        formData.append("supplier_id", form.supplier_id);
      }
      if (form.penerima) formData.append("penerima", form.penerima);
      if (form.pengambil) formData.append("pengambil", form.pengambil);
      if (form.keterangan) formData.append("keterangan", form.keterangan);
      if (form.harga_satuan) formData.append("harga_satuan", form.harga_satuan);

      if (form.jenis === "masuk") {
        if (form.tanggal_kadaluarsa) {
          formData.append("tanggal_kadaluarsa", form.tanggal_kadaluarsa);
        }
        if (invoiceFile) {
          formData.append("invoice_file", invoiceFile);
        }
      }

      if (form.gudang_id) {
        formData.append("gudang_id", form.gudang_id);
      }

      const response = await api.post("/transaksi", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const created = response.data.data;
      setLastCreated(created);
      setShowModal(false);

      if (form.jenis === "keluar") {
        setShowSuccessModal(true);
      } else {
        toast.success("Transaksi masuk berhasil! Batch baru dibuat.");
      }

      fetchData();
      resetForm();
    } catch (error) {
      const msg = error.response?.data?.message || "Gagal membuat transaksi";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoice = async (id) => {
    try {
      const response = await api.get(`/transaksi/${id}/invoice/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from content-disposition header or use default
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

  const handleViewInvoice = (transaksiItem) => {
    // For uploaded invoices (images/pdf), open the URL
    const url = transaksiItem.invoice_generated_url || transaksiItem.invoice_url;
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.info("Invoice belum tersedia");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus transaksi ini?")) return;
    try {
      await api.delete(`/transaksi/${id}`);
      toast.success("Transaksi dihapus");
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus transaksi");
    }
  };

  const filteredTransaksi = transaksi.filter((item) => {
    const matchSearch =
      item.kode_transaksi?.toLowerCase().includes(search.toLowerCase()) ||
      item.barang?.nama?.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier?.nama?.toLowerCase().includes(search.toLowerCase());

    if (filterJenis === "masuk") return matchSearch && item.jenis === "masuk";
    if (filterJenis === "keluar") return matchSearch && item.jenis === "keluar";
    return matchSearch;
  });

  const handleBarangChangeForGudang = async (barangId) => {
    setForm(f => ({ ...f, barang_id: barangId, gudang_id: "" }));
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

  const selectedBarang = barangList.find(
    (b) => b.id === parseInt(form.barang_id)
  );

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="fw-bold">
            <FaExchangeAlt className="me-2" />
            Manajemen Transaksi
          </h1>
          <p className="text-muted">
            Kelola barang masuk & keluar — FIFO otomatis, invoice digital
          </p>
        </Col>
        <Col className="text-end">
          <Button variant="success" className="me-2" onClick={() => { setForm({ ...form, jenis: "masuk" }); setShowModal(true); }}>
            <FaArrowDown className="me-2" /> Barang Masuk
          </Button>
          <Button variant="warning" onClick={() => { setForm({ ...form, jenis: "keluar" }); setShowModal(true); }}>
            <FaArrowUp className="me-2" /> Barang Keluar
          </Button>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 bg-primary text-white">
            <Card.Body className="py-3">
              <h6>Total Transaksi</h6>
              <h2>{transaksi.length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 bg-success text-white">
            <Card.Body className="py-3">
              <h6>Barang Masuk</h6>
              <h2>{transaksi.filter((t) => t.jenis === "masuk").length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 bg-warning text-white">
            <Card.Body className="py-3">
              <h6>Barang Keluar</h6>
              <h2>{transaksi.filter((t) => t.jenis === "keluar").length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 bg-info text-white">
            <Card.Body className="py-3">
              <h6>Dengan Invoice</h6>
              <h2>{transaksi.filter((t) => t.invoice_file || t.invoice_generated).length}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={7}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <FormControl
                  placeholder="Cari transaksi (kode, barang, supplier)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={5}>
              <div className="d-flex gap-2">
                <Button variant={filterJenis === "all" ? "primary" : "outline-primary"} onClick={() => setFilterJenis("all")}>
                  Semua
                </Button>
                <Button variant={filterJenis === "masuk" ? "success" : "outline-success"} onClick={() => setFilterJenis("masuk")}>
                  <FaArrowDown className="me-1" /> Masuk
                </Button>
                <Button variant={filterJenis === "keluar" ? "warning" : "outline-warning"} onClick={() => setFilterJenis("keluar")}>
                  <FaArrowUp className="me-1" /> Keluar
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Transaction History Table */}
      <Card className="border-0 shadow">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaHistory className="me-2" />
            Riwayat Transaksi
          </h5>
          <Badge bg="light" text="dark">{filteredTransaksi.length} transaksi</Badge>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data transaksi...</p>
            </div>
          ) : filteredTransaksi.length === 0 ? (
            <Alert variant="info" className="text-center">
              {search || filterJenis !== "all"
                ? "Tidak ada transaksi yang sesuai filter"
                : "Belum ada transaksi. Buat transaksi pertama Anda!"}
            </Alert>
          ) : (
            <Table hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>Kode</th>
                  <th>Jenis</th>
                  <th>Barang</th>
                  <th>Jumlah</th>
                  <th>Harga</th>
                  <th>Supplier</th>
                  <th>Tanggal</th>
                  <th>Invoice</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransaksi.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <small className="font-monospace text-muted">{item.kode_transaksi}</small>
                    </td>
                    <td>
                      <Badge bg={item.jenis === "masuk" ? "success" : "warning"} text={item.jenis === "keluar" ? "dark" : undefined}>
                        {item.jenis === "masuk" ? (<><FaArrowDown className="me-1" /> Masuk</>) : (<><FaArrowUp className="me-1" /> Keluar</>)}
                      </Badge>
                    </td>
                    <td>
                      <strong>{item.barang?.nama}</strong>
                      <br />
                      <small className="text-muted">{item.barang?.kode_barang}</small>
                    </td>
                    <td>
                      <Badge bg={item.jenis === "masuk" ? "success" : "danger"}>
                        {item.jenis === "masuk" ? "+" : "-"}{item.jumlah}
                      </Badge>
                    </td>
                    <td>
                      {item.harga_satuan > 0 ? (
                        <small>Rp {Number(item.harga_satuan).toLocaleString("id-ID")}</small>
                      ) : (
                        <small className="text-muted">—</small>
                      )}
                    </td>
                    <td>
                      {item.supplier ? (
                        <><FaTruck className="me-1 text-muted" />{item.supplier.nama}</>
                      ) : (
                        <small className="text-muted">-</small>
                      )}
                    </td>
                    <td>
                      <small>
                        <FaCalendarAlt className="me-1 text-muted" />
                        {new Date(item.tanggal).toLocaleDateString("id-ID")}
                      </small>
                    </td>
                    <td>
                      {(item.invoice_file || item.invoice_generated) ? (
                        <div className="d-flex gap-1">
                          <Button variant="outline-primary" size="sm" onClick={() => handleViewInvoice(item)} title="Lihat Invoice">
                            <FaEye />
                          </Button>
                          <Button variant="outline-success" size="sm" onClick={() => handleDownloadInvoice(item.id)} title="Download Invoice">
                            <FaDownload />
                          </Button>
                        </div>
                      ) : (
                        <small className="text-muted">—</small>
                      )}
                    </td>
                    <td className="text-center">
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)} title="Hapus">
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* ─── CREATE TRANSACTION MODAL ─── */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="lg" centered>
        <Modal.Header closeButton className={form.jenis === "masuk" ? "bg-success text-white" : "bg-warning"}>
          <Modal.Title>
            {form.jenis === "masuk" ? (<><FaArrowDown className="me-2" /> Tambah Barang Masuk</>) : (<><FaArrowUp className="me-2" /> Tambah Barang Keluar</>)}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Jenis Toggle */}
            <div className="d-flex gap-2 mb-4">
              <Button
                variant={form.jenis === "masuk" ? "success" : "outline-success"}
                onClick={() => setForm({ ...form, jenis: "masuk" })}
                className="flex-fill"
              >
                <FaArrowDown className="me-1" /> Barang Masuk
              </Button>
              <Button
                variant={form.jenis === "keluar" ? "warning" : "outline-warning"}
                onClick={() => setForm({ ...form, jenis: "keluar" })}
                className="flex-fill"
              >
                <FaArrowUp className="me-1" /> Barang Keluar
              </Button>
            </div>

            <Row>
              {/* Barang */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Barang *</Form.Label>
                  <Form.Select
                    value={form.barang_id}
                    onChange={(e) => {
                      if (form.jenis === "keluar") {
                        handleBarangChangeForGudang(e.target.value);
                      } else {
                        setForm({ ...form, barang_id: e.target.value });
                      }
                    }}
                    required
                  >
                    <option value="">-- Pilih Barang --</option>
                    {barangList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nama} ({b.kode_barang}) — Stok: {b.stok}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Jumlah */}
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Jumlah *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={form.jenis === "keluar" && selectedBarang ? selectedBarang.stok : undefined}
                    value={form.jumlah}
                    onChange={(e) => setForm({ ...form, jumlah: parseInt(e.target.value) || 1 })}
                    required
                  />
                  {form.jenis === "keluar" && selectedBarang && (
                    <Form.Text className="text-muted">
                      Maks: {selectedBarang.stok} unit
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              {/* Tanggal */}
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal *</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Harga Satuan */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>💰 Harga Satuan (Rp)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Contoh: 25000"
                    value={form.harga_satuan}
                    onChange={(e) => setForm({ ...form, harga_satuan: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    {form.harga_satuan && form.jumlah
                      ? `Total: Rp ${(Number(form.harga_satuan) * Number(form.jumlah)).toLocaleString("id-ID")}`
                      : "Harga per unit barang"}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Supplier — Wajib untuk Masuk */}
            {form.jenis === "masuk" && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Supplier * <small className="text-danger">(wajib untuk barang masuk)</small>
                    </Form.Label>
                    <Form.Select
                      value={form.supplier_id}
                      onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih Supplier --</option>
                      {supplierList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nama} — {s.alamat || ""}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Tanggal Kadaluarsa */}
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tanggal Kadaluarsa</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.tanggal_kadaluarsa}
                      onChange={(e) => setForm({ ...form, tanggal_kadaluarsa: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <Form.Text className="text-muted">Opsional — untuk tracking FEFO</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            )}

            {/* Penerima / Pengambil */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{form.jenis === "masuk" ? "Penerima" : "Pengambil"}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={form.jenis === "masuk" ? "Nama penerima barang" : "Nama pengambil barang"}
                    value={form.jenis === "masuk" ? form.penerima : form.pengambil}
                    onChange={(e) =>
                      form.jenis === "masuk"
                        ? setForm({ ...form, penerima: e.target.value })
                        : setForm({ ...form, pengambil: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Keterangan</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Catatan tambahan..."
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Gudang — Khusus Keluar */}
            {form.jenis === "keluar" && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>🏭 Gudang / Lokasi Stok</Form.Label>
                    <Form.Select
                      value={form.gudang_id}
                      onChange={(e) => setForm({ ...form, gudang_id: e.target.value })}
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
                        gudangList.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.kode_gudang} - {g.nama_gudang}
                          </option>
                        ))
                      )}
                    </Form.Select>
                    {form.barang_id && gudangAvailable.length === 0 && (
                      <Form.Text className="text-warning">
                        Belum ada stok di gudang manapun
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            )}

            {/* Upload Invoice — Khusus Masuk */}
            {form.jenis === "masuk" && (
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaFileInvoice className="me-1" /> Upload Invoice / Bukti Barang Masuk
                </Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setInvoiceFile(e.target.files[0])}
                />
                <Form.Text className="text-muted">
                  Format: PDF, JPG, PNG (maks 5MB). Invoice dari supplier sebagai bukti digital.
                </Form.Text>
                {invoiceFile && (
                  <div className="mt-2">
                    <Badge bg="info">
                      {invoiceFile.name.endsWith(".pdf") ? <FaFilePdf className="me-1" /> : <FaFileImage className="me-1" />}
                      {invoiceFile.name} ({(invoiceFile.size / 1024).toFixed(1)} KB)
                    </Badge>
                    <Button variant="link" size="sm" className="text-danger" onClick={() => setInvoiceFile(null)}>
                      Hapus
                    </Button>
                  </div>
                )}
              </Form.Group>
            )}

            {/* Info Box */}
            {form.jenis === "masuk" && selectedBarang && (
              <Alert variant="success" className="mb-0">
                <small>
                  📦 <strong>Batch baru</strong> akan dibuat untuk <strong>{selectedBarang.nama}</strong>.
                  Stok akan bertambah dari {selectedBarang.stok} → <strong>{selectedBarang.stok + (parseInt(form.jumlah) || 0)}</strong> unit.
                  {invoiceFile && <><br />📄 Invoice "<strong>{invoiceFile.name}</strong>" akan disimpan sebagai bukti digital.</>}
                </small>
              </Alert>
            )}

            {form.jenis === "keluar" && selectedBarang && (
              <Alert variant="warning" className="mb-0">
                <small>
                  📤 Stok <strong>{selectedBarang.nama}</strong> akan dikurangi via <strong>FIFO</strong> (dari batch tertua).
                  Stok: {selectedBarang.stok} → <strong>{selectedBarang.stok - (parseInt(form.jumlah) || 0)}</strong> unit.
                  <br />📄 <strong>Invoice PDF akan otomatis digenerate</strong> setelah transaksi berhasil.
                </small>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Batal
            </Button>
            <Button
              variant={form.jenis === "masuk" ? "success" : "warning"}
              type="submit"
              disabled={submitting || !form.barang_id}
            >
              {submitting ? (
                <><Spinner animation="border" size="sm" className="me-2" /> Memproses...</>
              ) : (
                <>{form.jenis === "masuk" ? "Simpan Barang Masuk" : "Keluarkan Barang"}</>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ─── SUCCESS MODAL (Barang Keluar) ─── */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>✅ Transaksi Keluar Berhasil!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <FaFilePdf size={64} className="text-danger" />
          </div>
          <h5>Invoice telah dibuat otomatis</h5>
          <p className="text-muted">
            Transaksi <strong>{lastCreated?.kode_transaksi}</strong> berhasil. Invoice PDF sudah digenerate dan siap didownload.
          </p>

          {lastCreated?.fifo_detail && lastCreated.fifo_detail.length > 0 && (
            <Alert variant="info" className="text-start">
              <strong>📦 Detail FIFO:</strong>
              <ul className="mb-0 mt-1">
                {lastCreated.fifo_detail.map((d, i) => (
                  <li key={i}>
                    <small>
                      Batch <strong>{d.kode_batch}</strong> — {d.diambil} unit diambil, sisa {d.sisa_stok_batch} unit
                    </small>
                  </li>
                ))}
              </ul>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="primary" size="lg" onClick={() => lastCreated && handleDownloadInvoice(lastCreated.id)}>
            <FaDownload className="me-2" /> Download Invoice PDF
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowSuccessModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
