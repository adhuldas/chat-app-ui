// src/components/Sidebar.js
import React, { useState, useRef, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Sidebar.css";
import { encryptPayload } from "../utils/encryption"; 

const USER_API = process.env.REACT_APP_USER_API || "http://localhost:9001";

const Sidebar = ({ users = [], onSelectUser }) => {
  const { token } = useContext(AuthContext);
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
        const res = await fetch(`${USER_API}/user/list`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      }
    };
    fetchUsers();
    return () => controller.abort();
  }, [searchQuery, token]);

  // Handle user selection
  const handleUserClick = (user) => {
    onSelectUser(user); // send selected user to parent
    setSearchOpen(false);
    setSearchQuery("");
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
                  searchResults.map((user) => (
                    <div
                      key={user.user_id}
                      className="sidebar-item"
                      onClick={() => handleUserClick(user)}
                    >
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
          users.map((user) => (
            <div
              key={user._id || user.user_id}
              className="sidebar-item"
              onClick={() => handleUserClick(user)}
            >
              <strong>{user.username}</strong>
              <p>{user.recipient_name || "Available"}</p>
              <p>{user.last_message}</p>
            </div>
          ))
        ) : (
          <p className="no-chats">No chats yet</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
