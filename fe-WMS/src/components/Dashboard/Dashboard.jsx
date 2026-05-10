import React, { useState, useEffect } from "react";
import { Row, Col, Card, Spinner, Table, Badge, ProgressBar, InputGroup, Form } from "react-bootstrap";
import {
  FaBoxes, FaMoneyBillWave, FaExclamationTriangle, FaExchangeAlt,
  FaArrowDown, FaArrowUp, FaClock, FaTruck, FaUsers, FaUserFriends,
  FaHistory, FaChartLine, FaUserCircle, FaCalendarAlt, FaSearch
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import DashboardService from "../../services/dashboardService";
import { InventoryFlowChart, StockDistributionChart, TopProductsChart } from "./Charts";

// ─── Helpers ───

function formatRupiah(num) {
  if (!num && num !== 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatNumber(num) {
  if (!num && num !== 0) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
}

// ─── Stat Card ───

function StatCard({ label, value, subtitle, icon, colorHex = "#0dcaf0" }) {
  return (
    <Col xl={4} md={6} className="mb-4">
      <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
        <Card.Body className="p-4 position-relative">
          <div className="d-flex flex-column">
            <div className="d-flex align-items-center mb-2">
              {icon && (
                <div className="d-flex align-items-center justify-content-center text-white me-2 rounded-circle shadow-sm"
                     style={{ width: "36px", height: "36px", backgroundColor: colorHex }}>
                  {icon}
                </div>
              )}
            </div>
            <h6 className="fw-bold mb-1" style={{ fontSize: "1.1rem", color: colorHex }}>{label}</h6>
            <h2 className="fw-bolder text-dark mb-1" style={{ fontSize: "2.2rem" }}>{value}</h2>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}

// ─── Section Header ───

function SectionHeader({ icon, title }) {
  return (
    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
      {icon} {title}
    </h6>
  );
}

// ─── Low Stock Table ───

function LowStockTable({ items = [] }) {
  if (!items.length) {
    return (
      <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
        <Card.Header className="bg-white border-bottom-0 pt-4 px-4" style={{ borderRadius: "16px 16px 0 0" }}>
          <h5 className="fw-bold text-dark mb-0">Low Stock Alerts</h5>
          <small className="text-muted">Stok di bawah batas minimum</small>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 200 }}>
          Semua stok dalam kondisi aman 👍
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-100 border-0 mb-4" style={{ borderRadius: "16px" }}>
      <Card.Header className="bg-white border-bottom-0 pt-4 px-4 pb-3" style={{ borderRadius: "16px 16px 0 0" }}>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="fw-bold text-dark mb-1">Low Stock Alerts</h5>
            <small className="text-muted">Stok di bawah batas minimum</small>
          </div>
          <Badge bg="danger" className="rounded-pill px-3 py-2 shadow-sm">{items.length} item</Badge>
        </div>
      </Card.Header>
      <Card.Body className="p-0 pb-3">
        <Table hover responsive className="mb-0" style={{ borderTop: "1px solid #f0f0f0" }}>
          <thead className="bg-light text-dark">
            <tr>
              <th className="border-0 px-4 py-3" style={{ borderRadius: "10px 0 0 10px" }}>Barang</th>
              <th className="border-0 py-3 text-center">Stok</th>
              <th className="border-0 py-3 text-center">Min</th>
              <th className="border-0 px-4 py-3" style={{ borderRadius: "0 10px 10px 0" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 8).map((item, i) => {
              const pct = item.stok_min > 0 ? Math.round((item.stok / item.stok_min) * 100) : 0;
              const variant = pct <= 25 ? "danger" : pct <= 50 ? "warning" : "info";
              return (
                <tr key={i} className="align-middle">
                  <td className="px-4 py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <div className="fw-semibold text-dark">{item.nama}</div>
                    <small className="text-muted">{item.kode_barang}</small>
                  </td>
                  <td className="py-3 text-center" style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <Badge bg="danger" className="rounded-pill px-3 py-2 fw-bold shadow-sm">{item.stok}</Badge>
                  </td>
                  <td className="py-3 text-center text-muted" style={{ borderBottom: "1px solid #f0f0f0" }}>{item.stok_min}</td>
                  <td className="px-4 py-3" style={{ borderBottom: "1px solid #f0f0f0", minWidth: 150 }}>
                    <div className="d-flex align-items-center gap-2">
                      <ProgressBar now={pct} variant={variant} style={{ height: 8, flexGrow: 1, borderRadius: 4 }} />
                      <small className="text-muted fw-semibold" style={{ width: 35, textAlign: 'right' }}>{pct}%</small>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

// ─── Top Supplier Table ───

function TopSupplierTable({ suppliers = [] }) {
  if (!suppliers.length) {
    return (
      <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
        <Card.Header className="bg-white border-bottom-0 pt-4 px-4" style={{ borderRadius: "16px 16px 0 0" }}>
          <h5 className="fw-bold text-dark mb-0">Supplier Paling Aktif</h5>
          <small className="text-muted">Berdasarkan total transaksi yang disetujui</small>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 200 }}>
          Belum ada data supplier
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-100 border-0 mb-4" style={{ borderRadius: "16px" }}>
      <Card.Header className="bg-white border-bottom-0 pt-4 px-4 pb-3" style={{ borderRadius: "16px 16px 0 0" }}>
        <h5 className="fw-bold text-dark mb-1">Supplier Paling Aktif</h5>
        <small className="text-muted">Berdasarkan total transaksi yang disetujui</small>
      </Card.Header>
      <Card.Body className="p-0 pb-3">
        <Table hover responsive className="mb-0" style={{ borderTop: "1px solid #f0f0f0" }}>
          <thead className="bg-light text-dark">
            <tr>
              <th className="border-0 px-4 py-3" style={{ width: 60, borderRadius: "10px 0 0 10px" }}>#</th>
              <th className="border-0 py-3">Supplier</th>
              <th className="border-0 py-3 text-center">Transaksi</th>
              <th className="border-0 px-4 py-3 text-center" style={{ borderRadius: "0 10px 10px 0" }}>Total Unit</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, i) => (
              <tr key={i} className="align-middle">
                <td className="px-4 py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div className="d-flex align-items-center justify-content-center fw-bold shadow-sm"
                       style={{ 
                         width: 28, height: 28, borderRadius: "50%",
                         backgroundColor: i === 0 ? "#fbbf24" : i === 1 ? "#9ca3af" : i === 2 ? "#d1d5db" : "#f3f4f6",
                         color: i < 3 ? "white" : "#4b5563"
                       }}>
                    {i + 1}
                  </div>
                </td>
                <td className="py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div className="fw-semibold text-dark">{s.nama_supplier}</div>
                  <small className="text-muted">{s.kota || "-"}</small>
                </td>
                <td className="py-3 text-center" style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <Badge bg="primary" className="rounded-pill px-3 py-2 shadow-sm">{s.total_transaksi}</Badge>
                </td>
                <td className="px-4 py-3 text-center fw-bold text-dark" style={{ borderBottom: "1px solid #f0f0f0" }}>
                  {formatNumber(s.total_unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

// ─── Stock Mutation Log ───

function MutationLog({ mutations = [], searchQuery = "" }) {
  const filtered = mutations.filter(m => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!m.kode_transaksi.toLowerCase().includes(q) && 
          !m.barang.toLowerCase().includes(q) && 
          !m.approved_by?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    return (
      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
        <Card.Body className="p-4 text-center text-muted">
          Belum ada mutasi stok yang sesuai dengan filter.
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
      <Card.Header className="bg-white border-bottom-0 pt-4 px-4 pb-3" style={{ borderRadius: "16px 16px 0 0" }}>
        <h5 className="fw-bold text-dark mb-0">Log Mutasi Stok Terbaru</h5>
        <small className="text-muted">Transaksi yang sudah disetujui</small>
      </Card.Header>
      <Card.Body className="p-0 pb-3">
        <Table hover responsive className="mb-0" style={{ borderTop: "1px solid #f0f0f0" }}>
          <thead className="bg-light text-dark">
            <tr>
              <th className="border-0 px-4 py-3" style={{ borderRadius: "10px 0 0 10px" }}>Kode</th>
              <th className="border-0 py-3">Jenis</th>
              <th className="border-0 py-3">Barang</th>
              <th className="border-0 py-3 text-center">Jumlah</th>
              <th className="border-0 py-3">Disetujui Oleh</th>
              <th className="border-0 px-4 py-3" style={{ borderRadius: "0 10px 10px 0" }}>Waktu</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={i} className="align-middle">
                <td className="px-4 py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <span className="fw-semibold" style={{ color: m.jenis === 'masuk' ? '#ec4899' : '#ec4899' }}>{m.kode_transaksi}</span>
                </td>
                <td className="py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                  {m.jenis === "masuk" ? (
                    <Badge bg="white" text="success" border="success" className="border border-success rounded-pill px-3 py-2 fw-normal d-inline-flex align-items-center gap-1 shadow-sm">
                      <FaArrowDown size={10} /> Masuk
                    </Badge>
                  ) : (
                    <Badge bg="white" text="danger" border="danger" className="border border-danger rounded-pill px-3 py-2 fw-normal d-inline-flex align-items-center gap-1 shadow-sm">
                      <FaArrowUp size={10} /> Keluar
                    </Badge>
                  )}
                </td>
                <td className="py-3 fw-semibold text-dark" style={{ borderBottom: "1px solid #f0f0f0" }}>{m.barang}</td>
                <td className="py-3 text-center fw-bold text-dark" style={{ borderBottom: "1px solid #f0f0f0" }}>{formatNumber(m.jumlah)}</td>
                <td className="py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div className="d-flex align-items-center gap-2">
                    <FaUserCircle size={20} className="text-secondary" />
                    <span className="text-dark">{m.approved_by}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted" style={{ borderBottom: "1px solid #f0f0f0" }}>{m.approved_at}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

// ─── Activity Log ───

function ActivityLogSection({ activities = [], searchQuery = "" }) {
  const filtered = activities.filter(a => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.user.toLowerCase().includes(q) && !a.action.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) return null;

  const actionColors = {
    login: "primary",
    create_transaksi: "success",
    approve_transaksi: "info",
    reject_transaksi: "danger",
  };

  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
      <Card.Header className="bg-white border-bottom-0 pt-4 px-4 pb-3" style={{ borderRadius: "16px 16px 0 0" }}>
        <h5 className="fw-bold text-dark mb-0">Aktivitas User Terbaru</h5>
        <small className="text-muted">Log aktivitas staff gudang</small>
      </Card.Header>
      <Card.Body className="p-0 pb-3">
        <Table hover responsive className="mb-0" style={{ borderTop: "1px solid #f0f0f0" }}>
          <thead className="bg-light text-dark">
            <tr>
              <th className="border-0 px-4 py-3" style={{ borderRadius: "10px 0 0 10px" }}>Waktu</th>
              <th className="border-0 py-3">User</th>
              <th className="border-0 py-3">Aksi</th>
              <th className="border-0 px-4 py-3" style={{ borderRadius: "0 10px 10px 0" }}>Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i} className="align-middle">
                <td className="px-4 py-3 text-muted text-nowrap" style={{ borderBottom: "1px solid #f0f0f0" }}>{a.created_at}</td>
                <td className="py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold text-dark">{a.user}</span>
                    {a.role && a.role !== "-" && (
                      <Badge bg="light" text="dark" className="rounded-pill px-2 py-1 fw-normal text-capitalize shadow-sm" style={{ fontSize: "0.75rem" }}>
                        {a.role}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <Badge bg={actionColors[a.action] || "secondary"} className="rounded-pill px-3 py-2 fw-normal shadow-sm text-capitalize">
                    {a.action.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-dark" style={{ borderBottom: "1px solid #f0f0f0" }}>{a.description}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════
// ─── MAIN DASHBOARD COMPONENT ───
// ════════════════════════════════════════════════════════════

export default function Dashboard() {
  const { user, isAdmin, isManajer, isPetugas } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = (isInitial = false) => {
    if (isInitial) setLoading(true);
    const params = {};
    if (logStartDate) params.start_date = logStartDate;
    if (logEndDate) params.end_date = logEndDate;

    DashboardService.getSummary({ params })
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => {
        if (isInitial) setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    if (data !== null) {
      fetchData(false);
    }
    // eslint-disable-next-line
  }, [logStartDate, logEndDate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
          <p className="text-muted mt-3">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Admin / Owner Dashboard ───
  if (isAdmin()) {
    return (
      <div className="dashboard-admin">
        {/* Header */}
        <div className="mb-4">
          <h4 className="fw-bold mb-1 text-dark">Dashboard</h4>
          <p className="text-muted mb-0">
            Selamat datang, <strong>{user?.name}</strong>! Berikut ringkasan gudang Anda.
          </p>
        </div>

        {/* Section 1: Top Stat Cards */}
        <Row>
          <StatCard
            label="Total Stock"
            value={formatNumber(data?.total_stok || 0)}
            subtitle={`${formatNumber(data?.total_barang || 0)} jenis barang`}
            icon={<FaBoxes size={18} />}
            colorHex="#ec4899"
          />
          <StatCard
            label="Asset Value"
            value={formatRupiah(data?.total_nilai_aset || 0)}
            subtitle="Total nilai seluruh inventory"
            icon={<FaMoneyBillWave size={18} />}
            colorHex="#f97316"
          />
          <StatCard
            label="Low Stock Alerts"
            value={data?.low_stock_count || 0}
            subtitle="Barang di bawah stok minimum"
            icon={<FaExclamationTriangle size={18} />}
            colorHex="#3b82f6"
          />
        </Row>

        {/* Section 2: Inventory Flow Chart */}
        <Row className="mb-4">
          <Col xs={12}>
            <InventoryFlowChart data={data?.inventory_flow_monthly} />
          </Col>
        </Row>

        {/* Section 3: Top Products + Stock Distribution */}
        <Row className="mb-4">
          <Col lg={7}>
            <TopProductsChart data={data?.top_moving_products} />
          </Col>
          <Col lg={5}>
            <StockDistributionChart data={data?.stock_by_kategori} />
          </Col>
        </Row>

        {/* Section 4: Supplier + Low Stock */}
        <Row className="mb-4">
          <Col lg={6}>
            <TopSupplierTable suppliers={data?.top_suppliers} />
          </Col>
          <Col lg={6}>
            <LowStockTable items={data?.low_stock_items} />
          </Col>
        </Row>

        {/* Section 5 & 6: Logs with Filters */}
        <div className="d-flex flex-wrap gap-3 mb-3 mt-5 align-items-center bg-white p-3 shadow-sm" style={{ borderRadius: "16px" }}>
           <InputGroup style={{ maxWidth: 200 }}>
              <InputGroup.Text className="bg-light border-0 text-muted"><FaCalendarAlt /></InputGroup.Text>
              <Form.Control type="date" className="bg-light border-0 text-muted" value={logStartDate} onChange={e => setLogStartDate(e.target.value)} />
           </InputGroup>
           <span className="text-muted" style={{ fontSize: "0.8rem" }}>s/d</span>
           <InputGroup style={{ maxWidth: 200 }}>
              <InputGroup.Text className="bg-light border-0 text-muted"><FaCalendarAlt /></InputGroup.Text>
              <Form.Control type="date" className="bg-light border-0 text-muted" value={logEndDate} onChange={e => setLogEndDate(e.target.value)} />
           </InputGroup>
           
           <InputGroup style={{ maxWidth: 300 }} className="ms-auto">
             <InputGroup.Text className="bg-light border-0 text-muted"><FaSearch /></InputGroup.Text>
             <Form.Control 
               className="bg-light border-0"
               placeholder="Cari Log..." 
               value={searchQuery} 
               onChange={e => setSearchQuery(e.target.value)} 
             />
           </InputGroup>
        </div>

        <Row className="mb-4">
          <Col xs={12}>
            <MutationLog mutations={data?.recent_mutations} searchQuery={searchQuery} />
          </Col>
        </Row>

        <Row className="mb-4">
          <Col xs={12}>
            <ActivityLogSection activities={data?.recent_activities} searchQuery={searchQuery} />
          </Col>
        </Row>
      </div>
    );
  }

  // ─── Manajer Dashboard ───
  if (isManajer()) {
    return (
      <div className="dashboard-manajer">
        <div className="mb-4">
          <h4 className="fw-bold mb-1 text-dark">Dashboard</h4>
          <p className="text-muted mb-0">
            Selamat datang, <strong>{user?.name}</strong>!
          </p>
        </div>

        <Row>
          <StatCard
            label="Total Stock"
            value={formatNumber(data?.total_stok || 0)}
            subtitle={`${formatNumber(data?.total_barang || 0)} jenis barang`}
          />
          <StatCard
            label="Asset Value"
            value={formatRupiah(data?.total_nilai_aset || 0)}
            subtitle="Total nilai seluruh inventory"
          />
          <StatCard
            label="Low Stock Alerts"
            value={data?.low_stock_count || 0}
            subtitle="Barang di bawah stok minimum"
          />
        </Row>

        <Row className="mb-4">
          <Col xs={12}>
            <InventoryFlowChart data={data?.inventory_flow_monthly} />
          </Col>
        </Row>

        <Row className="mb-4">
          <Col lg={12}>
            <LowStockTable items={data?.low_stock_items} />
          </Col>
        </Row>

        <div className="d-flex flex-wrap gap-3 mb-3 mt-5 align-items-center bg-white p-3 shadow-sm" style={{ borderRadius: "16px" }}>
           <InputGroup style={{ maxWidth: 200 }}>
              <InputGroup.Text className="bg-light border-0 text-muted"><FaCalendarAlt /></InputGroup.Text>
              <Form.Control type="date" className="bg-light border-0 text-muted" value={logStartDate} onChange={e => setLogStartDate(e.target.value)} />
           </InputGroup>
           <span className="text-muted" style={{ fontSize: "0.8rem" }}>s/d</span>
           <InputGroup style={{ maxWidth: 200 }}>
              <InputGroup.Text className="bg-light border-0 text-muted"><FaCalendarAlt /></InputGroup.Text>
              <Form.Control type="date" className="bg-light border-0 text-muted" value={logEndDate} onChange={e => setLogEndDate(e.target.value)} />
           </InputGroup>
           
           <InputGroup style={{ maxWidth: 300 }} className="ms-auto">
             <InputGroup.Text className="bg-light border-0 text-muted"><FaSearch /></InputGroup.Text>
             <Form.Control 
               className="bg-light border-0"
               placeholder="Cari Log..." 
               value={searchQuery} 
               onChange={e => setSearchQuery(e.target.value)} 
             />
           </InputGroup>
        </div>

        <Row className="mb-4">
          <Col xs={12}>
            <MutationLog mutations={data?.recent_mutations} searchQuery={searchQuery} />
          </Col>
        </Row>
      </div>
    );
  }

  // ─── Petugas Dashboard ───
  if (isPetugas()) {
    return (
      <div className="dashboard-petugas">
        <div className="mb-4">
          <h4 className="fw-bold mb-1 text-dark">Dashboard</h4>
          <p className="text-muted mb-0">
            Selamat datang, <strong>{user?.name}</strong>!
          </p>
        </div>

        <Row>
          <StatCard
            label="Total Barang"
            value={formatNumber(data?.total_barang || 0)}
            subtitle="Jumlah jenis barang terdaftar"
            icon={<FaBoxes size={18} />}
            colorHex="#ec4899"
          />
          <StatCard
            label="Masuk Hari Ini"
            value={data?.transaksi_masuk_hari_ini || 0}
            subtitle="Transaksi masuk"
            icon={<FaArrowDown size={18} />}
            colorHex="#14b8a6"
          />
          <StatCard
            label="Keluar Hari Ini"
            value={data?.transaksi_keluar_hari_ini || 0}
            subtitle="Transaksi keluar"
            icon={<FaArrowUp size={18} />}
            colorHex="#f97316"
          />
        </Row>
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-center py-5">
      <h5>Selamat datang, {user?.name}!</h5>
      <p className="text-muted">Dashboard sedang dimuat...</p>
    </div>
  );
}
