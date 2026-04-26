// src/App.js
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Venues from "./pages/Venues";
import Bookings from "./pages/Bookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Matches from "./pages/Matches";
import CreateMatch from "./pages/CreateMatch";
import VenueDetails from "./components/VenueDetails";
import UserDashboard from "./pages/UserDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import OwnerVenues from "./components/OwnerVenues";
import OwnerBookings from "./components/OwnerBookings";
import OwnerCreateVenue from "./pages/OwnerCreateVenue";
import OwnerManageVenue from "./pages/OwnerManageVenue"; // <-- new import
import "./index.css";

// Hide Navbar/Footer on the landing page
function Layout({ children }) {
  const location = useLocation();
  const hideLayout = location.pathname === "/";
  return (
    <>
      {!hideLayout && <Navbar />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/venues" element={<Venues />} />
      <Route path="/venues/:id" element={<VenueDetails />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/owner/login" element={<Login owner />} />
      <Route path="/owner/register" element={<Register owner />} />

      {/* User Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-match"
        element={
          <ProtectedRoute>
            <CreateMatch />
          </ProtectedRoute>
        }
      />

      {/* Owner Protected Routes */}
      <Route
        path="/owner/dashboard"
        element={
          <ProtectedRoute role="owner">
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />

      {/* View owner's venues list */}
      <Route
        path="/owner/venues"
        element={
          <ProtectedRoute role="owner">
            <OwnerVenues />
          </ProtectedRoute>
        }
      />

      {/* Manage a single venue (OWNER) */}
      <Route
        path="/owner/venues/:id/manage"
        element={
          <ProtectedRoute role="owner">
            <OwnerManageVenue />
          </ProtectedRoute>
        }
      />

      {/* Add new venue */}
      <Route
        path="/owner/venues/new"
        element={
          <ProtectedRoute role="owner">
            <OwnerCreateVenue />
          </ProtectedRoute>
        }
      />
      <Route
  path="/owner/bookings"
  element={
    <ProtectedRoute role="owner">
      <OwnerBookings />
    </ProtectedRoute>
  }
/>


      {/* Fallback */}
      <Route
        path="*"
        element={
          <div style={{ padding: 20 }}>
            Unknown route: {window.location.pathname}
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

export default App;
