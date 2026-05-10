import React, { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form, InputGroup, Badge, Spinner, Row, Col } from "react-bootstrap";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaWarehouse } from "react-icons/fa";
import { toast } from "react-toastify";
import GudangService from "../../services/gudangService";

export default function GudangPage() {
  const [gudangs, setGudangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ kode_gudang: "", nama_gudang: "", deskripsi: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await GudangService.getAll();
      setGudangs(res.data.data || []);
    } catch { toast.error("Gagal memuat data gudang"); }
    finally { setLoading(false); }
  };

  const filtered = gudangs.filter(g =>
    g.nama_gudang?.toLowerCase().includes(search.toLowerCase()) ||
    g.kode_gudang?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await GudangService.update(selected.id, form);
        toast.success("Gudang berhasil diupdate");
      } else {
        await GudangService.create(form);
        toast.success("Gudang berhasil ditambahkan");
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Gagal menyimpan"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus gudang ini?")) return;
    try {
      await GudangService.delete(id);
      toast.success("Gudang berhasil dihapus");
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Gagal menghapus gudang"); }
  };

  const openEdit = (g) => {
    setForm({ kode_gudang: g.kode_gudang, nama_gudang: g.nama_gudang, deskripsi: g.deskripsi || "" });
    setSelected(g);
    setEditMode(true);
    setShowModal(true);
  };

  const openAdd = () => { resetForm(); setEditMode(false); setShowModal(true); };
  const resetForm = () => setForm({ kode_gudang: "", nama_gudang: "", deskripsi: "" });

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h3 className="mb-4"><FaWarehouse className="me-2" />Manajemen Gudang</h3>
      <p className="text-muted mb-4">Kelola gudang dan rak penyimpanan. Format kode: G1-R1 (Gudang 1 Rak 1)</p>

      <Card className="shadow-sm border-0" style={{ borderRadius: "16px" }}>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <Button variant="primary" className="rounded-pill px-4 shadow-sm" onClick={openAdd}><FaPlus className="me-2" />Tambah Gudang</Button>
            <InputGroup style={{ maxWidth: 300 }}>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control placeholder="Cari Gudang..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
          </div>
          <Table hover responsive className="border-top">
            <thead className="table-dark">
              <tr><th>#</th><th>Kode Gudang</th><th>Nama Gudang</th><th>Total Stok</th><th>Deskripsi</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <tr key={g.id}>
                  <td>{i + 1}</td>
                  <td><Badge bg="warning" text="dark" pill className="px-3 py-2 fw-normal">{g.kode_gudang}</Badge></td>
                  <td><strong>{g.nama_gudang}</strong></td>
                  <td>
                    <Badge bg={g.total_stok > 0 ? "success" : "secondary"} pill className="px-3 py-2 fw-normal">
                      {g.total_stok || 0} unit
                    </Badge>
                  </td>
                  <td>{g.deskripsi || "-"}</td>
                  <td>
                    <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openEdit(g)}><FaEdit /></Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(g.id)}><FaTrash /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted">Tidak ada data</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{editMode ? "Edit" : "Tambah"} Gudang</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Kode Gudang *</Form.Label>
              <Form.Control
                required
                value={form.kode_gudang}
                onChange={e => setForm({ ...form, kode_gudang: e.target.value })}
                disabled={editMode}
                placeholder="cth: G1-R1"
              />
              <Form.Text className="text-muted">Format: G[nomor gudang]-R[nomor rak], contoh: G1-R1, G1-R2, G2-R1</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nama Gudang *</Form.Label>
              <Form.Control
                required
                value={form.nama_gudang}
                onChange={e => setForm({ ...form, nama_gudang: e.target.value })}
                placeholder="cth: Gudang 1 Rak 1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Deskripsi</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Deskripsi lokasi gudang..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" type="submit">{editMode ? "Update" : "Simpan"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
