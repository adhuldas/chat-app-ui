// src/components/ChatWindow.js
import React, { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const CHAT_API = process.env.REACT_APP_CHAT_API || "http://localhost:9002";
const DEFAULT_AVATAR = "/images/default.webp"; // Add a default image in your public folder


export default function ChatWindow({ me, peer, token, socket, onResetUnread }) {
  const [messages, setMessages] = useState([]);
  const { logout } = useContext(AuthContext);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const myId = me?.id || me?._id || me?.user_id;
  console.log(peer)
  const peerId =
    localStorage.getItem(`receiver_id_${me.user_id || me._id}`) ||
    peer?.id ||
    peer?._id ||
    peer?.user_id ||
    "";

  // Conversation ID — use the first message's conversationId or fallback to peer
  const conversationId = messages[0]?.conversationId || peer?.conversation_id || null;

  // Reset unread count when chat window opens
  useEffect(() => {
    if (conversationId && onResetUnread) {
      onResetUnread(conversationId);
    }
  }, [conversationId, onResetUnread]);

  // Fetch chat history
  useEffect(() => {
    if (!myId || !peerId || !token) return;

    const fetchHistory = async () => {
      try {
        const res = await fetchWithAuth(
          `${CHAT_API}/chat/history/${myId}/${peerId}`,
          { method: "GET" },
          { token, refreshToken: null, saveToken: () => {}, saveRefreshToken: () => {}, signOut: logout }
        );

        if (!res.ok) throw new Error("Failed to fetch chat history");

        const data = await res.json();
        const arr = Array.isArray(data.messages || data) ? data.messages || data : [];

        const norm = arr.map((m, idx) => ({
          id: m.id || m._id || `h${idx}`,
          from: m.sender_id === myId ? "me" : "them",
          text: m.message || m.text || "",
          ts: m.ts || Date.now(),
          conversationId: m.conversation_id || null,
        }));

        setMessages(norm);
      } catch (err) {
        console.error(err);
        setMessages([]);
      }
    };

    fetchHistory();
  }, [myId, peerId, token, logout]);

  // Listen to incoming messages from socket
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      if (!msg || !msg.conversation_id) return;

      // Append messages only for this conversation
      if (msg.conversation_id === conversationId) {
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id || `s${Date.now()}`,
            from: msg.sender_id === myId ? "me" : "them",
            text: msg.message,
            ts: msg.ts || Date.now(),
            conversationId: msg.conversation_id,
          },
        ]);
      } else if (onResetUnread) {
        // Increment unread count for other conversations
        onResetUnread(msg.conversation_id, true);
      }
    };

    socket.on("new_message", onNewMessage);
    return () => socket.off("new_message", onNewMessage);
  }, [socket, myId, conversationId, onResetUnread]);

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const send = async () => {
    console.log(text,peerId)
    const value = text.trim();
    if (!value || !peerId) return;

    // Optimistic update
    const tempMsg = {
      id: `tmp-${Date.now()}`,
      from: "me",
      text: value,
      ts: Date.now(),
      conversationId,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setText("");

    try {
      const res = await fetchWithAuth(
        `${CHAT_API}/chat/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiver_id: peerId, message: value, conversation_id: conversationId }),
        },
        { token, refreshToken: null, saveToken: () => {}, saveRefreshToken: () => {}, signOut: logout }
      );

      if (!res.ok) console.error("send failed", await res.text());
    } catch (e) {
      console.error("send error", e);
    }
  };

  const renderProfileImage = () => {
    const imgUrl = peer.recipient_file_id;
    return imgUrl ? imgUrl : DEFAULT_AVATAR;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "10px 16px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 10}}>
      <img src={renderProfileImage()}
      alt={peer.username}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        marginRight: 8,
        objectFit: "cover",
      }}/>
        <div style={{ fontWeight: 600 }}>{peer?.display_name || peer?.recipient_name}</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", background: "#f6f6f6", padding: 16 }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: m.from === "me" ? "flex-end" : "flex-start",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: 16,
                  background: m.from === "me" ? "#111" : "#fff",
                  color: m.from === "me" ? "#fff" : "#111",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  borderBottomRightRadius: m.from === "me" ? 4 : 16,
                  borderBottomLeftRadius: m.from !== "me" ? 4 : 16,
                }}
              >
                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                  {new Date(m.ts).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ background: "#fff", borderTop: "1px solid #eee", padding: 12 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message"
            style={{
              flex: 1,
              background: "#f1f3f4",
              border: "1px solid #e3e3e3",
              borderRadius: 16,
              padding: "12px 14px",
              outline: "none",
            }}
          />
          <button
            onClick={send}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
