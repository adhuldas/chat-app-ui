import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import moment from "moment-timezone";
import PhoneInput from "react-phone-input-2";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import ct from "countries-and-timezones";
import { encryptPayload } from "../utils/encryption";

import "react-phone-input-2/lib/style.css";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    timezone: "",
    password: "",
    confirm_password: "", // only for frontend validation
    phone_number: "",
    country_code: "",
    country_iso: "us", // default
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("signup_token");
  const slug = localStorage.getItem("signup_slug");
  const username = localStorage.getItem("singup_email");
  const user_type = localStorage.getItem("signup_user_type");

  useEffect(() => {
    if (!token || !slug) {
      navigate("/"); // redirect to signup if no token/slug
    }
  }, [token, slug, navigate]);
  // --- Timezones list
  const timezoneOptions = moment.tz.names().map((tz) => ({
    value: tz,
    label: tz,
  }));

  // --- Phone number validation
  const validatePhone = (number) => {
    const phone = parsePhoneNumberFromString("+" + number);
    return phone ? phone.isValid() : false;
  };

  // --- Auto set country based on timezone
  const handleTimezoneChange = (val) => {
    const timezone = val.value;
    let countryIso = form.country_iso;

    const tzData = ct.getTimezone(timezone);
    if (tzData && tzData.countries.length > 0) {
      countryIso = tzData.countries[0].toLowerCase();
    }

    setForm({
      ...form,
      timezone,
      country_iso: countryIso,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    // --- Validate phone
    if (!validatePhone(form.phone_number)) {
      setError("Invalid phone number for selected country code.");
      setBusy(false);
      return;
    }

    // --- Validate password match
    if (form.password !== form.confirm_password) {
      setError("Password and Confirm Password do not match.");
      setBusy(false);
      return;
    }

    try {
      // remove confirm_password before sending
      const { confirm_password, ...payloadData } = form;
      const payload = { ...payloadData, token, slug, username, user_type };
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
      localStorage.removeItem("signup_token");
      localStorage.removeItem("signup_slug");
      localStorage.removeItem("signup_user_type")
      localStorage.removeItem("singup_email")
      setBusy(false);
    }
  };

  // --- Common style for inputs/selects/phone
  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    marginTop: 6,
    boxSizing: "border-box",
  };
  const timezoneStyle = {
    width: "100%",
    padding: "0px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    marginTop: 6,
    boxSizing: "border-box",
  };

  const phoneNumberStyle = {
    width: "100%",
    padding: "0px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    marginTop: 6,
    boxSizing: "border-box",
    height:"44px"
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
          {/* Username */}
          <label style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
            Username
            <input
              type="text"
              value={username}
              readOnly
              style={{
                ...inputStyle,
                backgroundColor: "#f0f0f0",
              }}
            />
          </label>

          {/* First name */}
          <label style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
            First Name
            <input
              type="text"
              value={form.firstname}
              onChange={(e) => setForm({ ...form, firstname: e.target.value })}
              style={inputStyle}
            />
          </label>

          {/* Last name */}
          <label style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
            Last Name
            <input
              type="text"
              value={form.lastname}
              onChange={(e) => setForm({ ...form, lastname: e.target.value })}
              style={inputStyle}
            />
          </label>

          {/* Timezone dropdown */}
          <label style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
            Timezone
            <Select
              options={timezoneOptions}
              value={timezoneOptions.find((t) => t.value === form.timezone)}
              onChange={handleTimezoneChange}
              isSearchable
              placeholder="Select timezone..."
              styles={{
                control: (base) => ({
                  ...base,
                  ...timezoneStyle,
                  minHeight: "44px",
                }),
                valueContainer: (base) => ({
                  ...base,
                  padding: "0 6px",
                }),
              }}
            />
          </label>

          {/* Phone + Country code */}
          <label style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
            Phone Number
            <PhoneInput
              country={form.country_iso || "us"}
              value={form.phone_number}
              onChange={(value, country) =>
                setForm({
                  ...form,
                  phone_number: value,
                  country_code: "+" + country.dialCode,
                  country_iso: country.countryCode.toLowerCase(),
                })
              }
              inputStyle={phoneNumberStyle}
              buttonStyle={{
                borderRadius: "10px 0 0 10px",
                border: "1px solid #ddd",
                borderRight: "none",
              }}
              containerStyle={{ marginTop: 6, width: "100%" }}
            />
          </label>

          {/* Password */}
          <label style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
            />
          </label>

          {/* Confirm Password */}
          <label style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
            Confirm Password
            <input
              type="password"
              value={form.confirm_password}
              onChange={(e) =>
                setForm({ ...form, confirm_password: e.target.value })
              }
              style={inputStyle}
            />
          </label>

          {/* Error */}
          {error && (
            <div style={{ color: "#d00", fontSize: 13, marginBottom: 8 }}>
              {error}
            </div>
          )}

          <button
            disabled={busy}
            style={{
              ...inputStyle,
              padding: 12,
              borderRadius: 12,
              border: "none",
              background: "#111",
              color: "#fff",
              marginTop: 8,
              cursor: "pointer",
            }}
          >
            {busy ? "Registering..." : "Register"}
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: 13, marginLeft:275}}>
          Back to <a href="/">Sign in</a>
        </div>
      </div>
    </div>
  );
}
