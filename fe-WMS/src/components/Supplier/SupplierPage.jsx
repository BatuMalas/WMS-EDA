import React, { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form, InputGroup, Badge, Spinner } from "react-bootstrap";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaInfoCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import SupplierService from "../../services/supplierService";
import { useAuth } from "../../context/AuthContext";

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({ kode_supplier: "", nama_supplier: "", nama_kontak: "", telepon: "", email: "", alamat: "", kota: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await SupplierService.getAll();
      setSuppliers(res.data.data);
    } catch { toast.error("Gagal memuat data supplier"); }
    finally { setLoading(false); }
  };

  const filtered = suppliers.filter(s =>
    (s.nama_supplier || "").toLowerCase().includes(search.toLowerCase()) ||
    s.kode_supplier.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await SupplierService.update(selected.id, form);
        toast.success("Supplier berhasil diupdate");
      } else {
        await SupplierService.create(form);
        toast.success("Supplier berhasil ditambahkan");
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Gagal menyimpan"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus supplier ini?")) return;
    try {
      await SupplierService.delete(id);
      toast.success("Supplier berhasil dihapus");
      fetchData();
    } catch { toast.error("Gagal menghapus supplier"); }
  };

  const openEdit = (s) => {
    setForm({
      kode_supplier: s.kode_supplier, nama_supplier: s.nama_supplier,
      nama_kontak: s.nama_kontak || "", telepon: s.telepon || "",
      email: s.email || "", alamat: s.alamat || "", kota: s.kota || "",
    });
    setSelected(s);
    setEditMode(true);
    setShowModal(true);
  };

  const openAdd = () => { resetForm(); setEditMode(false); setShowModal(true); };
  const resetForm = () => setForm({ kode_supplier: "", nama_supplier: "", nama_kontak: "", telepon: "", email: "", alamat: "", kota: "" });

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h3 className="mb-4">🚛 Data Supplier</h3>
      <Card className="shadow-sm border-0" style={{ borderRadius: "16px" }}>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            {isAdmin() && <Button variant="primary" className="rounded-pill px-4 shadow-sm" onClick={openAdd}><FaPlus className="me-2" />Tambah Supplier</Button>}
            <InputGroup style={{ maxWidth: 300 }}>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control placeholder="Cari Supplier..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
          </div>
          <Table hover responsive className="border-top">
            <thead className="table-dark">
              <tr>
                <th>No</th><th>Kode</th><th>Nama Supplier</th><th>Nama Kontak</th>
                <th>No Telp./WA</th><th>Email</th><th>Kota</th><th>Alamat</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td><Badge bg="info" pill className="px-3 py-2 fw-normal">{s.kode_supplier}</Badge></td>
                  <td>{s.nama_supplier}</td>
                  <td>{s.nama_kontak || "-"}</td>
                  <td>{s.telepon || "-"}</td>
                  <td>{s.email || "-"}</td>
                  <td>{s.kota || "-"}</td>
                  <td>{s.alamat || "-"}</td>
                  <td className="text-nowrap">
                    <Button size="sm" variant="outline-info" className="me-1" onClick={() => { setSelected(s); setShowInfo(true); }}><FaInfoCircle /></Button>
                    <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openEdit(s)}><FaEdit /></Button>
                    {isAdmin() && <Button size="sm" variant="outline-danger" onClick={() => handleDelete(s.id)}><FaTrash /></Button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center text-muted">Tidak ada data</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{editMode ? "Edit" : "Tambah"} Supplier</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Kode Supplier</Form.Label>
              <Form.Control required value={form.kode_supplier} onChange={e => setForm({ ...form, kode_supplier: e.target.value })} disabled={editMode} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Nama Supplier</Form.Label>
              <Form.Control required value={form.nama_supplier} onChange={e => setForm({ ...form, nama_supplier: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Nama Kontak</Form.Label>
              <Form.Control value={form.nama_kontak} onChange={e => setForm({ ...form, nama_kontak: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>No Telp./WA</Form.Label>
              <Form.Control value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Kota</Form.Label>
              <Form.Control value={form.kota} onChange={e => setForm({ ...form, kota: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Alamat Lengkap</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} /></Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" type="submit">{editMode ? "Update" : "Simpan"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showInfo} onHide={() => setShowInfo(false)} centered>
        <Modal.Header closeButton><Modal.Title>Detail Supplier</Modal.Title></Modal.Header>
        <Modal.Body>
          {selected && (
            <div>
              <p><strong>Kode:</strong> {selected.kode_supplier}</p>
              <p><strong>Nama Supplier:</strong> {selected.nama_supplier}</p>
              <p><strong>Nama Kontak:</strong> {selected.nama_kontak || "-"}</p>
              <p><strong>Telepon:</strong> {selected.telepon || "-"}</p>
              <p><strong>Email:</strong> {selected.email || "-"}</p>
              <p><strong>Kota:</strong> {selected.kota || "-"}</p>
              <p><strong>Alamat:</strong> {selected.alamat || "-"}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
