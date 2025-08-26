// src/pages/ChatPage.js
import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import ChatWindow from "../components/ChatWindow";
import { io } from "socket.io-client";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const CHAT_API = process.env.REACT_APP_CHAT_API || "http://localhost:9002";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:9002";

export default function ChatPage() {
  const { token, me, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({}); // { conversationId: [msgs] }
  const [active, setActive] = useState(null); // Active user/chat
  const [unreadCounts, setUnreadCounts] = useState({}); // { conversationId: count }
  const [lastMessages, setLastMessages] = useState({}); // { conversationId: lastMsg }

  // Redirect if not logged in
  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  // Initialize socket
  const socket = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL, { auth: { token } });
  }, [token]);

  // Handle unread count and last message
  const handleResetUnread = useCallback((convId, increment) => {
    if (increment) {
      setUnreadCounts((prev) => ({
        ...prev,
        [convId]: (prev[convId] || 0) + 1,
      }));
    } else {
      setUnreadCounts((prev) => ({ ...prev, [convId]: 0 }));
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !me) return;

    const handleConnect = () => {
      socket.emit("join", { user_id: me.user_id || me._id });
    };

    const handleNewMessage = (msg) => {
      if (!msg || !msg.conversation_id) return;

      const convId = msg.conversation_id;
      const activeConvId = active?.conversation_id || null;

      // Update messages state
      setMessages((prev) => {
        const convMessages = prev[convId] || [];
        return {
          ...prev,
          [convId]: [...convMessages, msg],
        };
      });

      // Update last message
      setLastMessages((prev) => ({
        ...prev,
        [convId]: msg.message,
      }));

      // Update unread count if not active
      if (convId !== activeConvId) {
        handleResetUnread(convId, true);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, me, active, handleResetUnread]);

  // Fetch chat list
  useEffect(() => {
    if (!token) return;

    const fetchChats = async () => {
      try {
        const res = await fetchWithAuth(`${CHAT_API}/chat/list`, { method: "GET" }, {
          token,
          refreshToken: null,
          saveToken: () => {},
          saveRefreshToken: () => {},
          signOut: logout,
        });

        if (!res.ok) throw new Error("Failed to fetch chats");

        const data = await res.json();
        setChats(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setChats([]);
      }
    };

    fetchChats();
  }, [token, logout]);

  // Handle selecting a chat
  const handleSelectUser = (user) => {
    setActive(user);

    // Reset unread count for this conversation
    if (user.conversation_id) {
      handleResetUnread(user.conversation_id, false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    if (socket) socket.disconnect();
    logout();
    navigate("/login");
  };

  // Navigate to profile
  const goToProfile = () => navigate("/me");

  return (
    <div style={{ height: "100vh", display: "flex", background: "#f6f6f6" }}>
      <Sidebar
        users={chats}
        onSelectUser={handleSelectUser}
        unreadCounts={unreadCounts}
        lastMessages={lastMessages}
      />

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
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            onClick={goToProfile}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: me?.files_id ? `url(${me.files_id}) center/cover` : "#ddd",
              }}
            />
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {me?.display_name || me?.username}
            </span>
          </div>

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
          <ChatWindow
            me={me}
            peer={active}
            token={token}
            socket={socket}
            onResetUnread={handleResetUnread}
          />
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
