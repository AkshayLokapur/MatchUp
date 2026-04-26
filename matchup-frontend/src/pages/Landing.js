// src/pages/Landing.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <div
      className="h-screen w-full flex flex-col items-center justify-end text-center relative"
      style={{
        backgroundImage: "url('/matchup-jpg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Button Container */}
      <div className="relative z-10 max-w-2xl px-6 mb-24">
        <button
          onClick={handleGetStarted}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-full shadow-lg text-lg animate-bounce transition duration-300"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
