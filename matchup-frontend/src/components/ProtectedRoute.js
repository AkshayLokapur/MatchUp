// src/components/ProtectedRoute.js
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useContext(AuthContext);

  // Wait until AuthProvider finishes bootstrapping token & user info
  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route needs a specific role (example: owner dashboard)
  if (role && user.role !== role) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
