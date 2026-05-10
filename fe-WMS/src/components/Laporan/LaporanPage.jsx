import React from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { FaChartBar, FaFileExcel, FaFilePdf, FaPrint } from "react-icons/fa";
import {
  exportToExcel,
  exportToPDF,
  formatBarangForExport,
} from "./utils/exportUtils";
import api from "../../services/api";

const handleExportExcel = async () => {
  try {
    const response = await api.get("/barang");
    const data = formatBarangForExport(response.data.data);
    exportToExcel(data, "laporan_stok_barang");
  } catch (error) {
    console.error("Export error:", error);
  }
};

const handleExportPDF = async () => {
  try {
    const response = await api.get("/barang");
    const data = response.data.data.map((item) => [
      item.kode_barang,
      item.nama,
      item.stok,
      item.lokasi,
      item.stok < 5 ? "Rendah" : "Aman",
    ]);

    exportToPDF(
      "Laporan Stok Barang",
      ["Kode", "Nama", "Stok", "Lokasi", "Status"],
      data,
      "laporan_stok_barang"
    );
  } catch (error) {
    console.error("Export error:", error);
  }
};

export default function LaporanPage() {
  return (
    <Container fluid className="py-4">
      <h1 className="fw-bold mb-4">
        <FaChartBar className="me-2" />
        Laporan Gudang
      </h1>

      <Row className="mb-4">
        <Col lg={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: "16px" }}>
            <Card.Body className="text-center">
              <h5>📊 Laporan Stok</h5>
              <p>Laporan kondisi stok barang</p>
              <Button
                variant="outline-primary"
                className="w-100 rounded-pill"
                onClick={handleExportExcel}
              >
                <FaFileExcel className="me-2" /> Export Excel
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: "16px" }}>
            <Card.Body className="text-center">
              <h5>📈 Laporan Transaksi</h5>
              <p>Laporan transaksi harian/bulanan</p>
              <Button
                variant="outline-success"
                className="w-100 rounded-pill"
                onClick={handleExportPDF}
              >
                <FaFilePdf className="me-2" /> Export PDF
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: "16px" }}>
            <Card.Body className="text-center">
              <h5>📋 Laporan Supplier</h5>
              <p>Laporan performa supplier</p>
              <Button variant="outline-warning" className="w-100 rounded-pill">
                <FaPrint className="me-2" /> Cetak Laporan
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm" style={{ borderRadius: "16px" }}>
        <Card.Header className="bg-white border-0 pt-4 pb-0">
          <h5 className="mb-0 fw-bold">Generate Custom Report</h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Jenis Laporan</Form.Label>
                  <Form.Select>
                    <option>Laporan Stok</option>
                    <option>Laporan Transaksi</option>
                    <option>Laporan Supplier</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Periode Awal</Form.Label>
                  <Form.Control type="date" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Periode Akhir</Form.Label>
                  <Form.Control type="date" />
                </Form.Group>
              </Col>
            </Row>
            <div className="text-center">
              <Button variant="primary" className="me-2 rounded-pill px-4 shadow-sm">
                Generate Report
              </Button>
              <Button variant="secondary" className="rounded-pill px-4">Reset</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
