// src/components/Navbar.jsx
import React, { useContext } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { Navbar as RBNavbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

/* Avatar initials */
function UserAvatar({ name }) {
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="inline-flex items-center justify-center rounded-full text-white font-semibold text-sm w-8 h-8"
      style={{
        background: "rgba(255,255,255,0.15)",
        boxShadow: "inset 0 -2px 6px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.12)",
      }}
    >
      {initials}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide navbar on login/register pages
  const hiddenRoutes = ["/login", "/register", "/owner/login", "/owner/register"];
  if (hiddenRoutes.includes(location.pathname)) return null;

  /* Detect owner */
  const savedRole = typeof window !== "undefined" ? localStorage.getItem("current_role") : null;
  const isOwner = (user && user.role === "owner") || savedRole === "owner";

  const navItem =
    "px-3 py-1 rounded-md text-sm whitespace-nowrap text-white/90 hover:text-white transition";

  const navActive = ({ isActive }) =>
    isActive ? `${navItem} bg-white/10 fw-bold` : navItem;

  const logoutHandler = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("owner_token");
      localStorage.removeItem("current_role");
    } catch (e) {}
    logout();
    navigate("/login");
  };

  return (
    <RBNavbar
      expand="lg"
      className="sticky-top z-50"
      style={{
        background:
          "linear-gradient(90deg, rgba(10,55,130,0.96) 0%, rgba(20,95,180,0.96) 55%, rgba(8,120,90,0.96) 100%)",
        backdropFilter: "blur(6px)",
      }}
    >
      <Container className="px-4">
        <RBNavbar.Brand
          as={Link}
          to={isOwner ? "/owner/dashboard" : "/home"}
          className="fw-bold text-white"
        >
          Match<span className="text-green-300">Up</span>
        </RBNavbar.Brand>

        <RBNavbar.Toggle aria-controls="main-nav" className="border border-white/20" />

        <RBNavbar.Collapse id="main-nav">
          <Nav className="mx-auto flex gap-2">
            {/* OWNER NAVBAR */}
            {isOwner ? (
              <>
                <Nav.Link as={NavLink} to="/owner/dashboard" className={navActive}>
                  Dashboard
                </Nav.Link>

                <Nav.Link as={NavLink} to="/owner/venues" className={navActive}>
                  Venue
                </Nav.Link>

                <Nav.Link as={NavLink} to="/owner/bookings" className={navActive}>
                  Bookings
                </Nav.Link>
              </>
            ) : (
              /* USER NAVBAR */
              <>
                <Nav.Link as={NavLink} to="/home" className={navActive}>
                  Home
                </Nav.Link>
                <Nav.Link as={NavLink} to="/matches" className={navActive}>
                  Matches
                </Nav.Link>
                <Nav.Link as={NavLink} to="/venues" className={navActive}>
                  Venues
                </Nav.Link>

                <Nav.Link as={NavLink} to="/bookings" className={navActive}>
                  Bookings
                </Nav.Link>

                <Nav.Link as={NavLink} to="/create-match" className={navActive}>
                  Create Match
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* RIGHT SECTION (no notifications) */}
          <div className="d-flex align-items-center gap-3">
            {!user ? (
              <>
                <Button
                  as={Link}
                  to="/login"
                  className="rounded-full px-4 py-1 text-sm"
                  style={{ background: "white", color: "#0b2346" }}
                >
                  Login
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="outline-light"
                  className="rounded-full px-4 py-1 text-sm border-white/40"
                >
                  Register
                </Button>
              </>
            ) : (
              <NavDropdown
                align="end"
                title={<UserAvatar name={user.name} />}
                menuVariant="dark"
              >
                {isOwner ? (
                  <NavDropdown.Item as={Link} to="/owner/dashboard">
                    Owner Dashboard
                  </NavDropdown.Item>
                ) : (
                  <NavDropdown.Item as={Link} to="/dashboard">
                    Dashboard
                  </NavDropdown.Item>
                )}

                <NavDropdown.Item className="text-danger" onClick={logoutHandler}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </div>
        </RBNavbar.Collapse>
      </Container>
    </RBNavbar>
  );
}
