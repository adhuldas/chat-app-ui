// SignupPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { encryptPayload } from "../utils/encryption";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    setBusy(true);
    try {
      const body = encryptPayload({ email });
      const res = await fetch(`${USER_API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json(); // expect { token, slug }
      // store in sessionStorage
      sessionStorage.setItem("signup_token", data.token);
      sessionStorage.setItem("signup_slug", data.slug);
      sessionStorage.setItem("signup_user_type",data.user_type)
      sessionStorage.setItem("singup_email",data.email)

      navigate("/register");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f6f6" }}>
      <div style={{ width: 360, background: "#fff", padding: 24, borderRadius: 16, boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}>
        <h2>Create account</h2>
        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd", marginTop: 6 }}
            />
          </label>
          {error && <div style={{ color: "#d00", fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <button
            disabled={busy}
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: "#111", color: "#fff" }}
          >
            {busy ? "Creating..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
