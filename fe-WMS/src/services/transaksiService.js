import api from "./api";

const TransaksiService = {
  // Get all transaksi (with optional filters: jenis, status, limit)
  getAll: (params = {}) => api.get("/transaksi", { params }),

  // Get single transaksi
  getById: (id) => api.get(`/transaksi/${id}`),

  // Create baru — uses FormData for file upload
  create: (formData) => {
    return api.post("/transaksi", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Update
  update: (id, data) => api.put(`/transaksi/${id}`, data),

  // Delete
  delete: (id) => api.delete(`/transaksi/${id}`),

  // Approve transaksi (manajer)
  approve: (id) => api.put(`/transaksi/${id}/approve`),

  // Reject transaksi (manajer)
  reject: (id) => api.put(`/transaksi/${id}/reject`),

  // Transaksi masuk hari ini
  masukHariIni: () => api.get("/transaksi/hari-ini/masuk"),

  // Transaksi keluar hari ini
  keluarHariIni: () => api.get("/transaksi/hari-ini/keluar"),

  // Laporan per periode
  laporan: (periode) => api.get(`/transaksi/laporan/${periode}`),

  // Stok barang summary
  stokBarang: () => api.get("/transaksi/stok-barang"),

  // Download invoice
  downloadInvoice: (id) => {
    return api.get(`/transaksi/${id}/invoice/download`, {
      responseType: "blob",
    });
  },

  // Get invoice view URL
  getInvoiceViewUrl: (id) => {
    const token = localStorage.getItem("token");
    return `${api.defaults.baseURL}/transaksi/${id}/invoice/view?token=${token}`;
  },
};

export default TransaksiService;
