import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Form,
  FormControl,
  InputGroup,
  Modal,
  Spinner,
  Alert,
  Tab,
  Tabs,
  Toast,
  ToastContainer,
  ProgressBar,
} from "react-bootstrap";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaBox,
  FaEye,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaCalendarTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import api from "../../services/api";
import KategoriService from "../../services/kategoriService";

function StatCard({ label, value, icon, colorHex }) {
  return (
    <Col xl={3} md={6} className="mb-4">
      <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
        <Card.Body className="p-4 position-relative">
          <div className="d-flex flex-column">
            <div className="d-flex align-items-center mb-2">
              <div className="d-flex align-items-center justify-content-center text-white me-2 rounded-circle shadow-sm"
                style={{ width: "36px", height: "36px", backgroundColor: colorHex }}>
                {icon}
              </div>
            </div>
            <h6 className="fw-bold mb-1" style={{ fontSize: "1.1rem", color: colorHex }}>{label}</h6>
            <h2 className="fw-bolder text-dark mb-0" style={{ fontSize: "2.2rem" }}>{value}</h2>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}

export default function BarangPage() {
  // State Management
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [kategoriList, setKategoriList] = useState([]);
  const [filterKategori, setFilterKategori] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, filterKategori]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStokModal, setShowStokModal] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    kode_barang: "",
    nama: "",
    stok: 0,
    lokasi: "",
    kategori_id: "",
    keterangan: "",
    batas_aging_hari: 180,
  });

  const [editForm, setEditForm] = useState(null);
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [stokAction, setStokAction] = useState("tambah");
  const [stokAmount, setStokAmount] = useState(1);

  // Batch detail state
  const [batchesData, setBatchesData] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("info");

  // Notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  useEffect(() => {
    fetchBarang();
    fetchKategori();
  }, []);

  const fetchBarang = async () => {
    try {
      const response = await api.get("/barang");
      setBarang(response.data.data || []);
    } catch (error) {
      showNotification("Gagal memuat data barang", "danger");
      console.error("Error fetching barang:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKategori = async () => {
    try {
      const response = await KategoriService.getAll();
      setKategoriList(response.data.data || []);
    } catch (error) {
      console.error("Error fetching kategori:", error);
    }
  };

  const fetchBatches = async (barangId) => {
    setBatchesLoading(true);
    try {
      const response = await api.get(`/barang/${barangId}/batches`);
      setBatchesData(response.data.data?.batches || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
      setBatchesData([]);
    } finally {
      setBatchesLoading(false);
    }
  };

  const showNotification = (message, variant = "success") => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredBarang = barang.filter((item) => {
    const matchesSearch =
      item.nama?.toLowerCase().includes(search.toLowerCase()) ||
      item.kode_barang?.toLowerCase().includes(search.toLowerCase());

    const matchesKategori = !filterKategori || String(item.kategori_id) === String(filterKategori);

    if (filter === "low") return matchesSearch && matchesKategori && item.stok < 10;
    if (filter === "out") return matchesSearch && matchesKategori && item.stok === 0;
    return matchesSearch && matchesKategori;
  });

  const totalPages = Math.ceil(filteredBarang.length / itemsPerPage);
  const paginatedBarang = filteredBarang.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // CRUD Operations
  const handleAddBarang = async (e) => {
    e.preventDefault();
    try {
      await api.post("/barang", formData);
      showNotification("Barang berhasil ditambahkan");
      fetchBarang();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal menambahkan barang",
        "danger"
      );
    }
  };

  const handleEditBarang = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/barang/${editForm.id}`, editForm);
      showNotification("Barang berhasil diupdate");
      fetchBarang();
      setShowEditModal(false);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal mengupdate barang",
        "danger"
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus barang ini?")) {
      try {
        await api.delete(`/barang/${id}`);
        showNotification("Barang berhasil dihapus");
        fetchBarang();
      } catch (error) {
        showNotification("Gagal menghapus barang", "danger");
      }
    }
  };

  const handleStokUpdate = async () => {
    if (!selectedBarang || stokAmount <= 0) return;

    try {
      const endpoint = stokAction === "tambah" ? `tambah` : `kurangi`;

      const result = await api.post(
        `/barang/${selectedBarang.id}/stok/${endpoint}`,
        { jumlah: parseInt(stokAmount) }
      );

      showNotification(
        `Stok berhasil di${stokAction === "tambah" ? "tambah" : "kurangi"} (${stokAction === "tambah" ? "batch baru dibuat" : "FIFO"})`
      );
      fetchBarang();
      setShowStokModal(false);
      setStokAmount(1);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal mengupdate stok",
        "danger"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      kode_barang: "",
      nama: "",
      stok: 0,
      lokasi: "",
      kategori_id: "",
      keterangan: "",
      batas_aging_hari: 180,
    });
  };

  const openEditModal = (item) => {
    setEditForm({ ...item });
    setShowEditModal(true);
  };

  const openDetailModal = (item) => {
    setSelectedBarang(item);
    setDetailTab("info");
    setShowDetailModal(true);
    fetchBatches(item.id);
  };

  const openStokModal = (item, action) => {
    setSelectedBarang(item);
    setStokAction(action);
    setShowStokModal(true);
  };

  const getStatusBadge = (stok) => {
    if (stok === 0) return <Badge bg="danger" pill className="px-3 py-2 fw-normal">Habis</Badge>;
    if (stok < 5) return <Badge bg="warning" pill className="px-3 py-2 fw-normal text-dark">Hampir Habis</Badge>;
    if (stok < 10) return <Badge bg="info" pill className="px-3 py-2 fw-normal">Sedikit</Badge>;
    return <Badge bg="success" pill className="px-3 py-2 fw-normal">Tersedia</Badge>;
  };

  const getStockColor = (stok) => {
    if (stok === 0) return "danger";
    if (stok < 5) return "warning";
    if (stok < 10) return "info";
    return "success";
  };

  const formatUmur = (hari) => {
    if (hari >= 365) return `${Math.floor(hari / 365)}thn ${Math.floor((hari % 365) / 30)}bln`;
    if (hari >= 30) return `${Math.floor(hari / 30)}bln ${hari % 30}hr`;
    return `${hari}hr`;
  };

  return (
    <Container fluid className="py-4">
      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg={toastVariant}
        >
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="fw-bold">
            Manajemen Barang
          </h1>
          <p className="text-muted">Kelola data barang di gudang — dilengkapi tracking batch FIFO</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" className="rounded-pill px-4 shadow-sm" onClick={() => setShowAddModal(true)}>
            <FaPlus className="me-2" /> Tambah Barang
          </Button>
        </Col>
      </Row>

      {/* Filter & Search */}
      <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: "16px" }}>
        <Card.Body>
          <Row className="align-items-center">
            <Col md={5} className="mb-2 mb-md-0">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <FormControl
                  placeholder="Cari barang berdasarkan nama atau kode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="mb-2 mb-md-0">
              <Form.Select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                size="sm"
                style={{ height: '38px' }}
              >
                <option value="">Semua Kategori</option>
                {kategoriList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <div className="d-flex gap-2 justify-content-md-end">
                <Button
                  size="sm"
                  variant={filter === "all" ? "primary" : "outline-primary"}
                  className="rounded-pill px-3"
                  onClick={() => setFilter("all")}
                >
                  Semua
                </Button>
                <Button
                  size="sm"
                  variant={filter === "low" ? "warning" : "outline-warning"}
                  className="rounded-pill px-3"
                  onClick={() => setFilter("low")}
                >
                  Rendah
                </Button>
                <Button
                  size="sm"
                  variant={filter === "out" ? "danger" : "outline-danger"}
                  className="rounded-pill px-3"
                  onClick={() => setFilter("out")}
                >
                  Habis
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stats Summary */}
      <Row className="mb-4">
        <StatCard
          label="Total Barang"
          value={barang.length}
          icon={<FaBox size={18} />}
          colorHex="#3b82f6"
        />
        <StatCard
          label="Total Stok"
          value={barang.reduce((sum, item) => sum + item.stok, 0)}
          icon={<FaBox size={18} />}
          colorHex="#10b981"
        />
        <StatCard
          label="Stok Rendah"
          value={barang.filter((item) => item.stok > 0 && item.stok < 10).length}
          icon={<FaArrowDown size={18} />}
          colorHex="#f59e0b"
        />
        <StatCard
          label="Stok Habis"
          value={barang.filter((item) => item.stok === 0).length}
          icon={<FaBox size={18} />}
          colorHex="#ef4444"
        />
      </Row>

      {/* Table */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: "16px" }}>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data barang...</p>
            </div>
          ) : filteredBarang.length === 0 ? (
            <Alert variant="info" className="text-center">
              <FaBox className="me-2" />
              {search || filter !== "all"
                ? "Tidak ada barang yang sesuai dengan filter"
                : "Belum ada data barang. Tambah barang pertama Anda!"}
            </Alert>
          ) : (
            <Table hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>Kode</th>
                  <th>Nama Barang</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Lokasi</th>
                  <th>Harga</th>
                  <th>Aging</th>
                  <th>Status</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBarang.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Badge bg="secondary">{item.kode_barang}</Badge>
                    </td>
                    <td>
                      <div>
                        <strong>{item.nama}</strong>
                        <br />
                        <small className="text-muted">
                          {item.keterangan || "Tidak ada keterangan"}
                        </small>
                      </div>
                    </td>
                    <td>
                      {item.kategori ? (
                        <Badge bg="info" pill className="px-3 py-2 fw-normal">{item.kategori.nama_kategori}</Badge>
                      ) : (
                        <small className="text-muted">-</small>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Badge
                          bg={getStockColor(item.stok)}
                          pill
                          className="me-2 px-3 py-2 fw-normal"
                          style={{ minWidth: "60px" }}
                        >
                          {item.stok} unit
                        </Badge>
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => openStokModal(item, "tambah")}
                            title="Tambah Stok"
                          >
                            <FaArrowUp />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => openStokModal(item, "kurangi")}
                            title="Kurangi Stok"
                            disabled={item.stok === 0}
                          >
                            <FaArrowDown />
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td>{item.lokasi || "-"}</td>
                    <td>
                      {item.harga_terakhir > 0 ? (
                        <>
                          <strong style={{ color: "#2563eb" }}>Rp {Number(item.harga_terakhir).toLocaleString("id-ID")}</strong>
                          {item.harga_rata > 0 && item.harga_rata !== item.harga_terakhir && (
                            <><br /><small className="text-muted">Avg: Rp {Number(item.harga_rata).toLocaleString("id-ID")}</small></>
                          )}
                        </>
                      ) : (
                        <small className="text-muted">Belum ada</small>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">
                        <FaClock className="me-1" />
                        {item.batas_aging_hari || 180} hari
                      </small>
                    </td>
                    <td>{getStatusBadge(item.stok)}</td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => openDetailModal(item)}
                          title="Detail & Batches"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          title="Edit"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          title="Hapus"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <small className="text-muted">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredBarang.length)} dari {filteredBarang.length} barang
              </small>
              <div className="d-flex align-items-center gap-1">
                <Button size="sm" variant="outline-primary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <FaChevronLeft className="me-1" /> Previous
                </Button>
                {(() => {
                  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
                  const pages = new Set([1, totalPages]);
                  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.add(i);
                  const sorted = [...pages].sort((a, b) => a - b);
                  const result = [];
                  sorted.forEach((p, idx) => { if (idx > 0 && p - sorted[idx - 1] > 1) result.push("..."); result.push(p); });
                  return result;
                })().map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-muted">…</span>
                  ) : (
                    <Button key={p} size="sm" variant={p === currentPage ? "primary" : "outline-primary"} onClick={() => setCurrentPage(p)} style={{ minWidth: 36 }}>
                      {p}
                    </Button>
                  )
                )}
                <Button size="sm" variant="outline-primary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  Next <FaChevronRight className="ms-1" />
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* MODAL: Tambah Barang */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Tambah Barang Baru</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddBarang}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kode Barang *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="BRG001"
                    value={formData.kode_barang}
                    onChange={(e) =>
                      setFormData({ ...formData, kode_barang: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Barang *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nama barang"
                    value={formData.nama}
                    onChange={(e) =>
                      setFormData({ ...formData, nama: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select
                    value={formData.kategori_id}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori_id: e.target.value })
                    }
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {kategoriList.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Stok Awal *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.stok}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stok: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Lokasi *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="RAK-A1"
                    value={formData.lokasi}
                    onChange={(e) =>
                      setFormData({ ...formData, lokasi: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Batas Aging (hari)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.batas_aging_hari}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        batas_aging_hari: parseInt(e.target.value) || 180,
                      })
                    }
                  />
                  <Form.Text className="text-muted">
                    Peringatan muncul jika batch melewati batas ini di gudang
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Keterangan</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Deskripsi barang, spesifikasi, catatan..."
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              Simpan Barang
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL: Edit Barang */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Barang: {editForm?.kode_barang}</Modal.Title>
        </Modal.Header>
        {editForm && (
          <Form onSubmit={handleEditBarang}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Kode Barang</Form.Label>
                    <Form.Control
                      type="text"
                      value={editForm.kode_barang}
                      disabled
                    />
                    <Form.Text className="text-muted">
                      Kode barang tidak dapat diubah
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nama Barang *</Form.Label>
                    <Form.Control
                      type="text"
                      value={editForm.nama}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nama: e.target.value })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Kategori</Form.Label>
                    <Form.Select
                      value={editForm.kategori_id || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, kategori_id: e.target.value || null })
                      }
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {kategoriList.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Stok *</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={editForm.stok}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          stok: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Lokasi *</Form.Label>
                    <Form.Control
                      type="text"
                      value={editForm.lokasi}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lokasi: e.target.value })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Batas Aging (hari)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={editForm.batas_aging_hari || 180}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          batas_aging_hari: parseInt(e.target.value) || 180,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Keterangan</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editForm.keterangan || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, keterangan: e.target.value })
                  }
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Batal
              </Button>
              <Button variant="primary" type="submit">
                Update Barang
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>

      {/* MODAL: Detail Barang with Batch Tabs */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detail Barang: {selectedBarang?.nama}</Modal.Title>
        </Modal.Header>
        {selectedBarang && (
          <Modal.Body>
            <Tabs
              activeKey={detailTab}
              onSelect={(k) => setDetailTab(k)}
              className="mb-3"
            >
              {/* Tab: Info */}
              <Tab eventKey="info" title="📋 Informasi Umum">
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Kode Barang:</strong>
                      <div className="mt-1">
                        <Badge bg="secondary" className="fs-6">
                          {selectedBarang.kode_barang}
                        </Badge>
                      </div>
                    </div>
                    <div className="mb-3">
                      <strong>Nama Barang:</strong>
                      <div className="mt-1 fs-5">{selectedBarang.nama}</div>
                    </div>
                    <div className="mb-3">
                      <strong>Stok Total:</strong>
                      <div className="mt-1">
                        <Badge
                          bg={getStockColor(selectedBarang.stok)}
                          className="fs-6"
                        >
                          {selectedBarang.stok} unit
                        </Badge>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Lokasi:</strong>
                      <div className="mt-1 fs-5">
                        {selectedBarang.lokasi || "-"}
                      </div>
                    </div>
                    <div className="mb-3">
                      <strong>Status:</strong>
                      <div className="mt-1">
                        {getStatusBadge(selectedBarang.stok)}
                      </div>
                    </div>
                    <div className="mb-3">
                      <strong>💰 Harga Terakhir:</strong>
                      <div className="mt-1 fs-5">
                        {selectedBarang.harga_terakhir > 0 ? (
                          <Badge bg="primary" className="fs-6">
                            Rp {Number(selectedBarang.harga_terakhir).toLocaleString("id-ID")}
                          </Badge>
                        ) : (
                          <small className="text-muted">Belum ada data harga</small>
                        )}
                      </div>
                      {selectedBarang.harga_rata > 0 && (
                        <small className="text-muted d-block mt-1">
                          Rata-rata: Rp {Number(selectedBarang.harga_rata).toLocaleString("id-ID")}
                        </small>
                      )}
                      {selectedBarang.total_nilai_stok > 0 && (
                        <small className="text-success d-block">
                          Total Nilai: Rp {Number(selectedBarang.total_nilai_stok).toLocaleString("id-ID")}
                        </small>
                      )}
                    </div>
                    <div className="mb-3">
                      <strong>Batas Aging:</strong>
                      <div className="mt-1">
                        <Badge bg="info">
                          <FaClock className="me-1" />
                          {selectedBarang.batas_aging_hari || 180} hari
                        </Badge>
                      </div>
                    </div>
                    <div className="mb-3">
                      <strong>Terakhir Update:</strong>
                      <div className="mt-1">
                        {new Date(selectedBarang.updated_at).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </Col>
                </Row>
                <div className="mt-3">
                  <strong>Keterangan:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {selectedBarang.keterangan || "Tidak ada keterangan"}
                  </div>
                </div>
              </Tab>

              {/* Tab: Stock Batches (FIFO) */}
              <Tab eventKey="batches" title={`📦 Stock Batches (${batchesData.length})`}>
                {batchesLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" size="sm" />
                    <span className="ms-2">Memuat data batch...</span>
                  </div>
                ) : batchesData.length === 0 ? (
                  <Alert variant="info" className="mb-0">
                    Belum ada stock batch untuk barang ini. Batch akan terbuat otomatis saat transaksi masuk.
                  </Alert>
                ) : (
                  <>
                    <Alert variant="light" className="border mb-3">
                      <small>
                        <strong>📌 FIFO (First In, First Out):</strong> Saat barang keluar, sistem akan otomatis mengambil dari batch <strong>tertua</strong> terlebih dahulu.
                        Batch dengan tanggal kadaluarsa lebih dekat akan diprioritaskan.
                      </small>
                    </Alert>
                    <Table hover responsive size="sm">
                      <thead className="table-secondary">
                        <tr>
                          <th>#</th>
                          <th>Kode Batch</th>
                          <th>Tgl Masuk</th>
                          <th>Kadaluarsa</th>
                          <th>Masuk</th>
                          <th>Sisa</th>
                          <th>Umur</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchesData.map((batch, idx) => {
                          const batasAging = selectedBarang.batas_aging_hari || 180;
                          return (
                            <tr key={batch.id} className={batch.sisa_stok === 0 ? "text-muted" : ""}>
                              <td>{idx + 1}</td>
                              <td>
                                <small className="font-monospace">{batch.kode_batch}</small>
                              </td>
                              <td>
                                {new Date(batch.tanggal_masuk).toLocaleDateString("id-ID")}
                              </td>
                              <td>
                                {batch.tanggal_kadaluarsa ? (
                                  <span className={batch.is_expired ? "text-danger fw-bold" : ""}>
                                    {new Date(batch.tanggal_kadaluarsa).toLocaleDateString("id-ID")}
                                  </span>
                                ) : (
                                  <small className="text-muted">-</small>
                                )}
                              </td>
                              <td>{batch.jumlah_masuk}</td>
                              <td>
                                <Badge bg={batch.sisa_stok === 0 ? "secondary" : "primary"}>
                                  {batch.sisa_stok}
                                </Badge>
                              </td>
                              <td>
                                <small>{formatUmur(batch.umur_hari)}</small>
                              </td>
                              <td>
                                {batch.sisa_stok === 0 ? (
                                  <Badge bg="secondary">Habis</Badge>
                                ) : batch.is_expired ? (
                                  <Badge bg="danger">EXPIRED</Badge>
                                ) : batch.is_aging ? (
                                  <Badge bg="warning" text="dark">
                                    <FaClock className="me-1" />Aging
                                  </Badge>
                                ) : (
                                  <Badge bg="success">OK</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                    <div className="d-flex gap-3 mt-2 text-muted small">
                      <span>
                        <Badge bg="success" className="me-1">OK</Badge> Normal
                      </span>
                      <span>
                        <Badge bg="warning" text="dark" className="me-1">Aging</Badge> Melewati batas {selectedBarang.batas_aging_hari || 180} hari
                      </span>
                      <span>
                        <Badge bg="danger" className="me-1">EXPIRED</Badge> Sudah kadaluarsa
                      </span>
                      <span>
                        <Badge bg="secondary" className="me-1">Habis</Badge> Stok batch sudah 0
                      </span>
                    </div>
                  </>
                )}
              </Tab>
            </Tabs>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Tutup
          </Button>
          {selectedBarang && (
            <Button
              variant="primary"
              onClick={() => {
                setShowDetailModal(false);
                openEditModal(selectedBarang);
              }}
            >
              <FaEdit className="me-2" /> Edit Barang
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* MODAL: Update Stok */}
      <Modal
        show={showStokModal}
        onHide={() => setShowStokModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {stokAction === "tambah" ? "Tambah" : "Kurangi"} Stok
          </Modal.Title>
        </Modal.Header>
        {selectedBarang && (
          <Modal.Body>
            <div className="text-center mb-4">
              <h5>{selectedBarang.nama}</h5>
              <p className="text-muted">{selectedBarang.kode_barang}</p>
              <div>
                Stok saat ini:{" "}
                <Badge bg={getStockColor(selectedBarang.stok)} className="fs-6">
                  {selectedBarang.stok} unit
                </Badge>
              </div>
            </div>

            <Form.Group>
              <Form.Label>
                Jumlah yang akan di
                {stokAction === "tambah" ? "tambah" : "kurangi"}:
              </Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={stokAction === "kurangi" ? selectedBarang.stok : undefined}
                value={stokAmount}
                onChange={(e) => setStokAmount(e.target.value)}
                placeholder="Masukkan jumlah"
                className="text-center fs-4"
              />
              {stokAction === "kurangi" && (
                <Form.Text className="text-danger">
                  Maksimal: {selectedBarang.stok} unit
                </Form.Text>
              )}
            </Form.Group>

            {stokAction === "tambah" && (
              <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
                <small>
                  📦 Batch baru akan dibuat untuk stok ini. Stok akan bertambah dari {selectedBarang.stok} menjadi{" "}
                  <strong>
                    {selectedBarang.stok + parseInt(stokAmount || 0)}
                  </strong>{" "}
                  unit
                </small>
              </div>
            )}

            {stokAction === "kurangi" && (
              <div className="mt-3 p-3 bg-warning bg-opacity-10 rounded">
                <small>
                  📤 Stok akan dikurangi menggunakan <strong>FIFO</strong> (dari batch tertua). Stok akan berkurang dari {selectedBarang.stok} menjadi{" "}
                  <strong>
                    {selectedBarang.stok - parseInt(stokAmount || 0)}
                  </strong>{" "}
                  unit
                </small>
              </div>
            )}
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStokModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleStokUpdate}>
            {stokAction === "tambah" ? "Tambah" : "Kurangi"} Stok
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
