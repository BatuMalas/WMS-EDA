import api from "./api";

const CustomerService = {
  // Get all customers
  getAll: () => api.get("/customer"),

  // Get single customer
  getById: (id) => api.get(`/customer/${id}`),

  // Create
  create: (data) => api.post("/customer", data),

  // Update
  update: (id, data) => api.put(`/customer/${id}`, data),

  // Delete
  delete: (id) => api.delete(`/customer/${id}`),
};

export default CustomerService;
