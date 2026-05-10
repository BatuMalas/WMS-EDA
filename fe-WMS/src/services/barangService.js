import api from "./api";

const BarangService = {
  // Get all barang
  getAll: () => api.get("/barang"),

  // Get single barang
  getById: (id) => api.get(`/barang/${id}`),

  // Create baru
  create: (data) => api.post("/barang", data),

  // Update
  update: (id, data) => api.put(`/barang/${id}`, data),

  // Delete
  delete: (id) => api.delete(`/barang/${id}`),

  // Tambah stok (creates a new batch)
  tambahStok: (id, data) => api.post(`/barang/${id}/stok/tambah`, data),

  // Kurangi stok (FIFO)
  kurangiStok: (id, data) => api.post(`/barang/${id}/stok/kurangi`, data),

  // Get stock batches for a barang
  getStockBatches: (id) => api.get(`/barang/${id}/batches`),

  // Get aging stock (batches past threshold)
  getAgingStock: () => api.get("/barang/aging"),

  // Search
  search: (keyword) => api.get(`/barang/search?q=${keyword}`),

  // Get gudang yang punya stok untuk barang tertentu
  getGudang: (id) => api.get(`/barang/${id}/gudang`),
};

export default BarangService;
