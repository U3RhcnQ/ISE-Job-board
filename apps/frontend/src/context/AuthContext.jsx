// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const AuthContext = createContext(undefined);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Start true to check initial auth
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchUserProfile = async (currentToken) => {
        if (!currentToken) {
            setUser(null);
            setIsLoading(false); // Done loading if no token
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                headers: { 'Authorization': `Bearer ${currentToken}` },
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Session expired or invalid. Please login again.');
                }
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}`}));
                throw new Error(errorData.message || `Failed to fetch user profile`);
            }
            const userData = await response.json();
            console.log(userData);
            setUser(userData); // Expects { id, name, email, company, role (or accessLevel) }
        } catch (err) {
            console.error("Fetch user profile error:", err);
            setError(err.message);
            setToken(null); // Clear invalid token
            setUser(null);
            localStorage.removeItem('authToken');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const currentToken = localStorage.getItem('authToken');
        if (currentToken) {
            setToken(currentToken);
            fetchUserProfile(currentToken);
        } else {
            setUser(null);
            setIsLoading(false); // No token, not loading
        }
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            // Replace '/api/auth/login' with your actual login endpoint
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed. Please check your credentials.');
            }

            const receivedToken = data.token; // Assuming response is { "token": "your_token_string" }
            if (!receivedToken) {
                throw new Error('Token not found in login response.');
            }
            localStorage.setItem('authToken', receivedToken);
            setToken(receivedToken);
            await fetchUserProfile(receivedToken);
            navigate('/jobs');
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message);
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setError(null);
        navigate('/login');
    };

    const value = {
        token,
        user,
        isLoading,
        error,
        login,
        logout,
        isAuthenticated: !!user, // Simpler check: if user object exists, they are authenticated
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};