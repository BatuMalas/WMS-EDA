import React, { useState, useEffect } from "react";
import {
  Container, Row, Col, Card, Form, Button, Image, Tab, Nav, Badge, Alert, Spinner
} from "react-bootstrap";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaKey } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import AuthService from "../../services/authService";
import { toast } from "react-toastify";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: "", email: "", phone: "", address: "", role: "", created_at: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "", new_password: "", new_password_confirmation: "",
  });

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        role: user.role || "",
        created_at: user.created_at || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await AuthService.updateProfile({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
      });
      updateUser(res.data.data);
      setIsEditing(false);
      toast.success("Profile berhasil diupdate!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal update profile");
    } finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await AuthService.changePassword(passwordData);
      toast.success("Password berhasil diubah!");
      setPasswordData({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengubah password");
    }
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || "User")}&background=0D8ABC&color=fff&size=200`;

  return (
    <Container fluid className="py-4">
      <h1 className="fw-bold mb-4"><FaUser className="me-2" />Profile Pengguna</h1>
      <Row>
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow text-center">
            <Card.Body className="py-5">
              <Image src={avatarUrl} roundedCircle width={120} height={120}
                className="mb-3 border border-3 border-primary" />
              <h4>{userData.name}</h4>
              <Badge bg={userData.role === "admin" ? "danger" : "primary"} className="mb-3">
                {userData.role}
              </Badge>
              <p className="text-muted"><FaEnvelope className="me-2" />{userData.email}</p>
              {userData.phone && <p className="text-muted"><FaPhone className="me-2" />{userData.phone}</p>}
              {userData.address && <p className="text-muted"><FaMapMarkerAlt className="me-2" />{userData.address}</p>}
              <Button variant={isEditing ? "success" : "primary"} className="mt-3"
                onClick={isEditing ? handleSave : () => setIsEditing(true)} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> :
                  isEditing ? <><FaSave className="me-2" />Simpan</> : <><FaEdit className="me-2" />Edit Profile</>}
              </Button>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow mt-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0"><FaKey className="me-2" />Ganti Password</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleChangePassword}>
                <Form.Group className="mb-3">
                  <Form.Label>Password Saat Ini</Form.Label>
                  <Form.Control type="password" value={passwordData.current_password} required
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password Baru</Form.Label>
                  <Form.Control type="password" value={passwordData.new_password} required minLength={6}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Konfirmasi Password Baru</Form.Label>
                  <Form.Control type="password" value={passwordData.new_password_confirmation} required
                    onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })} />
                </Form.Group>
                <Button variant="warning" className="w-100" type="submit">Ganti Password</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow">
            <Card.Header className="bg-light"><h5 className="mb-0">Edit Profile</h5></Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nama Lengkap</Form.Label>
                      <Form.Control type="text" value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        disabled={!isEditing} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        disabled={!isEditing} />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nomor Telepon</Form.Label>
                      <Form.Control type="tel" value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        disabled={!isEditing} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Control type="text" value={userData.role} disabled />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Alamat</Form.Label>
                  <Form.Control as="textarea" rows={3} value={userData.address}
                    onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                    disabled={!isEditing} />
                </Form.Group>
                {isEditing && (
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>Batal</Button>
                    <Button variant="primary" onClick={handleSave} disabled={loading}>
                      <FaSave className="me-2" />Simpan Perubahan
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
