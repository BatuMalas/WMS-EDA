import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Badge,
  Button,
  ListGroup,
  Dropdown,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaEnvelope,
  FaExclamationTriangle,
  FaClock,
  FaCalendarTimes,
  FaBoxOpen,
} from "react-icons/fa";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    // Persist read state in localStorage
    const stored = localStorage.getItem("wms_read_notifications");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const [dashboardRes, agingRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/barang/aging"),
      ]);

      const data = dashboardRes.data.data;
      const agingItems = agingRes.data.data || [];
      const generatedNotifs = [];

      // Generate notifications from aging stock
      agingItems.forEach((item, idx) => {
        const id = `aging-${item.batch_id}`;
        generatedNotifs.push({
          id,
          title: "⏰ Stok Terlalu Lama di Gudang",
          message: `Batch ${item.kode_batch} — "${item.nama_barang}" sudah ${formatUmur(item.umur_hari)} di gudang (batas: ${formatUmur(item.batas_aging_hari)}). Sisa stok: ${item.sisa_stok} unit. Segera keluarkan!`,
          type: item.umur_hari >= item.batas_aging_hari * 1.5 ? "danger" : "warning",
          time: `Masuk: ${new Date(item.tanggal_masuk).toLocaleDateString("id-ID")}`,
          category: "aging",
          read: readIds.includes(id),
        });
      });

      // Generate notifications from expiring soon
      const expiringSoon = data?.expiring_soon || [];
      expiringSoon.forEach((item) => {
        const id = `expiring-${item.kode_batch}`;
        generatedNotifs.push({
          id,
          title: "🚨 Akan Kadaluarsa",
          message: `Batch ${item.kode_batch} — "${item.nama_barang}" akan kadaluarsa pada ${new Date(item.tanggal_kadaluarsa).toLocaleDateString("id-ID")} (${item.sisa_hari} hari lagi). Sisa stok: ${item.sisa_stok} unit.`,
          type: "danger",
          time: `Kadaluarsa: ${new Date(item.tanggal_kadaluarsa).toLocaleDateString("id-ID")}`,
          category: "expiring",
          read: readIds.includes(id),
        });
      });

      // Generate notifications from low stock
      const lowStock = data?.barang_low_stock || [];
      lowStock.forEach((item) => {
        const id = `lowstock-${item.id}`;
        generatedNotifs.push({
          id,
          title: "📦 Stok Rendah",
          message: `"${item.nama}" (${item.kode_barang}) stok tersisa ${item.stok} unit. Lokasi: ${item.lokasi || "-"}`,
          type: "warning",
          time: "Saat ini",
          category: "lowstock",
          read: readIds.includes(id),
        });
      });

      setNotifications(generatedNotifs);
      setLoading(false);
    } catch (error) {
      toast.error("Gagal memuat notifikasi");
      setLoading(false);
    }
  };

  const formatUmur = (hari) => {
    if (hari >= 365) return `${Math.floor(hari / 365)} tahun ${Math.floor((hari % 365) / 30)} bulan`;
    if (hari >= 30) return `${Math.floor(hari / 30)} bulan ${hari % 30} hari`;
    return `${hari} hari`;
  };

  const markAsRead = (id) => {
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    localStorage.setItem("wms_read_notifications", JSON.stringify(newReadIds));
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const dismissNotification = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("wms_read_notifications", JSON.stringify(allIds));
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (category) => {
    switch (category) {
      case "aging": return <FaClock className="text-warning" />;
      case "expiring": return <FaCalendarTimes className="text-danger" />;
      case "lowstock": return <FaBoxOpen className="text-info" />;
      default: return <FaBell className="text-primary" />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case "aging": return <Badge bg="warning" text="dark">Aging</Badge>;
      case "expiring": return <Badge bg="danger">Kadaluarsa</Badge>;
      case "lowstock": return <Badge bg="info">Low Stock</Badge>;
      default: return <Badge bg="secondary">Info</Badge>;
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Memuat notifikasi...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold">
            <FaBell className="me-2" />
            Notifikasi
            {unreadCount > 0 && (
              <Badge bg="danger" className="ms-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted">Peringatan stok aging, kadaluarsa, dan stok rendah — diambil secara real-time dari data gudang</p>
        </div>
        <div>
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={fetchNotifications}
          >
            🔄 Refresh
          </Button>
          <Button
            variant="outline-secondary"
            className="me-2"
            onClick={markAllAsRead}
          >
            <FaCheck className="me-1" /> Tandai Semua Dibaca
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {notifications.length > 0 && (
        <div className="d-flex gap-3 mb-4 flex-wrap">
          <Card className="border-0 shadow-sm flex-fill" style={{ minWidth: "180px" }}>
            <Card.Body className="text-center py-3">
              <FaClock className="text-warning mb-1" size={20} />
              <h4 className="mb-0">{notifications.filter(n => n.category === "aging").length}</h4>
              <small className="text-muted">Stok Aging</small>
            </Card.Body>
          </Card>
          <Card className="border-0 shadow-sm flex-fill" style={{ minWidth: "180px" }}>
            <Card.Body className="text-center py-3">
              <FaCalendarTimes className="text-danger mb-1" size={20} />
              <h4 className="mb-0">{notifications.filter(n => n.category === "expiring").length}</h4>
              <small className="text-muted">Akan Kadaluarsa</small>
            </Card.Body>
          </Card>
          <Card className="border-0 shadow-sm flex-fill" style={{ minWidth: "180px" }}>
            <Card.Body className="text-center py-3">
              <FaBoxOpen className="text-info mb-1" size={20} />
              <h4 className="mb-0">{notifications.filter(n => n.category === "lowstock").length}</h4>
              <small className="text-muted">Stok Rendah</small>
            </Card.Body>
          </Card>
        </div>
      )}

      <Card className="border-0 shadow">
        <Card.Body className="p-0">
          <ListGroup variant="flush">
            {notifications.length === 0 ? (
              <ListGroup.Item className="text-center py-5">
                <FaEnvelope size={48} className="text-muted mb-3" />
                <h5>Tidak ada notifikasi</h5>
                <p className="text-muted">Semua stok dalam kondisi baik! 🎉</p>
              </ListGroup.Item>
            ) : (
              notifications.map((notification) => (
                <ListGroup.Item
                  key={notification.id}
                  className={`py-3 border-bottom ${
                    !notification.read ? "bg-light" : ""
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex">
                      <div
                        className={`rounded-circle p-2 me-3 bg-${notification.type} bg-opacity-10 d-flex align-items-center justify-content-center`}
                        style={{ width: "40px", height: "40px", flexShrink: 0 }}
                      >
                        {getIcon(notification.category)}
                      </div>
                      <div>
                        <div className="d-flex align-items-center mb-1 flex-wrap gap-1">
                          <h6 className="mb-0">{notification.title}</h6>
                          {getCategoryLabel(notification.category)}
                          {!notification.read && (
                            <Badge bg="primary">Baru</Badge>
                          )}
                        </div>
                        <p className="mb-1" style={{ fontSize: "0.9rem" }}>{notification.message}</p>
                        <small className="text-muted">
                          {notification.time}
                        </small>
                      </div>
                    </div>
                    <Dropdown>
                      <Dropdown.Toggle variant="link" className="text-dark p-0">
                        ⋮
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {!notification.read && (
                          <Dropdown.Item
                            onClick={() => markAsRead(notification.id)}
                          >
                            <FaCheck className="me-2" /> Tandai Dibaca
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item
                          onClick={() => dismissNotification(notification.id)}
                        >
                          <FaTrash className="me-2" /> Sembunyikan
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Notification Settings */}
      <Card className="border-0 shadow mt-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Pengaturan Notifikasi</h5>
        </Card.Header>
        <Card.Body>
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="stockNotif"
              defaultChecked
            />
            <label className="form-check-label" htmlFor="stockNotif">
              Peringatan stok rendah
            </label>
          </div>
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="agingNotif"
              defaultChecked
            />
            <label className="form-check-label" htmlFor="agingNotif">
              Peringatan stok aging (terlalu lama di gudang)
            </label>
          </div>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="expiryNotif"
              defaultChecked
            />
            <label className="form-check-label" htmlFor="expiryNotif">
              Peringatan barang akan kadaluarsa
            </label>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
