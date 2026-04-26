// src/components/Register.js
import React, { useContext, useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosInstance";
import {
  Container, Row, Col, Card, Form, Button, Alert, Spinner, ToggleButtonGroup, ToggleButton
} from "react-bootstrap";

export default function Register() {
  const location = useLocation();
  const { login } = useContext(AuthContext); // optional auto-login
  const [role, setRole] = useState("user"); // 'user' or 'owner'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // owner-specific
  const [venueName, setVenueName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Auto-set role if URL indicates owner (either via path or ?role=owner)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const qRole = params.get("role");
      if (qRole === "owner") {
        setRole("owner");
        return;
      }
    } catch (e) {
      // ignore
    }

    if (location.pathname && location.pathname.toLowerCase().startsWith("/owner")) {
      setRole("owner");
    }
  }, [location]);

  const resetErrors = () => setError("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetErrors();
    setSubmitting(true);

    try {
      const payloadCommon = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      if (role === "owner") {
        const ownerPayload = {
          ...payloadCommon,
          venue_name: venueName.trim(),
          phone: phone.trim(),
          address: address.trim(),
        };

        await api.post("/owners/register", ownerPayload);
        navigate("/owner/login");
        // optionally auto-login:
        // await login({ identifier: email, password, role: "owner" });
        // navigate("/owner/dashboard");
      } else {
        const userPayload = { ...payloadCommon };
        await api.post("/auth/register", userPayload);
        navigate("/login");
        // optionally auto-login:
        // await login({ identifier: email, password, role: "user" });
        // navigate("/home");
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err.message || "Registration failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    page: { minHeight: "100vh", display: "flex", alignItems: "center", padding: "40px 0" },
    card: { background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10))", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "22px", boxShadow: "0 18px 45px rgba(0,0,0,0.25)" },
    brand: { fontWeight: 800, letterSpacing: 0.2, marginBottom: 4 },
    chip: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
    input: { borderRadius: "12px", borderColor: "rgba(0,0,0,0.08)" },
    button: { border: "0", borderRadius: "12px", paddingTop: 12, paddingBottom: 12, fontWeight: 600, background: "linear-gradient(90deg, rgba(26,115,232,1) 0%, rgba(17,153,142,1) 100%)", boxShadow: "0 10px 20px rgba(26,115,232,0.25)" },
    link: { color: "#0ea5e9", textDecoration: "none", fontWeight: 600 },
  };

  return (
    <div style={styles.page}>
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6}>
            <Card style={styles.card}>
              <Card.Body className="p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h3 style={styles.brand}>
                      <span style={{ color: "#1a73e8" }}>Match</span>
                      <span style={{ color: "#11998e" }}>Up</span>
                    </h3>
                    <div style={styles.chip}>{role === "owner" ? "Register as Venue Owner" : "Create your account"}</div>
                  </div>

                  <ToggleButtonGroup type="radio" name="role" value={role} onChange={(val) => setRole(val)}>
                    <ToggleButton id="reg-user" value="user" variant="outline-light">User</ToggleButton>
                    <ToggleButton id="reg-owner" value="owner" variant="outline-light">Owner</ToggleButton>
                  </ToggleButtonGroup>
                </div>

                {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full name</Form.Label>
                    <Form.Control
                      style={styles.input}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      style={styles.input}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      style={styles.input}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      minLength={6}
                      required
                    />
                  </Form.Group>

                  {role === "owner" && (
                    <>
                      <hr />
                      <Form.Group className="mb-3">
                        <Form.Label>Venue Name</Form.Label>
                        <Form.Control
                          value={venueName}
                          onChange={(e) => setVenueName(e.target.value)}
                          placeholder="Your venue's public name"
                          required={role === "owner"}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Contact phone"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Venue address (optional for now)"
                        />
                      </Form.Group>
                    </>
                  )}

                  <Button type="submit" className="w-100" style={styles.button} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Creating account…
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    Already have an account?{" "}
                    <Link to={role === "owner" ? "/owner/login" : "/login"} style={styles.link}>
                      Login
                    </Link>
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
