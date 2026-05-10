import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { FaWarehouse, FaSignInAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(username, password);
            navigate("/dashboard");
        } catch (err) {
            const message =
                err.response?.data?.message || "Login gagal. Periksa username dan password.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #1a1c2e 0%, #16213e 50%, #0f3460 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col md={5} lg={4}>
                        <div className="text-center mb-4">
                            <FaWarehouse size={48} className="text-white mb-3" />
                            <h2 className="text-white fw-bold">WMS Login (EDA)</h2>
                            <p className="text-white-50">Warehouse Management System</p>
                        </div>

                        <Card className="border-0 shadow-lg" style={{ borderRadius: "16px" }}>
                            <Card.Body className="p-4">
                                <h4 className="text-center mb-4 fw-bold">Masuk ke Akun</h4>

                                {error && (
                                    <Alert variant="danger" dismissible onClose={() => setError("")}>
                                        {error}
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Username</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Masukkan username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            size="lg"
                                            style={{ borderRadius: "10px" }}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Masukkan password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            size="lg"
                                            style={{ borderRadius: "10px" }}
                                        />
                                    </Form.Group>

                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="w-100 fw-bold"
                                        size="lg"
                                        disabled={loading}
                                        style={{ borderRadius: "10px" }}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <FaSignInAlt className="me-2" />
                                                Login
                                            </>
                                        )}
                                    </Button>
                                </Form>

                                <div className="mt-4 text-center">
                                    <small className="text-muted d-block">Admin: admin / password</small>
                                    <small className="text-muted d-block">Manajer: manajer / password</small>
                                    <small className="text-muted d-block">Petugas: petugas / password</small>
                                </div>
                            </Card.Body>
                        </Card>

                        <p className="text-center text-white-50 mt-3">
                            <small>© 2026 Warehouse Management System</small>
                        </p>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
