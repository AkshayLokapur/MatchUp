// src/components/OwnerVenues.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";

export default function OwnerVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/owners/venues");
        setVenues(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Error loading venues:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold fs-2 text-white">My Venues</h1>

          <Link
            to="/owner/venues/new"
            className="btn btn-light fw-semibold px-4 py-2"
            style={{ color: "#0b2346" }}
          >
            Add Venue
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-white-50 fs-5">Loading venues...</div>
        ) : venues.length === 0 ? (
          <div className="bg-white bg-opacity-10 border border-white-20 rounded-3 p-5 text-center">
            <p className="text-white fs-5 mb-2">No venues added yet.</p>
            <Link to="/owner/venues/new" className="text-white text-decoration-underline">
              Add your first venue
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {venues.map((v) => (
              <div key={v.id} className="col-md-6">

                <div className="d-flex p-3 rounded-3 bg-white bg-opacity-10 border border-white-20 shadow">

                  {/* Image */}
                  <div
                    className="rounded-2 overflow-hidden me-3"
                    style={{ width: "110px", height: "90px", background: "rgba(255,255,255,0.1)" }}
                  >
                    {v.image ? (
                      <img
                        src={v.image}
                        alt={v.name}
                        className="w-100 h-100 object-fit-cover"
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white-50">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-grow-1 text-white">
                    <h4 className="fs-5 fw-bold">{v.name}</h4>
                    <p className="text-white-50 mb-1">
                      {v.city} {v.address ? `• ${v.address}` : ""}
                    </p>
                    <p className="text-white-50">₹{v.price_per_hour}/hour</p>

                    {/* Buttons */}
                    <div className="mt-2">

                      {/* FINAL MANAGE BUTTON – no underline, clean UI */}
                      <Link
                        to={`/owner/venues/${v.id}/manage`}
                        className="btn btn-primary fw-semibold px-3 py-1"
                        style={{
                          borderRadius: "8px",
                          textDecoration: "none",
                        }}
                      >
                        Manage
                      </Link>

                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
