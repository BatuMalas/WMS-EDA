import React from "react";
import { Card } from "react-bootstrap";
import { FaCog } from "react-icons/fa";

export default function SettingsPage() {
  return (
    <>
      <h3 className="mb-4"><FaCog className="me-2" />Pengaturan</h3>
      <Card className="shadow-sm border-0" style={{ borderRadius: "16px" }}>
        <Card.Body className="text-center py-5">
          <FaCog size={64} className="text-muted mb-3" />
          <h4 className="text-muted">Halaman Pengaturan</h4>
          <p className="text-muted">Fitur pengaturan sedang dalam pengembangan.</p>
        </Card.Body>
      </Card>
    </>
  );
}
