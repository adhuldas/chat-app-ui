// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import all your pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
// If you have a Register page, uncomment the next line
import Register from "./pages/RegisterPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        {/* Use either Register or SignupPage, not both unless needed */}
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        {/* Optional: catch-all route */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
