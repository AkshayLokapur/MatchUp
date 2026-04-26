import React, { useState } from "react";
import api from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function OwnerCreateVenue() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    sports_available: "",
    city: "",
    address: "",
    price_per_hour: "",
    image: "",
  });

  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setMsg("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const payload = {
        ...form,
          sports_available: form.sports_available.split(",").map(s => s.trim()).filter(Boolean),
        price_per_hour: Number(form.price_per_hour),
      };

      await api.post("/owners/venues", payload);
      setMsg("✅ Venue created successfully!");

      setTimeout(() => navigate("/owner/venues"), 1200);
   } catch (err) {
  const detail = err?.response?.data?.detail;

  if (Array.isArray(detail)) {
    // Extract readable validation messages
    setMsg(detail.map(e => e.msg).join(", "));
  } else if (typeof detail === "string") {
    setMsg(detail);
  } else {
    setMsg("❌ Failed to create venue. Please check inputs.");
  }
}

  };

  return (
    <div
      className="min-h-screen p-6 text-white"
      style={{
        background:
          "linear-gradient(90deg, rgba(10,55,130,0.96) 0%, rgba(20,95,180,0.96) 55%, rgba(8,120,90,0.96) 100%)",
        paddingTop: "96px",
      }}
    >
      <div className="mx-auto w-full max-w-2xl bg-white/10 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/20">
        <h1 className="text-3xl font-extrabold mb-6">Add New Venue</h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Venue Name"
            className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-300"
            required
          />

          <input
            type="text"
            name="sports_available"
            value={form.sports_available}
            onChange={handleChange}
            placeholder="Sports (football, cricket, badminton...)"
            className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-300"
            required
          />

          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-300"
            required
          />

          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Full Address"
            className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-300"
          />

          <input
            type="number"
            name="price_per_hour"
            value={form.price_per_hour}
            onChange={handleChange}
            placeholder="Price per hour (₹)"
            className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-300"
            required
          />

          <input
            type="text"
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="Image URL (optional)"
            className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-300"
          />

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow"
          >
            Create Venue
          </button>
        </form>

        {msg && <p className="text-center mt-4 text-blue-200 font-medium">{msg}</p>}
      </div>
    </div>
  );
}
