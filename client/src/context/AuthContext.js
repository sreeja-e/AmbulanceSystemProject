import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("uas_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("uas_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    setAuthToken(token || "");
    if (token) connectSocket(token);
    else disconnectSocket();
  }, [token]);

  const login = ({ token: t, user: u }) => {
    // Ensure Authorization header is available immediately for any effects
    // that fire right after login (prevents 401 race).
    setAuthToken(t || "");
    setToken(t);
    setUser(u);
    localStorage.setItem("uas_token", t);
    localStorage.setItem("uas_user", JSON.stringify(u));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("uas_token");
    localStorage.removeItem("uas_user");
    setAuthToken("");
    disconnectSocket();
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    login(data);
    return data;
  };

  const signIn = async (payload, admin = false) => {
    const url = admin ? "/admin/login" : "/auth/login";
    const { data } = await api.post(url, payload);
    login(data);
    return data;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      register,
      signIn,
      logout,
      isAuthenticated: Boolean(token && user),
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

