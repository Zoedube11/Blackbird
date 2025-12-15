// src/App.jsx
import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import ReceptionistDashboard from "./components/ReceptionistDashboard";
import AgentDashboard from "./components/AgentDashboard";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

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
      } catch {
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
    setIsLoggedIn(false);
    setUser(null);
  };

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return user.role === "agent" ? (
    <AgentDashboard user={user} onLogout={handleLogout} />
  ) : (
    <ReceptionistDashboard user={user} onLogout={handleLogout} />
  );
}