// src/pages/OwnerDashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import { Link } from "react-router-dom";

function StatCard({ title, value, hint }) {
  return (
    <div className="bg-white/6 border border-white/10 rounded-2xl p-4 w-full">
      <div className="text-sm text-white/80">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
      {hint && <div className="text-xs text-white/60 mt-1">{hint}</div>}
    </div>
  );
}

export default function OwnerDashboard() {
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [vRes, bRes] = await Promise.all([
          api.get("/owners/venues"),
          api.get("/owners/bookings"),
        ]);

        if (!mounted) return;
        setVenues(Array.isArray(vRes.data) ? vRes.data : []);
        setBookings(Array.isArray(bRes.data) ? bRes.data : []);
      } catch (e) {
        console.error("OwnerDashboard load error:", e);
        setErr(e?.response?.data?.detail || "Failed to load owner data");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const totalVenues = venues.length;
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  return (
    <div
      className="min-h-screen p-6 text-white"
      style={{
        background:
          "linear-gradient(90deg, rgba(10,55,130,0.96) 0%, rgba(20,95,180,0.96) 55%, rgba(8,120,90,0.96) 100%)",
        paddingTop: "96px",
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold">Owner Dashboard</h1>
          <p className="text-sm text-white/80 mt-1">
            Manage your venues and bookings in one place.
          </p>
        </div>

        {err && <div className="mb-4 text-red-300">{err}</div>}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard title="Total venues" value={totalVenues} hint="Venues you own" />
          <StatCard title="Total bookings" value={totalBookings} hint="All bookings for your venues" />
          <StatCard title="Revenue" value={`₹${totalRevenue.toFixed(2)}`} hint="Sum of booking amounts" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Venues List */}
          <section className="bg-white/6 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">My Venues</h2>
            </div>

            {loading ? (
              <div className="py-10 text-center text-white/70">Loading venues...</div>
            ) : venues.length === 0 ? (
              <div className="py-6 text-white/70">No venues found. Add a venue to start getting bookings.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {venues.map((v) => (
                  <div key={v.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-start gap-4">
                    {v.image ? (
                      <div className="w-28 h-20 rounded-md overflow-hidden flex-shrink-0">
                        <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-28 h-20 rounded-md bg-white/6 flex items-center justify-center text-white/60">
                        No image
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{v.name}</h3>
                          <div className="text-sm text-white/80">
                            {v.city} {v.address ? `• ${v.address}` : ""}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-white/70">₹{v.price_per_hour}/hr</div>
                          <div className="text-xs text-white/60 mt-2">Rating: {v.rating ?? "—"}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                       <Link to={`/owner/venues/${v.id}/manage`}
                        className="px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:opacity-90 transition"
                        style={{
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)", // blue gradient
                        color: "white",
                        textDecoration: "none",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.3)"
  }}
>
  Manage
</Link>


                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Bookings */}
          <section className="bg-white/6 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Bookings</h2>
              <Link to="/owner/bookings" className="text-sm text-white/80 underline">View all</Link>
            </div>

            {loading ? (
              <div className="py-10 text-center text-white/70">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="py-6 text-white/70">No bookings yet.</div>
            ) : (
              <ul className="space-y-3">
                {bookings.slice(0, 8).map((b) => (
                  <li key={b.id} className="bg-white/5 p-3 rounded-lg flex justify-between border border-white/8">
                    <div>
                      <div className="text-sm text-white/90 font-medium">{b.venue_name}</div>
                      <div className="text-xs text-white/70 mt-1">{b.user_email || "Unknown user"}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm">₹{(Number(b.amount) || 0).toFixed(0)}</div>
                      <div className="text-xs text-white/60 mt-1">{b.date}{b.time ? ` • ${b.time}` : ""}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
