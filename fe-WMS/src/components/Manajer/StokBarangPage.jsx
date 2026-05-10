import React, { useState, useEffect } from "react";
import { Card, Table, InputGroup, Form, Badge, Spinner, Modal, Button, Container, Row, Col } from "react-bootstrap";
import { FaSearch, FaInfoCircle, FaBox } from "react-icons/fa";
import { toast } from "react-toastify";
import BarangService from "../../services/barangService";

export default function StokBarangPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await BarangService.getAll();
      setData(res.data.data || []);
    } catch { toast.error("Gagal memuat data barang"); }
    finally { setLoading(false); }
  };

  const filtered = data.filter(d =>
    (d.nama || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.kode_barang || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatRupiah = (value) => {
    if (!value || value == 0) return "-";
    return `Rp ${Number(value).toLocaleString("id-ID")}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="fw-bold">
            <FaBox className="me-2" />
            Stok Barang
          </h1>
          <p className="text-muted">Lihat detail data dan stok barang di gudang.</p>
        </Col>
      </Row>

      {/* Filter & Search */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari Barang berdasarkan nama atau kode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4} className="d-flex align-items-center justify-content-end">
               <span className="text-muted">Total: {filtered.length} barang</span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow">
        <Card.Body>
          <div style={{ overflowX: "auto" }}>
            <Table hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Satuan</th>
                  <th>Kategori</th>
                  <th>Gudang-Rak</th>
                  <th>Harga Beli</th>
                  <th>Harga Jual</th>
                  <th>Kadaluarsa</th>
                  <th>Stok Min</th>
                  <th>Deskripsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id}>
                    <td>{i + 1}</td>
                    <td><Badge bg="secondary" pill className="px-3 py-2 fw-normal">{d.kode_barang}</Badge></td>
                    <td>
                      <div>
                        <strong>{d.nama}</strong>
                      </div>
                    </td>
                    <td>{d.satuan || "-"}</td>
                    <td>{d.kategori?.nama || "-"}</td>
                    <td>{d.gudang_rak || "-"}</td>
                    <td>{formatRupiah(d.harga_beli)}</td>
                    <td>{formatRupiah(d.harga_jual)}</td>
                    <td>{formatDate(d.kadaluarsa)}</td>
                    <td>
                      {d.stok_min != null ? (
                        <Badge bg={d.stok <= d.stok_min ? "danger" : "success"} pill className="px-3 py-2 fw-normal">
                          {d.stok_min}
                        </Badge>
                      ) : "-"}
                    </td>
                    <td>
                      <span style={{ maxWidth: 200, display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.deskripsi || "-"}
                      </span>
                    </td>
                    <td>
                      <Button size="sm" variant="outline-info" onClick={() => { setSelected(d); setShowInfo(true); }}>
                        <FaInfoCircle />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={12} className="text-center text-muted">Tidak ada data</td></tr>}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showInfo} onHide={() => setShowInfo(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Detail Barang</Modal.Title></Modal.Header>
        <Modal.Body>
          {selected && (
            <div className="row">
              <div className="col-md-6">
                <p><strong>Kode Barang:</strong> {selected.kode_barang}</p>
                <p><strong>Nama:</strong> {selected.nama}</p>
                <p><strong>Satuan:</strong> {selected.satuan || "-"}</p>
                <p><strong>Kategori:</strong> {selected.kategori?.nama || "-"}</p>
                <p><strong>Gudang-Rak:</strong> {selected.gudang_rak || "-"}</p>
                <p><strong>Lokasi:</strong> {selected.lokasi || "-"}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Harga Beli:</strong> {formatRupiah(selected.harga_beli)}</p>
                <p><strong>Harga Jual:</strong> {formatRupiah(selected.harga_jual)}</p>
                <p><strong>Kadaluarsa:</strong> {formatDate(selected.kadaluarsa)}</p>
                <p><strong>Stok Saat Ini:</strong> <Badge bg={selected.stok > 0 ? "primary" : "dark"}>{selected.stok}</Badge></p>
                <p><strong>Stok Minimum:</strong> {selected.stok_min ?? "-"}</p>
                <p><strong>Batas Aging:</strong> {selected.batas_aging_hari || 180} hari</p>
              </div>
              <div className="col-12 mt-2">
                <p><strong>Deskripsi:</strong></p>
                <p className="text-muted">{selected.deskripsi || "Tidak ada deskripsi"}</p>
                <p><strong>Keterangan:</strong></p>
                <p className="text-muted">{selected.keterangan || "Tidak ada keterangan"}</p>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
