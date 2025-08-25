import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";

export default function ProfilePage() {
  const { token, me, fetchMe, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!me) setLoading(true);
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe, me]);

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
            <div style={{ marginBottom: 8 }}><b>Display name:</b> {me?.display_name || "-"}</div>
            <div style={{ marginBottom: 8 }}><b>User ID:</b> {me?.id || me?._id || "-"}</div>
            <button onClick={logout} style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff" }}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
