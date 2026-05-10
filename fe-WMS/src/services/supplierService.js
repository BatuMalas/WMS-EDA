import api from "./api";

const SupplierService = {
  // Get all supplier
  getAll: () => api.get("/supplier"),

  // Get single supplier
  getById: (id) => api.get(`/supplier/${id}`),

  // Create baru
  create: (data) => api.post("/supplier", data),

  // Update
  update: (id, data) => api.put(`/supplier/${id}`, data),

  // Delete
  delete: (id) => api.delete(`/supplier/${id}`),
};

export default SupplierService;
