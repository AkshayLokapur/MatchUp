// src/pages/OwnerManageVenue.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";

export default function OwnerManageVenue() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [vRes, bRes] = await Promise.all([
          api.get(`/owners/venues/${id}`),
          api.get(`/owners/venues/${id}/bookings`).catch(() => ({ data: [] })),
        ]);
        if (!mounted) return;
        setVenue(vRes.data);
        setBookings(Array.isArray(bRes.data) ? bRes.data : []);
      } catch (e) {
        console.error("Load error:", e);
        setMsg(e?.response?.data?.detail || "Failed to load venue");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVenue((s) => ({ ...s, [name]: value }));
  };

  const handleUpdate = async () => {
    setMsg("");
    try {
      const payload = {
        name: venue.name,
        sport: venue.sport,
        city: venue.city,
        address: venue.address,
        price_per_hour: Number(venue.price_per_hour || 0),
        image: venue.image || null,
      };
      await api.put(`/owners/venues/${id}`, payload);
      setMsg("✅ Venue updated");
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.detail || "Failed to update venue");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this venue? This cannot be undone.")) return;
    try {
      await api.delete(`/owners/venues/${id}`);
      window.alert("Venue deleted");
      navigate("/owner/venues");
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.detail || "Failed to delete venue");
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!venue) return <div style={{ padding: 40 }}>Venue not found.</div>;

  return (
    <div
      className="min-h-screen p-6 text-white"
      style={{
        background:
          "linear-gradient(90deg, rgba(10,55,130,0.96) 0%, rgba(20,95,180,0.96) 55%, rgba(8,120,90,0.96) 100%)",
        paddingTop: "96px",
      }}
    >
      <div className="mx-auto max-w-2xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Manage Venue</h2>

          {/* ---------------- Visible action buttons ---------------- */}
          <div className="flex gap-2 items-center">
            {/* View as user: more visible style */}
            <Link
              to={`/venues/${venue.id}`}
              className="inline-flex items-center px-4 py-2 rounded-md bg-white text-[#0b2346] font-semibold shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label={`View ${venue.name} as user`}
            >
              View as user
            </Link>

            {/* Delete: keep red but with clear contrast */}
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm">Name</label>
          <input
            name="name"
            value={venue.name || ""}
            onChange={handleChange}
            className="w-full p-2 rounded bg-transparent border border-white/20 text-white"
          />

          <label className="text-sm">Sport</label>
          <input
            name="sport"
            value={venue.sport || ""}
            onChange={handleChange}
            className="w-full p-2 rounded bg-transparent border border-white/20 text-white"
          />

          <label className="text-sm">City</label>
          <input
            name="city"
            value={venue.city || ""}
            onChange={handleChange}
            className="w-full p-2 rounded bg-transparent border border-white/20 text-white"
          />

          <label className="text-sm">Address</label>
          <input
            name="address"
            value={venue.address || ""}
            onChange={handleChange}
            className="w-full p-2 rounded bg-transparent border border-white/20 text-white"
          />

          <label className="text-sm">Price / hour</label>
          <input
            name="price_per_hour"
            value={venue.price_per_hour || ""}
            onChange={handleChange}
            type="number"
            className="w-full p-2 rounded bg-transparent border border-white/20 text-white"
          />

          <label className="text-sm">Image URL</label>
          <input
            name="image"
            value={venue.image || ""}
            onChange={handleChange}
            className="w-full p-2 rounded bg-transparent border border-white/20 text-white"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Update
            </button>
            <button
              onClick={() => navigate("/owner/venues")}
              className="px-4 py-2 border rounded-md bg-transparent hover:bg-white/5"
            >
              Back
            </button>
          </div>

          {msg && <div className="mt-3 text-sm text-yellow-200">{msg}</div>}
        </div>

        <hr className="my-5 border-white/10" />

        <div>
          <h3 className="text-lg font-semibold mb-3">Recent bookings for this venue</h3>
          {bookings.length === 0 ? (
            <div className="text-white/70">No bookings yet.</div>
          ) : (
            <ul className="space-y-2">
              {bookings.map((b) => (
                <li key={b.id} className="bg-white/5 p-3 rounded">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{b.user_email || "Unknown"}</div>
                      <div className="text-sm text-white/80">
                        {b.date}
                        {b.time ? ` • ${b.time}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div>₹{(Number(b.amount) || 0).toFixed(0)}</div>
                      <div className="text-sm text-white/70">{b.status}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
