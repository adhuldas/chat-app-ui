import React, { useContext, useEffect, useState,useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:9002";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { token, me, fetchMe, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  // Initialize socket
  const socket = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL, { auth: { token } });
  }, [token]);
  useEffect(() => {
    let mounted = true;
    if (!me) {
      setLoading(true);
      fetchMe().finally(() => {
        if (mounted) setLoading(false);
      });
    }
    return () => { mounted = false };
  }, [fetchMe]);

  // Logout handler
  const handleLogout = () => {
    if (socket) socket.disconnect();
    logout();
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f6" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ddd" }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 18 }}>Profile</div>
            <div style={{ color: "#666" }}>Update how others see you</div>
          </div>
        </div>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 4px 18px rgba(0,0,0,0.05)" }}>
            <div style={{ marginBottom: 8 }}><b>Username:</b> {me?.username}</div>
            <div style={{ marginBottom: 8 }}><b>Full Name:</b> {me?.firstname+" "+me?.lastname || "-"}</div>
            <div style={{ marginBottom: 8 }}><b>User ID:</b> {me?.user_id || me?._id || "-"}</div>
            <div style={{ marginBottom: 8 }}><b>Phone Number:</b> {me?.country_code+" "+me?.phone_number}</div>
            <div style={{ marginBottom: 8 }}><b>Timezone:</b> {me?.timezone ||"-"}</div>
            <button onClick={handleLogout} style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff" }}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
