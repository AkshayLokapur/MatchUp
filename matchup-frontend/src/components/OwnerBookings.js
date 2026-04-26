import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import { Link } from "react-router-dom";

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/owners/bookings");
        if (!mounted) return;
        setBookings(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("OwnerBookings load error:", e);
        setErr(e?.response?.data?.detail || "Failed to load bookings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const total = bookings.length;
  const revenue = bookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  return (
    <div
      className="min-h-screen p-6 text-white"
      style={{
        background:
          "linear-gradient(90deg, rgba(10,55,130,0.96) 0%, rgba(20,95,180,0.96) 55%, rgba(8,120,90,0.96) 100%)",
        paddingTop: "96px",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold">All Bookings</h1>
            <p className="text-sm text-white/80 mt-1">All bookings for venues you own.</p>
          </div>
          <div className="flex gap-3">
           <Link to="/owner/dashboard"
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white  transition font-semibold shadow-md no-underline"> Back to Dashboard
          </Link> 
          </div>
        </div>

        {err && <div className="mb-4 text-red-300">{err}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/6 border border-white/10 rounded-2xl p-4">
            <div className="text-sm text-white/80">Total bookings</div>
            <div className="mt-2 text-2xl font-extrabold text-white">{total}</div>
          </div>
          <div className="bg-white/6 border border-white/10 rounded-2xl p-4">
            <div className="text-sm text-white/80">Revenue</div>
            <div className="mt-2 text-2xl font-extrabold text-white">₹{revenue.toFixed(2)}</div>
          </div>
          <div className="bg-white/6 border border-white/10 rounded-2xl p-4">
            <div className="text-sm text-white/80">Venues</div>
            <div className="mt-2 text-2xl font-extrabold text-white">{[...new Set(bookings.map(b => b.venue_name))].length}</div>
          </div>
        </div>

        <section className="bg-white/6 border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4">Bookings</h2>

          {loading ? (
            <div className="py-10 text-center text-white/70">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="py-6 text-white/70">No bookings yet.</div>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <li key={b.id} className="bg-white/5 p-4 rounded-xl border border-white/8 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="min-w-[220px]">
                      <div className="text-md font-semibold">{b.venue_name || "Venue"}</div>
                      <div className="text-sm text-white/70 mt-1">{b.user_email || "Unknown user"}</div>
                    </div>

                    <div className="min-w-[260px]">
                      <div className="text-sm text-white/80">{b.date}</div>
                      <div className="text-sm text-white/70 mt-1">{b.time}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold">₹{(Number(b.amount) || 0).toFixed(0)}</div>
                    <div className="text-sm text-white/60 mt-1">{b.status || "—"}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
