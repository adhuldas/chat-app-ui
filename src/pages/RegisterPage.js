import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { encryptPayload } from "../utils/encryption";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    timezone: "",
    password: "",
    phone_number: "",
    country_code: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const token = sessionStorage.getItem("signup_token");
  const slug = sessionStorage.getItem("signup_slug");
  const username = sessionStorage.getItem("singup_email"); // username from session
  const user_type = sessionStorage.getItem("signup_user_type");

  useEffect(() => {
    if (!token || !slug) {
      navigate("/"); // redirect to signup if no token/slug
    }
  }, [token, slug, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = { ...form, token, slug, username, user_type };
      const body = encryptPayload(payload);

      const res = await fetch(`${USER_API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());
      navigate("/");
    } catch (err) {
      setError(err.message || "Register failed");
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
        <h2 style={{ marginBottom: 16 }}>Register details</h2>
        <form onSubmit={submit}>
          {[
            { label: "Username", key: "username", value: username, readOnly: true },
            { label: "First Name", key: "firstname" },
            { label: "Last Name", key: "lastname" },
            { label: "Timezone", key: "timezone" },
            { label: "Password", key: "password", type: "password" },
            { label: "Phone Number", key: "phone_number" },
            { label: "Country Code", key: "country_code" },
          ].map((field) => (
            <label
              key={field.key}
              style={{ display: "block", marginBottom: 12, fontSize: 13 }}
            >
              {field.label}
              <input
                type={field.type || "text"}
                value={field.readOnly ? field.value : form[field.key]}
                readOnly={field.readOnly || false}
                onChange={(e) =>
                  setForm({ ...form, [field.key]: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  marginTop: 6,
                  boxSizing: "border-box",
                  backgroundColor: field.readOnly ? "#f0f0f0" : "#fff",
                }}
              />
            </label>
          ))}
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
              marginTop: 8,
            }}
          >
            {busy ? "Saving..." : "Finish"}
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: 13 }}>
          Back to <a href="/">Sign in</a>
        </div>
      </div>
    </div>
  );
}
