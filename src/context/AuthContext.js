// src/context/AuthContext.js
import React, { createContext, useState } from "react";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [me, setMe] = useState(() => JSON.parse(localStorage.getItem("me")));

  const saveToken = (t) => {
    setToken(t);
    localStorage.setItem("token", t);
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

  return (
    <AuthContext.Provider value={{ token, saveToken, me, saveMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
