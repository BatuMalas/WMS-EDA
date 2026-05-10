import React, { createContext, useContext, useState, useEffect } from "react";
import AuthService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    // On mount, check if token exists and fetch user
    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await AuthService.getProfile();
            setUser(response.data.data);
        } catch (error) {
            // Token invalid/expired
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const response = await AuthService.login(username, password);
        const data = response.data.data;

        localStorage.setItem("token", data.access_token);
        setToken(data.access_token);
        setUser(data.user);

        return data;
    };

    const logout = () => {
        // Call logout API if token exists
        if (token) {
            AuthService.logout().catch(() => { });
        }

        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    const isAdmin = () => user?.role === "admin";
    const isManajer = () => user?.role === "manajer";
    const isPetugas = () => user?.role === "petugas";
    const isAuthenticated = () => !!token && !!user;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                logout,
                updateUser,
                isAdmin,
                isManajer,
                isPetugas,
                isAuthenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthContext;
