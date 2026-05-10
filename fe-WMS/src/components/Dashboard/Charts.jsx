import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#3b82f6", "#14b8a6", "#64748b", "#cbd5e1", "#8b5cf6",
  "#06b6d4", "#0ea5e9", "#f43f5e", "#f59e0b", "#10b981",
];

/**
 * Grafik Arus Barang Bulanan (Bar Chart)
 * data: [{ name: "Jan 2026", masuk: 100, keluar: 50 }, ...]
 */
export function InventoryFlowChart({ data = [] }) {
  if (!data.length) {
    return (
      <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
        <Card.Header className="bg-white border-bottom-0 pt-4 px-4" style={{ borderRadius: "16px 16px 0 0" }}>
          <h5 className="fw-bold text-dark mb-0">Arus Barang (6 Bulan Terakhir)</h5>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 300 }}>
          Belum ada data transaksi
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
      <Card.Header className="bg-white border-bottom-0 pt-4 px-4" style={{ borderRadius: "16px 16px 0 0" }}>
        <h5 className="fw-bold text-dark mb-0">Arus Barang (6 Bulan Terakhir)</h5>
      </Card.Header>
      <Card.Body>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Legend wrapperStyle={{ color: "#64748b" }} />
            <Bar dataKey="keluar" fill="#3b82f6" name="Barang Keluar" />
            <Bar dataKey="masuk" fill="#14b8a6" name="Barang Masuk" />
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}

/**
 * Distribusi Stok per Kategori (Pie Chart)
 * data: [{ name: "Elektronik", value: 35 }, ...]
 */
export function StockDistributionChart({ data = [] }) {
  if (!data.length) {
    return (
      <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
        <Card.Header className="bg-white border-bottom-0 pt-4 px-4" style={{ borderRadius: "16px 16px 0 0" }}>
          <h5 className="fw-bold text-dark mb-0">Distribusi Stok per Kategori</h5>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 300 }}>
          Belum ada data kategori
        </Card.Body>
      </Card>
    );
  }

  const renderLabel = ({ name, percent }) => {
    if (percent < 0.05) return null;
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
      <Card.Header className="bg-white border-bottom-0 pt-4 px-4" style={{ borderRadius: "16px 16px 0 0" }}>
        <h5 className="fw-bold text-dark mb-0">Distribusi Stok per Kategori</h5>
      </Card.Header>
      <Card.Body>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}

/**
 * Top Moving Products (Horizontal Bar Chart)
 * data: [{ name: "Laptop Dell", total_keluar: 45 }, ...]
 */
export function TopProductsChart({ data = [] }) {
  if (!data.length) {
    return (
      <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
        <Card.Header className="bg-white border-bottom-0 pt-4 px-4" style={{ borderRadius: "16px 16px 0 0" }}>
          <h5 className="fw-bold text-dark mb-0">Barang Paling Laris (Outbound)</h5>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 300 }}>
          Belum ada data transaksi keluar
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-100 border-0" style={{ borderRadius: "16px" }}>
      <Card.Header className="bg-white border-bottom-0 pt-4 px-4" style={{ borderRadius: "16px 16px 0 0" }}>
        <h5 className="fw-bold text-dark mb-0">Barang Paling Laris (Outbound)</h5>
      </Card.Header>
      <Card.Body>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Bar dataKey="total_keluar" fill="#3b82f6" name="Total Keluar" />
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
