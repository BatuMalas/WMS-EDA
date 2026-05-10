import api from "./api";

const KategoriService = {
  // Get all kategori
  getAll: () => api.get("/kategori"),

  // Get single kategori
  getById: (id) => api.get(`/kategori/${id}`),

  // Create
  create: (data) => api.post("/kategori", data),

  // Update
  update: (id, data) => api.put(`/kategori/${id}`, data),

  // Delete
  delete: (id) => api.delete(`/kategori/${id}`),
};

export default KategoriService;
