// src/App.jsx
import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import ReceptionistDashboard from "./components/ReceptionistDashboard";
import AgentDashboard from "./components/AgentDashboard";
import ManagerDashboard from "./components/ManagerDashboard"; // Make sure this file exists!

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // On app load, check if there's a valid token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload.role || "agent";
        const name = payload.name || payload.email?.split("@")[0] || "User";
        const formattedName = name
          .split(" ")
          .map((n) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
          .join(" ");

        setUser({ role, name: formattedName });
        setIsLoggedIn(true);
      } catch (err) {
        localStorage.removeItem("access_token");
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleLogin = (role, name) => {
    setUser({ role, name });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userRole"); // optional cleanup
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    setUser(null);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Role-based routing
  if (user.role === "agent") {
    return <AgentDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === "receptionist") {
    return <ReceptionistDashboard user={user} onLogout={handleLogout} />;
  }

  // Handle both "admin" and "manager" roles
  if (user.role === "admin" || user.role === "manager") {
    return <ManagerDashboard user={user} onLogout={handleLogout} />;
  }

  // Fallback — should never hit this now
  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">
      <div className="text-xl text-red-600">Invalid role: {user.role}</div>
    </div>
  );
}