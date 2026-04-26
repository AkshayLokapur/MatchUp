// src/context/AuthContext.js
import React, { createContext, useEffect, useState } from "react";
import api from "../api/axiosInstance";

export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  setUser: () => {},
});

/**
 * AuthProvider
 * - Restores session from localStorage (current_role + token keys)
 * - Exposes login({ identifier, password, role }) -> returns user
 * - Exposes logout()
 * - Exposes setUser for manual updates
 *
 * Storage convention:
 *  - token (user token)
 *  - owner_token (venue owner token)
 *  - current_role ('user' or 'owner')  <- used by axios interceptor
 *
 * Note: the axios instance should attach the Authorization header based on current_role.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // profile object, will include role after login
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // bootstrap: try restore existing session
    const bootstrap = async () => {
      try {
        const role = localStorage.getItem("current_role"); // 'user' or 'owner'
        const tokenKey = role === "owner" ? "owner_token" : "token";
        const token = localStorage.getItem(tokenKey);

        if (token && role) {
          // axiosInstance should pick token up from localStorage via interceptor,
          // but to be explicit, we will call the correct profile endpoint here.
          const profileEndpoint = role === "owner" ? "/owners/auth/me" : "/auth/me";
          const res = await api.get(profileEndpoint);
          setUser({ ...res.data, role });
        } else {
          // nothing to restore
          setUser(null);
        }
      } catch (err) {
        // failed to restore (invalid/expired token) - clear stored auth info
        localStorage.removeItem("token");
        localStorage.removeItem("owner_token");
        localStorage.removeItem("current_role");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  /**
   * login: authenticates and fetches profile
   * @param {Object} params
   * @param {string} params.identifier    // email/username
   * @param {string} params.password
   * @param {string} params.role          // 'user' or 'owner'
   * @returns {Object} user profile
   */
  const login = async ({ identifier, password, role = "user" }) => {
    // choose endpoints according to your backend
    const loginEndpoint = role === "owner" ? "/owners/auth/login" : "/auth/login";
    const profileEndpoint = role === "owner" ? "/owners/auth/me" : "/auth/me";

    // build form payload according to what your backend expects
    const form = new URLSearchParams();
    form.append("username", identifier.trim().toLowerCase());
    form.append("password", password);

    // call login
    const { data } = await api.post(loginEndpoint, form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // store token in role-aware key and persist current role
    const tokenKey = role === "owner" ? "owner_token" : "token";
    localStorage.setItem(tokenKey, data.access_token);
    localStorage.setItem("current_role", role);

    // fetch profile (axios interceptor will attach token automatically if configured)
    const me = await api.get(profileEndpoint);

    const newUser = { ...me.data, role };
    setUser(newUser);
    return newUser;
  };

  /**
   * logout: clears localStorage and state
   */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("owner_token");
    localStorage.removeItem("current_role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
