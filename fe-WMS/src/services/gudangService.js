import api from "./api";

const GudangService = {
  // Get all gudang
  getAll: () => api.get("/gudang"),

  // Get single gudang
  getById: (id) => api.get(`/gudang/${id}`),

  // Create
  create: (data) => api.post("/gudang", data),

  // Update
  update: (id, data) => api.put(`/gudang/${id}`, data),

  // Delete
  delete: (id) => api.delete(`/gudang/${id}`),
};

export default GudangService;
