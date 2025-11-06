import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import "./index.css";

const images = [
  "/assets/spa img.jpg",
  "/assets/spaa.jpg",
  "/assets/spaaa.jpg",
];

export default function Home() {
  const [isLogin, setIsLogin] = useState(true); // login/signup toggle
  const [isLoggedIn, setIsLoggedIn] = useState(false); // user login state

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  if (isLoggedIn) return <Dashboard />;

  return (
    <div className="h-screen w-screen bg-black relative">
      <LandingPage
        images={images}
        autoplay
        direction="horizontal"
        overlayClass="bg-black/0"
      >
        {/* Logo */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <img
            src="/assets/logo.png"
            alt="Blackbird Logo"
            className="w-56 h-50"
          />
        </div>

        {/* Transparent Login/Sign Up Form */}
        <div className="flex flex-col items-center justify-center w-full h-full px-4 pointer-events-auto">
          {/* Tabs */}
          <div className="flex justify-center mb-6 space-x-6 text-white text-lg font-semibold">
            <button
              className={`transition duration-300 ${
                isLogin ? "underline" : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`transition duration-300 ${
                !isLogin ? "underline" : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="flex flex-col space-y-4 w-full max-w-sm text-white"
          >
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                className="p-3 rounded-md bg-transparent border-b border-white placeholder-white text-white focus:outline-none focus:border-yellow-400 pt-serif-regular"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="p-3 rounded-md bg-transparent border-b border-white placeholder-white text-white focus:outline-none focus:border-yellow-400 pt-serif-regular"
            />
            <input
              type="password"
              placeholder="Password"
              className="p-3 rounded-md bg-transparent border-b border-white placeholder-white text-white focus:outline-none focus:border-yellow-400 pt-serif-regular"
            />
            <button
              type="submit"
              className="bg-white text-black font-semibold py-3 rounded-md hover:bg-gray-200 transition-all duration-300 pt-serif-bold"
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </form>
        </div>
      </LandingPage>
    </div>
  );
}
