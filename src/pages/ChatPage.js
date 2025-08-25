// src/pages/ChatPage.js
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import ChatWindow from "../components/ChatWindow";
import { io } from "socket.io-client";

const CHAT_API = process.env.REACT_APP_CHAT_API || "http://localhost:9002";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:9002";

export default function ChatPage() {
  const { token, me, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);
  const [incoming, setIncoming] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  // Initialize socket
  const socket = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL, { auth: { token } });
  }, [token]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !me) return;

    const handleConnect = () => {
      socket.emit("join", { user_id: me.user_id || me._id });
    };

    const onNewMessage = (msg) => setIncoming(msg);
    const onNewNotification = (n) => console.log("notification", n);

    socket.on("connect", handleConnect);
    socket.on("new_message", onNewMessage);
    socket.on("new_notification", onNewNotification);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new_message", onNewMessage);
      socket.off("new_notification", onNewNotification);
      // ❌ don't disconnect socket here
    };
  }, [socket, me]);
  // Fetch chat list
  useEffect(() => {
    if (!token) return;
    fetch(`${CHAT_API}/chat/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setChats(Array.isArray(data) ? data : []))
      .catch(() => setChats([]));
  }, [token]);

  // Logout handler
  const handleLogout = () => {
    if (socket) socket.disconnect();
    logout();
    navigate("/");
  };

  // Navigate to profile
  const goToProfile = () => navigate("/me");

  return (
    <div style={{ height: "100vh", display: "flex", background: "#f6f6f6" }}>
      <Sidebar users={chats} onSelectUser={(u) => setActive(u)} />
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        {/* Profile & Logout */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 10,
          }}
        >
          {/* Profile */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            onClick={goToProfile}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: me?.avatar_url
                  ? `url(${me.avatar_url}) center/cover`
                  : "#ddd",
              }}
            />
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {me?.display_name || me?.username}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        {active ? (
          <ChatWindow me={me} peer={active} token={token} socket={socket} />
        ) : (
          <div
            style={{
              height: "100%",
              display: "grid",
              placeItems: "center",
              color: "#9aa0a6",
            }}
          >
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
