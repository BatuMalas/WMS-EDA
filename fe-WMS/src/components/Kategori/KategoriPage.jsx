import React, { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form, InputGroup, Badge, Spinner } from "react-bootstrap";
import { FaPlus, FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import KategoriService from "../../services/kategoriService";

export default function KategoriPage() {
  const [kategoris, setKategoris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ kode_kategori: "", nama_kategori: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await KategoriService.getAll();
      setKategoris(res.data.data);
    } catch { toast.error("Gagal memuat data kategori"); }
    finally { setLoading(false); }
  };

  const filtered = kategoris.filter(k =>
    k.nama_kategori.toLowerCase().includes(search.toLowerCase()) ||
    k.kode_kategori.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await KategoriService.update(selected.id, form);
        toast.success("Kategori berhasil diupdate");
      } else {
        await KategoriService.create(form);
        toast.success("Kategori berhasil ditambahkan");
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Gagal menyimpan"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus kategori ini?")) return;
    try {
      await KategoriService.delete(id);
      toast.success("Kategori berhasil dihapus");
      fetchData();
    } catch { toast.error("Gagal menghapus kategori"); }
  };

  const openEdit = (k) => {
    setForm({ kode_kategori: k.kode_kategori, nama_kategori: k.nama_kategori });
    setSelected(k);
    setEditMode(true);
    setShowModal(true);
  };

  const openAdd = () => { resetForm(); setEditMode(false); setShowModal(true); };
  const resetForm = () => setForm({ kode_kategori: "", nama_kategori: "" });

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h3 className="mb-4">🏷️ Kategori Barang</h3>
      <Card className="shadow-sm border-0" style={{ borderRadius: "16px" }}>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <Button variant="primary" className="rounded-pill px-4 shadow-sm" onClick={openAdd}><FaPlus className="me-2" />Tambah Kategori</Button>
            <InputGroup style={{ maxWidth: 300 }}>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control placeholder="Cari Kategori..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
          </div>
          <Table hover responsive className="border-top">
            <thead className="table-dark">
              <tr><th>#</th><th>Kode Kategori</th><th>Nama Kategori</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filtered.map((k, i) => (
                <tr key={k.id}>
                  <td>{i + 1}</td>
                  <td><Badge bg="info" pill className="px-3 py-2 fw-normal">{k.kode_kategori}</Badge></td>
                  <td>{k.nama_kategori}</td>
                  <td>
                    <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openEdit(k)}><FaEdit /></Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(k.id)}><FaTrash /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="text-center text-muted">Tidak ada data</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{editMode ? "Edit" : "Tambah"} Kategori</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Kode Kategori</Form.Label>
              <Form.Control required value={form.kode_kategori} onChange={e => setForm({ ...form, kode_kategori: e.target.value })} disabled={editMode} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Nama Kategori</Form.Label>
              <Form.Control required value={form.nama_kategori} onChange={e => setForm({ ...form, nama_kategori: e.target.value })} /></Form.Group>
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
