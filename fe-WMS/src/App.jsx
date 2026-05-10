import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./components/Auth/LoginPage";
import UserManagementPage from "./components/Auth/UserManagementPage";

// Pages
import Dashboard from "./components/Dashboard/Dashboard";
import BarangPage from "./components/Barang/BarangPage";
import SupplierPage from "./components/Supplier/SupplierPage";
import CustomerPage from "./components/Customer/CustomerPage";
import KategoriPage from "./components/Kategori/KategoriPage";
import GudangPage from "./components/Gudang/GudangPage";
import SettingsPage from "./components/Settings/SettingsPage";
import ProfilePage from "./components/pages/ProfilePage";

// Manajer pages
import BarangMasukPage from "./components/Manajer/BarangMasukPage";
import BarangKeluarPage from "./components/Manajer/BarangKeluarPage";
import StokBarangPage from "./components/Manajer/StokBarangPage";

// Petugas pages
import BarangMasukForm from "./components/Petugas/BarangMasukForm";
import BarangKeluarForm from "./components/Petugas/BarangKeluarForm";

// Layout Components
import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Role-based Route wrappers
function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}

function ManajerRoute({ children }) {
  const { isManajer } = useAuth();
  if (!isManajer()) return <Navigate to="/dashboard" replace />;
  return children;
}

function PetugasRoute({ children }) {
  const { isPetugas } = useAuth();
  if (!isPetugas()) return <Navigate to="/dashboard" replace />;
  return children;
}

// Combined route: accessible by multiple roles
function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

// Main layout with navbar + sidebar
function AppLayout() {
  return (
    <div className="app" style={{ minHeight: "100vh", paddingTop: "64px" }}>
      <Navbar />
      <div className="d-flex">
        <Sidebar />
        <Container fluid className="p-4" style={{ marginLeft: "250px" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin routes */}
            <Route path="/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
            <Route path="/customer" element={<RoleRoute roles={["admin", "manajer"]}><CustomerPage /></RoleRoute>} />

            {/* Supplier: admin + manajer */}
            <Route path="/supplier" element={<RoleRoute roles={["admin", "manajer"]}><SupplierPage /></RoleRoute>} />

            {/* Barang: manajer + petugas */}
            <Route path="/barang" element={<RoleRoute roles={["manajer", "petugas"]}><BarangPage /></RoleRoute>} />

            {/* Manajer routes */}
            <Route path="/barang-masuk" element={<ManajerRoute><BarangMasukPage /></ManajerRoute>} />
            <Route path="/barang-keluar" element={<ManajerRoute><BarangKeluarPage /></ManajerRoute>} />
            <Route path="/stok-barang" element={<ManajerRoute><StokBarangPage /></ManajerRoute>} />

            {/* Petugas routes */}
            <Route path="/barang-masuk-form" element={<PetugasRoute><BarangMasukForm /></PetugasRoute>} />
            <Route path="/barang-keluar-form" element={<PetugasRoute><BarangKeluarForm /></PetugasRoute>} />
            <Route path="/kategori" element={<PetugasRoute><KategoriPage /></PetugasRoute>} />
            <Route path="/gudang" element={<RoleRoute roles={["admin", "manajer", "petugas"]}><GudangPage /></RoleRoute>} />

            {/* Settings: admin + manajer */}
            <Route path="/settings" element={<RoleRoute roles={["admin", "manajer"]}><SettingsPage /></RoleRoute>} />
          </Routes>
        </Container>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
