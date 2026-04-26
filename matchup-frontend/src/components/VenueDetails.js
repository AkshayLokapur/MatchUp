// src/pages/VenueDetails.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";

export default function VenueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/venues/${id}`);
        setVenue(res.data);

        // auto-select first sport
        if (res.data?.sports_available?.length > 0) {
          setSelectedSport(res.data.sports_available[0]);
        }
      } catch (err) {
        console.error(err);
        navigate("/venues");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!venue) return <div className="p-6">Venue not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <img
        src={venue.image}
        alt={venue.name}
        className="w-full h-80 object-cover rounded-xl shadow mb-6"
      />

      <h1 className="text-3xl font-bold">{venue.name}</h1>

      <p className="text-gray-600">{venue.city}</p>

      <p className="text-blue-700 font-semibold text-xl mt-2">
        ₹{venue.price_per_hour}/hour
      </p>

      {/* ✅ AVAILABLE SPORTS */}
      <div className="mt-4">
        <p className="text-gray-700 font-semibold mb-1">
          Available Sports
        </p>

        <ul className="list-disc list-inside text-gray-700">
          {venue.sports_available.map((sport, idx) => (
            <li key={idx}>{sport}</li>
          ))}
        </ul>
      </div>

      {/* ✅ SPORT SELECTION */}
      <div className="mt-4">
        <label className="block text-gray-700 font-semibold mb-1">
          Select Sport
        </label>

        <select
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
        >
          {venue.sports_available.map((sport, idx) => (
            <option key={idx} value={sport}>
              {sport}
            </option>
          ))}
        </select>
      </div>

      {venue.address && (
        <p className="text-gray-600 mt-4">
          Address: {venue.address}
        </p>
      )}

      {/* NO LOGIC CHANGE */}
      <button
        className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        onClick={() => navigate("/venues")}
      >
        Back to Venues
      </button>
    </div>
  );
}
