// src/components/Login.js
import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Container, Row, Col, Card, Form, Button, Alert, Spinner, ToggleButtonGroup, ToggleButton
} from "react-bootstrap";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // 'user' or 'owner'
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login({ identifier, password, role });
      if (user.role === "owner") navigate("/owner/dashboard");
      else navigate("/home");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || err?.message || "Login failed. Check credentials.");
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
          <Col xs={12} sm={10} md={7} lg={5}>
            <Card style={styles.card}>
              <Card.Body className="p-4 p-md-5">

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h3 style={styles.brand}>
                      <span style={{ color: "#1a73e8" }}>Match</span>
                      <span style={{ color: "#11998e" }}>Up</span>
                    </h3>
                    <div style={styles.chip}>{role === "owner" ? "Venue Owner Sign in" : "Welcome Back!"}</div>
                  </div>

                  <ToggleButtonGroup type="radio" name="role" value={role} onChange={(val) => setRole(val)}>
                    <ToggleButton id="tbg-user" value="user" variant="outline-light">User</ToggleButton>
                    <ToggleButton id="tbg-owner" value="owner" variant="outline-light">Owner</ToggleButton>
                  </ToggleButtonGroup>
                </div>

                {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      style={styles.input}
                      type="email"
                      placeholder={role === "owner" ? "owner@example.com" : "you@example.com"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      style={styles.input}
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button type="submit" className="w-100" style={styles.button} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Logging in…
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    {role === "owner" ? (
                      <>New owner? <Link to="/owner/register" style={styles.link}>Register your venue</Link></>
                    ) : (
                      <>Don’t have an account? <Link to="/register" style={styles.link}>Register</Link></>
                    )}
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
