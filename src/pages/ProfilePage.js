// src/pages/ProfilePage.js
import React, { useContext, useEffect, useState, useMemo, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { decryptPayload } from "../utils/encryption";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:9002";
const DEFAULT_AVATAR = "/images/default.webp"; // Add a default image in your public folder

export default function ProfilePage() {
  const navigate = useNavigate();
  const { token, me, fetchMe, logout, saveMe } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  // Socket
  const socket = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL, { auth: { token } });
  }, [token]);

  // Fetch user
  useEffect(() => {
    let mounted = true;
    if (!me) {
      setLoading(true);
      fetchMe().finally(() => {
        if (mounted) setLoading(false);
      });
    }
    return () => {
      mounted = false;
    };
  }, [fetchMe, me]);

  // Fetch profile image
  useEffect(() => {
    const fetchImage = async () => {
      if (!me?.files_id || !token) {
        setImageUrl(DEFAULT_AVATAR);
        return;
      }
      try {
        const res = await fetchWithAuth(
          me.files_id,
          { method: "GET" },
          {
            token,
            refreshToken: null,
            saveToken: () => {},
            saveRefreshToken: () => {},
            signOut: logout,
          }
        );
        if (!res.ok) throw new Error("Failed to fetch image");
        const blob = await res.blob();
        setImageUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error(err);
        setImageUrl(null);
      }
    };
    fetchImage();
  }, [me, token, logout]);

  useEffect(() => {
    if (me?.files_id) setImageUrl(me.files_id);
  }, [me]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const uploadRes = await fetchWithAuth(
        `${USER_API}/user/update/profile/image`,
        { method: "POST", body: formData },
        {
          token,
          refreshToken: null,
          saveToken: () => {},
          saveRefreshToken: () => {},
          signOut: logout,
        }
      );
      if (!uploadRes.ok) throw new Error("Upload failed");

      const meRes = await fetchWithAuth(
        `${USER_API}/user/me`,
        { method: "GET" },
        {
          token,
          refreshToken: null,
          saveToken: () => {},
          saveRefreshToken: () => {},
          signOut: logout,
        }
      );
      if (!meRes.ok) throw new Error("Failed to fetch user details");

      const meEncrypted = await meRes.json();
      const updatedMe = decryptPayload(meEncrypted);

      saveMe(updatedMe);
      setImageUrl(updatedMe.files_id ? URL.createObjectURL(file) : null);
      alert("Profile picture updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile picture");
    }
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    logout();
    navigate("/");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(me?.user_id || "Unknown timezone");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    navigate(-1); // go back to previous page
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          textAlign: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Back Button (LEFT corner) */}
        <button
          onClick={handleBack}
          style={{
            position: "absolute",
            top: 16,
            left: 16, // ✅ moved from right to left
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px 12px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            zIndex: 10, // ✅ ensures button stays clickable above avatar area
          }}
        >
          ← Back
        </button>

        {/* Top header strip */}
        <div style={{ height: 120, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              bottom: -50,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "#ddd",
                backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "4px solid #fff",
              }}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                position: "absolute",
                bottom: 8,
                right: -4,
                background: "#111",
                color: "#fff",
                borderRadius: "50%",
                border: "none",
                width: 28,
                height: 28,
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
        </div>

        {/* Card Content */}
        <div style={{ padding: "60px 20px 30px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>
            {me?.firstname && me?.lastname
              ? `${me.firstname} ${me.lastname}`
              : me?.username || "User"}
          </h2>

          {/* User ID with copy */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                color: "#666",
                margin: 0,
                maxWidth: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={me?.user_id || "--"}
            >
              {me?.user_id || "--"}
            </p>
            <button
              onClick={handleCopy}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 14,
                color: copied ? "green" : "#111",
              }}
              title="Copy User ID"
            >
              {copied ? "✔" : "📋"}
            </button>
          </div>

          <p style={{ color: "#444", marginBottom: 24, fontSize: 15 }}>
            {me?.country_code && me?.phone_number
              ? `${me.country_code} ${me.phone_number}`
              : "No phone number"}
          </p>

          {/* Stats Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{me.timezone}</div>
              <div style={{ color: "#666", fontSize: 14 }}>Timezone</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{me.username}</div>
              <div style={{ color: "#666", fontSize: 14 }}>Username</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>
                {me.phone_number}
              </div>
              <div style={{ color: "#666", fontSize: 14 }}>Phone Number</div>
            </div>
          </div>

          {/* Buttons */}
          <button
            onClick={handleLogout}
            style={{
              padding: "12px 24px",
              borderRadius: 30,
              border: "none",
              background: "#000",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
