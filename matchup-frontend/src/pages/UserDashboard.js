// src/pages/UserDashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";

export default function UserDashboard() {
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState({ hosted: 0, joined: 0, upcoming: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [venues, setVenues] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(true);

  // chart data (still static – that’s OK)
  const chartData = [
    { name: "Jan", bookings: 4 },
    { name: "Feb", bookings: 6 },
    { name: "Mar", bookings: 5 },
    { name: "Apr", bookings: 8 },
    { name: "May", bookings: 7 },
  ];

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsRes, upcomingRes, venuesRes] = await Promise.all([
          api.get("/users/me/stats"),
          api.get("/matches?scope=upcoming&me=1"),
          api.get("/venues"), // ✅ ONLY OWNER-CREATED VENUES
        ]);

        setStats(statsRes.data);
        setUpcoming(upcomingRes.data || []);
        setVenues(venuesRes.data || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-6 text-white">Loading dashboard…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-green-600 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-extrabold">
              Welcome{user?.name ? `, ${user.name}` : ""} 👋
            </h1>
            <p className="text-blue-100 mt-2">
              Your sports activity summary
            </p>
          </div>

          <div className="flex gap-3">
  <Link
    to="/create-match"
    className="no-underline rounded-lg bg-gradient-to-r from-green-400 to-green-600 px-4 py-2 text-white font-semibold hover:opacity-90 transition"
  >
    Create Match
  </Link>

  <Link
    to="/venues"
    className="no-underline rounded-lg bg-gradient-to-r from-green-400 to-green-600 px-4 py-2 text-white font-semibold hover:opacity-90 transition"
  >
    Explore Venues
  </Link>
</div>

        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-2">Your Stats</h2>
            <p>Matches Hosted: <b>{stats.hosted}</b></p>
            <p>Matches Joined: <b>{stats.joined}</b></p>
            <p>Upcoming: <b>{stats.upcoming}</b></p>
          </div>

          <div className="md:col-span-2 bg-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Monthly Bookings</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Bar dataKey="bookings" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ✅ DYNAMIC VENUES (NO HARDCODE) */}
        <section className="bg-white/5 p-6 rounded-xl mb-6">
          <h2 className="text-2xl font-bold mb-4">Explore Venues</h2>

          {venues.length === 0 ? (
            <p className="text-blue-100">No venues available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {venues.map((v) => (
                <div
                  key={v.id}
                  className="bg-gradient-to-br from-green-500/40 to-blue-500/40 rounded-xl p-4"
                >
                  <h3 className="font-semibold">{v.name}</h3>
                  <p className="text-sm">{v.city}</p>
                  <p className="text-sm">
                    Sports: {Array.isArray(v.sports_available)
                      ? v.sports_available.join(", ")
                      : ""}
                  </p>
                  <Link
                    to={`/venues/${v.id}`}
                    className="text-blue-200 text-sm font-semibold"
                  >
                    Book Now →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* UPCOMING MATCHES */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Upcoming Matches</h2>

          {upcoming.length === 0 ? (
            <p className="text-blue-100">No upcoming matches</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((m) => (
                <li key={m.id} className="bg-white/10 p-4 rounded-lg">
                  {m.sport} • {new Date(m.start_time).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  );
}
