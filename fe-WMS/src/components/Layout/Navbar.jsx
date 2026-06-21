import React from "react";
import {
  Navbar as BSNavbar, Container, Nav, Badge, Dropdown,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaBell, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import StockifySide from "../../assets/Stockify-side.png";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <BSNavbar bg="white" variant="light" expand="lg" className="border-bottom fixed-top"
      style={{ zIndex: 1030, height: "64px" }}>
      <Container fluid className="px-4 py-2">
        <BSNavbar.Brand as={Link} to="/" className="fw-bold text-dark d-flex align-items-center">
          <img src={StockifySide} alt="Stockify Logo" height="46" className="me-2" />

        </BSNavbar.Brand>

        <BSNavbar.Toggle aria-controls="navbar-nav" />

        <BSNavbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav className="align-items-center">
            {/* Notifikasi disembunyikan sementara - belum ada fungsinya */}

            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="d-flex align-items-center text-decoration-none text-dark p-0 border-0">
                <FaUserCircle className="me-2" />
                <span>{user?.name || "User"}</span>
                {user?.role && (
                  <Badge bg={user.role === "admin" ? "danger" : user.role === "manajer" ? "warning" : "info"} className="ms-2" style={{ fontSize: "10px" }}>
                    {user.role}
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
                {/* Settings disembunyikan sementara - belum ada fungsinya */}
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" />Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}
