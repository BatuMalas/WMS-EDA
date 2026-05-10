import api from "./api";

const DashboardService = {
    // Get dashboard data
    getSummary: (config = {}) => api.get("/dashboard", config),
};

export default DashboardService;
