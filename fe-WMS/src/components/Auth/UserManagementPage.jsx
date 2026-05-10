import React, { useState, useEffect } from "react";
import {
    Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Spinner, Alert
} from "react-bootstrap";
import { FaUsers, FaPlus, FaEdit, FaTrash, FaKey } from "react-icons/fa";
import AuthService from "../../services/authService";
import { toast } from "react-toastify";

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [formData, setFormData] = useState({
        name: "", username: "", email: "", password: "", password_confirmation: "", role: "petugas",
        phone: "", address: "",
    });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await AuthService.getUsers();
            setUsers(res.data.data);
        } catch (error) {
            toast.error("Gagal memuat data user");
        } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const { password, password_confirmation, ...updateData } = formData;
                await AuthService.updateUser(editingUser.id, updateData);
                toast.success("User berhasil diupdate");
            } else {
                await AuthService.createUser(formData);
                toast.success("User berhasil ditambahkan");
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            const msg = error.response?.data?.message || "Gagal menyimpan user";
            toast.error(msg);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus user ini?")) return;
        try {
            await AuthService.deleteUser(id);
            toast.success("User berhasil dihapus");
            fetchUsers();
        } catch (error) {
            const msg = error.response?.data?.message || "Gagal menghapus user";
            toast.error(msg);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await AuthService.resetPassword(selectedUserId, newPassword);
            toast.success("Password berhasil direset");
            setShowPasswordModal(false);
            setNewPassword("");
        } catch (error) {
            toast.error("Gagal reset password");
        }
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name, username: user.username || "", email: user.email || "", password: "", password_confirmation: "",
            role: user.role, phone: user.phone || "", address: user.address || "",
        });
        setShowModal(true);
    };

    const openCreate = () => {
        setEditingUser(null);
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "", username: "", email: "", password: "", password_confirmation: "", role: "petugas",
            phone: "", address: "",
        });
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Memuat data user...</p>
            </div>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="fw-bold"><FaUsers className="me-2" />Data Pengguna</h1>
                <Button variant="primary" className="rounded-pill px-4 shadow-sm" onClick={openCreate}>
                    <FaPlus className="me-2" />Tambah User
                </Button>
            </div>

            <Card className="border-0 shadow-sm" style={{ borderRadius: "16px" }}>
                <Card.Body>
                    <Table responsive hover>
                        <thead className="table-dark">
                            <tr>
                                <th>#</th><th>Group (Role)</th><th>Username</th><th>Nama Lengkap</th>
                                <th>Password</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={user.id}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <Badge pill className="px-3 py-2 fw-normal" bg={user.role === "admin" ? "danger" : user.role === "manajer" ? "warning" : "primary"}>
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td>{user.username || "-"}</td>
                                    <td>{user.name}</td>
                                    <td><span className="text-muted">••••••</span></td>
                                    <td>
                                        <Button variant="outline-warning" size="sm" className="me-1"
                                            onClick={() => openEdit(user)} title="Edit">
                                            <FaEdit />
                                        </Button>
                                        <Button variant="outline-danger" size="sm" className="me-1"
                                            onClick={() => handleDelete(user.id)} title="Hapus">
                                            <FaTrash />
                                        </Button>
                                        <Button variant="outline-info" size="sm"
                                            onClick={() => { setSelectedUserId(user.id); setShowPasswordModal(true); }}
                                            title="Reset Password">
                                            <FaKey />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {users.length === 0 && (
                        <Alert variant="info" className="text-center">Belum ada data user.</Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingUser ? "Edit User" : "Tambah User Baru"}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Nama</Form.Label>
                            <Form.Control type="text" value={formData.name} required
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control type="text" value={formData.username} required
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                        </Form.Group>
                        {!editingUser && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" value={formData.password} required
                                        minLength={6}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Konfirmasi Password</Form.Label>
                                    <Form.Control type="password" value={formData.password_confirmation} required
                                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })} />
                                </Form.Group>
                            </>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                <option value="petugas">Staff/Petugas</option>
                                <option value="manajer">Manajer</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Telepon</Form.Label>
                            <Form.Control type="text" value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Alamat</Form.Label>
                            <Form.Control as="textarea" rows={2} value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button variant="primary" type="submit">
                            {editingUser ? "Update" : "Tambah"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Reset Password Modal */}
            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Reset Password</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleResetPassword}>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Password Baru</Form.Label>
                            <Form.Control type="password" value={newPassword} required minLength={6}
                                onChange={(e) => setNewPassword(e.target.value)} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Batal</Button>
                        <Button variant="warning" type="submit">Reset Password</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}
