// src/components/Sidebar.js
import React, { useState, useRef, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Sidebar.css";
import { encryptPayload } from "../utils/encryption"; 
import { fetchWithAuth } from "../utils/fetchWithAuth";

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";
const DEFAULT_AVATAR = "/images/default.webp"; // Add a default image in your public folder
const OPENED_CHAT_USER_IMAGE = ""

const Sidebar = ({ users = [], onSelectUser, unreadCounts = {}, lastMessages = {} }) => {
  const { token, logout } = useContext(AuthContext);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (!searchQuery || !token) return setSearchResults([]);
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        const body = encryptPayload({ search_data: searchQuery });
        const res = await fetchWithAuth(
          `${USER_API}/user/list`,
          {
            method: "POST",
            body: JSON.stringify(body),
            signal: controller.signal,
            headers: { "Content-Type": "application/json" }, // only content-type
          },
          { token, refreshToken: null, saveToken: () => {}, saveRefreshToken: () => {}, signOut: logout }
        );

        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      }
    };

    fetchUsers();
    return () => controller.abort();
  }, [searchQuery, token, logout]);

  const handleUserClick = (user,isSearch=false) => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("receiver_id_")) {
        localStorage.removeItem(key);
      }
    });
    const dynamicVars = {};
    let receiver_id = "";
    if (!isSearch && Array.isArray(user.participants) && user.participants.length > 1) {
      receiver_id = user.participants.find((id) => id !== user.user_id) || "";
    }else{
      receiver_id = user.user_id
    }
    localStorage.setItem(`receiver_id_${user.user_id}`, receiver_id);
    dynamicVars[`receiver_id_${user.user_id}`] = receiver_id;
    onSelectUser(user);
    setSearchOpen(false);
    setSearchQuery("");
    renderProfileImage(user)
  };

  const renderProfileImage = (user) => {
    let imgUrl = ""
    if(user.recipient_file_id){
      imgUrl =  user.recipient_file_id;
    }else if(user.files_id){
      imgUrl = `${USER_API}/user/image/${user.files_id}`
    }
    return imgUrl ? imgUrl : DEFAULT_AVATAR;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <div ref={searchRef}>
          <button className="plus-button" onClick={() => setSearchOpen(!searchOpen)}>
            +
          </button>
          {searchOpen && (
            <div className="user-search-dropdown">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {searchResults.length > 0 ? (
                  searchResults.map((user, idx) => (
                    <div
                      key={`${user._id || user.user_id}-${idx}`}
                      className="sidebar-item"
                      onClick={() => handleUserClick(user,true)}
                    >
                      <img
                        src={renderProfileImage(user)}
                        alt={user.username || user.user_id}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          marginRight: 8,
                          objectFit: "cover",
                        }}
                      />
                      {user.firstname} {user.lastname} ({user.username})
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 8, color: "#999" }}>No users found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-list">
        {users.length > 0 ? (
          users.map((user, idx) => {
            const count = unreadCounts[user.conversation_id] || 0;
            const lastMsg = lastMessages[user.conversation_id] || user.last_message || "Available";

            return (
              <div
                key={`${user.user_id}-${idx}`}
                className="sidebar-item"
                onClick={() => handleUserClick(user)}
                style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", cursor: "pointer" }}
              >
                <img
                  src={renderProfileImage(user)}
                  alt={user.username || user.user_id}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p>{user.recipient_name || user.firstname+" "+user.lastname}</p>
                  <p style={{ fontSize: 12, color: "#555", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {lastMsg}
                  </p>
                </div>
                {count > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      background: "red",
                      color: "#fff",
                      borderRadius: "50%",
                      minWidth: 20,
                      height: 20,
                      lineHeight: "20px",
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <p className="no-chats">No chats yet</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
