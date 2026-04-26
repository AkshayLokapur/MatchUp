import React, { useState, useEffect } from "react";
import api from "../api/axiosInstance";

export default function CreateMatch() {
  const [venues, setVenues] = useState([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    sport: "",
    format: "",
    start_time: "",
    end_time: "",
    capacity: 10,
    price_per_player: 0,
    is_public: true,
    venue_id: "",
  });

  // Load venues
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/venues");
        setVenues(Array.isArray(data) ? data : []);
      } catch {
        setVenues([]);
      }
    })();
  }, []);

  const handleChange = (e) => {
    setMsg("");
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        price_per_player: Number(form.price_per_player),
      };

      await api.post("/games", payload);
      setMsg("✅ Match created successfully!");
      setForm({
        sport: "",
        format: "",
        start_time: "",
        end_time: "",
        is_public: true,
        venue_id: "",
      });
    } catch (error) {
      setMsg(error.response?.data?.detail || "❌ Failed to create match");
    }
  };

  return (
    <div
      className="min-h-screen p-6 text-white"
      style={{
        background:
          "linear-gradient(90deg, rgba(10,55,130,0.96) 0%, rgba(20,95,180,0.96) 55%, rgba(8,120,90,0.96) 100%)",
        paddingTop: "96px", // place below your sticky navbar
      }}
    >
      <div className="mx-auto w-full max-w-lg"> {/* reduced width */}
        <div
          className="bg-white/10 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/20"
          style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}
        >
          <h1 className="text-2xl md:text-3xl font-extrabold mb-5">Create a Match</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="sport"
              value={form.sport}
              onChange={handleChange}
              placeholder="Sport (e.g., football, cricket)"
              className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-300"
              required
            />

            <input
              type="text"
              name="format"
              value={form.format}
              onChange={handleChange}
              placeholder="Format (e.g., 5v5, box match)"
              className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-300"
            />

            <select
              name="venue_id"
              value={form.venue_id}
              onChange={handleChange}
              required
              className="w-full bg-white/95 text-slate-900 rounded-md px-3 py-2"
              style={{ appearance: "auto" }}
            >
              <option value="">Select Venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            <div>
              <label className="block text-sm mb-1 text-blue-200">Start Time</label>
              <input
                type="datetime-local"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-blue-200">End Time</label>
              <input
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white"
                required
              />
            </div>

            

            <label className="flex items-center gap-2 text-gray-200">
              <input
                type="checkbox"
                name="is_public"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                className="accent-blue-400"
              />
              Make Match Public
            </label>

            <button
              type="submit"
              className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow"
            >
              Create Match
            </button>
          </form>

          {msg && <p className="text-center mt-4 text-blue-200 font-medium">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
