import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Use environment-configured API base in dev; default to relative path in prod
const API_BASE = import.meta.env.VITE_API_URL || "";
const API_URL = `${API_BASE}/api/v1`;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authenticated, setAuthenticated] = useState(!!localStorage.getItem("token"));
  const [user, setUser] = useState(null);


  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/user`);
        setUser(res.data);
        setAuthenticated(true);
      } catch (err) {
        logout();
      }
    };

    fetchUser();
  }, [token]);


  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      const receivedToken = res.data.accessToken;

      setToken(receivedToken);
      localStorage.setItem("token", receivedToken);
      setAuthenticated(true);

      return true;
    } catch (err) {
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setAuthenticated(false);
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ authenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};