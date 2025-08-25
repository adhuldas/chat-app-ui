import React, { useContext, useEffect, useState, useMemo, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:9002";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { token, me, fetchMe, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize socket
  const socket = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL, { auth: { token } });
  }, [token]);

  // Fetch user details
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

  // Fetch profile image
  useEffect(() => {
    const fetchImage = async () => {
      if (!me?.files_id || !token) return;
      try {
        const res = await fetch(`${me.files_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch image");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error(err);
        setImageUrl(null);
      }
    };
    fetchImage();
  }, [me, token]);

  // Handle profile picture change
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await fetch(`${USER_API}/user/update/profile/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      // Refresh profile image
      const newUrl = URL.createObjectURL(file);
      setImageUrl(newUrl);
      alert("Profile picture updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile picture");
    }
  };

  // Logout handler
  const handleLogout = () => {
    if (socket) socket.disconnect();
    logout();
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f6" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, position: "relative" }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#ddd",
                backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                background: "#111",
                color: "#fff",
                borderRadius: "50%",
                border: "none",
                width: 20,
                height: 20,
                fontSize: 14,
                cursor: "pointer",
              }}
              title="Edit"
            >
              ✎
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>
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
            <div style={{ marginBottom: 8 }}><b>Full Name:</b> {me?.firstname + " " + me?.lastname || "-"}</div>
            <div style={{ marginBottom: 8 }}><b>User ID:</b> {me?.user_id || me?._id || "-"}</div>
            <div style={{ marginBottom: 8 }}><b>Phone Number:</b> {me?.country_code + " " + me?.phone_number || "-"}</div>
            <div style={{ marginBottom: 8 }}><b>Timezone:</b> {me?.timezone || "-"}</div>
            <button
              onClick={handleLogout}
              style={{
                marginTop: 12,
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid #111",
                background: "#111",
                color: "#fff",
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
