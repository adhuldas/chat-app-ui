// src/pages/LoginPage.js
import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { encryptPayload } from "../utils/encryption";
import { decryptPayload } from "../utils/encryption";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";

export default function LoginPage() {
  const navigate = useNavigate();
  const { saveToken, saveMe } = useContext(AuthContext);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password) {
      setError("Username and password are required");
      return;
    }

    setBusy(true);
    try {
      // 1️⃣ Sign in
      const body = encryptPayload(form);
      const res = await fetch(`${USER_API}/user/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Signin failed");
      }

      const data = await res.json(); // { access_token, user }
      const token = data.access_token;
      saveToken(token);

      // 2️⃣ Fetch and decrypt user details
      const meRes = await fetch(`${USER_API}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!meRes.ok) {
        const text = await meRes.text();
        throw new Error(text || "Failed to fetch user details");
      }

      const meEncrypted = await meRes.json(); // encrypted response
      const me = decryptPayload(meEncrypted);  // decrypt
      saveMe(me);

      // 3️⃣ Navigate to chat
      navigate("/chat");
    } catch (err) {
      console.error(err);
      setError(err.message || "Signin failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f6f6f6",
      }}
    >
      <div
        style={{
          width: 360,
          background: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ marginBottom: 8 }}>Sign in</h2>
        <p style={{ color: "#666", marginBottom: 16 }}>
          Use your account to continue
        </p>
        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
            Username
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ddd",
                marginTop: 6,
              }}
            />
          </label>
          <label style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ddd",
                marginTop: 6,
              }}
            />
          </label>
          {error && (
            <div style={{ color: "#d00", fontSize: 13, marginBottom: 8 }}>
              {error}
            </div>
          )}
          <button
            disabled={busy}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "none",
              background: "#111",
              color: "#fff",
            }}
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: 13 }}>
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}