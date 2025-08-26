// src/context/AuthContext.js
import React, { createContext, useState, useCallback } from "react";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(sessionStorage.getItem("refresh_token") || "");
  const [me, setMe] = useState(() => JSON.parse(localStorage.getItem("me")));

  const saveToken = (t) => {
    setToken(t);
    localStorage.setItem("token", t);
  };

  const saveRefreshToken = (t) => {
    setRefreshToken(t);
    sessionStorage.setItem("refresh_token", t);
  };

  const saveMe = (user) => {
    setMe(user);
    localStorage.setItem("me", JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setMe(null);
    localStorage.removeItem("token");
    localStorage.removeItem("me");
  };
  // <-- Add this function
  const fetchMe = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${USER_API}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setMe(data);
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [token]);

  const signOut = () => {
    setToken("");
    setRefreshToken("");
    setMe(null);
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ token, me, saveToken, saveMe, logout, fetchMe, saveRefreshToken, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
