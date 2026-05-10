import React, { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form, InputGroup, Badge, Spinner } from "react-bootstrap";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaInfoCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import CustomerService from "../../services/customerService";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ kode_customer: "", nama: "", telepon: "", email: "", alamat: "" });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await CustomerService.getAll();
      setCustomers(res.data.data);
    } catch { toast.error("Gagal memuat data customer"); }
    finally { setLoading(false); }
  };

  const filtered = customers.filter(c =>
    c.nama.toLowerCase().includes(search.toLowerCase()) ||
    c.kode_customer.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await CustomerService.update(selectedCustomer.id, form);
        toast.success("Customer berhasil diupdate");
      } else {
        await CustomerService.create(form);
        toast.success("Customer berhasil ditambahkan");
      }
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan customer");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus customer ini?")) return;
    try {
      await CustomerService.delete(id);
      toast.success("Customer berhasil dihapus");
      fetchCustomers();
    } catch { toast.error("Gagal menghapus customer"); }
  };

  const openEdit = (c) => {
    setForm({ kode_customer: c.kode_customer, nama: c.nama, telepon: c.telepon || "", email: c.email || "", alamat: c.alamat || "" });
    setSelectedCustomer(c);
    setEditMode(true);
    setShowModal(true);
  };

  const openAdd = () => { resetForm(); setEditMode(false); setShowModal(true); };

  const resetForm = () => setForm({ kode_customer: "", nama: "", telepon: "", email: "", alamat: "" });

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h3 className="mb-4">📋 Data Customer</h3>
      <Card className="shadow-sm border-0" style={{ borderRadius: "16px" }}>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <Button variant="primary" className="rounded-pill px-4 shadow-sm" onClick={openAdd}><FaPlus className="me-2" />Tambah Customer</Button>
            <InputGroup style={{ maxWidth: 300 }}>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control placeholder="Cari Customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
          </div>
          <Table hover responsive className="border-top">
            <thead className="table-dark">
              <tr>
                <th>No</th><th>Kode Customer</th><th>Nama</th><th>No Telp./WA</th><th>Email</th><th>Alamat</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td><Badge bg="info" pill className="px-3 py-2 fw-normal">{c.kode_customer}</Badge></td>
                  <td>{c.nama}</td>
                  <td>{c.telepon || "-"}</td>
                  <td>{c.email || "-"}</td>
                  <td>{c.alamat || "-"}</td>
                  <td>
                    <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openEdit(c)}><FaEdit /></Button>
                    <Button size="sm" variant="outline-danger" className="me-1" onClick={() => handleDelete(c.id)}><FaTrash /></Button>
                    <Button size="sm" variant="outline-info" onClick={() => { setSelectedCustomer(c); setShowInfo(true); }}><FaInfoCircle /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-muted">Tidak ada data</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{editMode ? "Edit" : "Tambah"} Customer</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Kode Customer</Form.Label>
              <Form.Control required value={form.kode_customer} onChange={e => setForm({ ...form, kode_customer: e.target.value })} disabled={editMode} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Nama</Form.Label>
              <Form.Control required value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>No Telp./WA</Form.Label>
              <Form.Control value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Alamat</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} /></Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" type="submit">{editMode ? "Update" : "Simpan"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Info Modal */}
      <Modal show={showInfo} onHide={() => setShowInfo(false)} centered>
        <Modal.Header closeButton><Modal.Title>Detail Customer</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedCustomer && (
            <div>
              <p><strong>Kode:</strong> {selectedCustomer.kode_customer}</p>
              <p><strong>Nama:</strong> {selectedCustomer.nama}</p>
              <p><strong>Telepon:</strong> {selectedCustomer.telepon || "-"}</p>
              <p><strong>Email:</strong> {selectedCustomer.email || "-"}</p>
              <p><strong>Alamat:</strong> {selectedCustomer.alamat || "-"}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
