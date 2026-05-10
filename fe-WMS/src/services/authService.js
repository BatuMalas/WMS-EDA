import api from "./api";

const AuthService = {
    // Login
    login: (username, password) => api.post("/auth/login", { username, password }),

    // Logout
    logout: () => api.post("/auth/logout"),

    // Refresh token
    refresh: () => api.post("/auth/refresh"),

    // Get current user profile
    getProfile: () => api.get("/auth/me"),

    // Update profile
    updateProfile: (data) => api.put("/auth/profile", data),

    // Change password
    changePassword: (data) => api.put("/auth/change-password", data),

    // ──── User Management (Admin only) ────

    // Get all users
    getUsers: () => api.get("/users"),

    // Create user
    createUser: (data) => api.post("/users", data),

    // Update user
    updateUser: (id, data) => api.put(`/users/${id}`, data),

    // Delete user
    deleteUser: (id) => api.delete(`/users/${id}`),

    // Reset user password
    resetPassword: (id, newPassword) =>
        api.put(`/users/${id}/reset-password`, { new_password: newPassword }),
};

export default AuthService;
