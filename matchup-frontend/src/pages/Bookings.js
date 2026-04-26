import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

function Bookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    axiosInstance
      .get("/bookings")
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Helper: parse ISO that may be naive (no timezone) as UTC
  function parsePossiblyNaiveISO(s) {
    if (!s) return null;

    // If it's already a Date object (unlikely from JSON) return it
    if (s instanceof Date) return s;

    // If string has Z or timezone offset like +05:30 or -04:00, let Date parse it
    if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(s)) {
      const dt = new Date(s);
      return isNaN(dt) ? null : dt;
    }

    // If it's a plain date YYYY-MM-DD, treat as UTC midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const dt = new Date(s + "T00:00:00Z");
      return isNaN(dt) ? null : dt;
    }

    // Otherwise append 'Z' to force UTC
    const dt = new Date(s + "Z");
    return isNaN(dt) ? null : dt;
  }

  const formatTime = (t) => {
    if (!t) return "—";
    const dt = parsePossiblyNaiveISO(t);
    if (!dt) return "—";
    return dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (d) => {
    if (!d) return "—";
    // If date is already simple YYYY-MM-DD, show local date for that day
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const dt = new Date(d + "T00:00:00Z");
      return dt.toLocaleDateString();
    }
    const dt = parsePossiblyNaiveISO(d);
    if (!dt) return "—";
    return dt.toLocaleDateString();
  };

  return (
    <div className="min-h-screen p-6 text-white">
      <h1 className="text-3xl font-extrabold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <p className="text-blue-100 text-lg">No bookings yet.</p>
      ) : (
        <ul className="space-y-6">
          {bookings.map((b) => {
            // Extract sport
            const sport =
              b.sport ||
              b.game?.sport ||
              b.match?.sport ||
              "Unknown";

            // Extract start & end times
            const start =
              b.start_time ||
              b.game?.start_time ||
              b.match?.start_time;

            const end =
              b.end_time ||
              b.game?.end_time ||
              b.match?.end_time;

            return (
              <li
                key={b.id}
                className="
                  bg-white/10 
                  backdrop-blur 
                  p-6 
                  rounded-2xl 
                  border border-white/20 
                  shadow-xl 
                  hover:shadow-2xl 
                  hover:-translate-y-1 
                  transition
                "
              >
                {/* Venue */}
                <p className="text-lg">
                  <span className="font-bold text-green-300">Venue:</span>{" "}
                  <span className="text-white">{b.venue_name || "—"}</span>
                </p>

                {/* Sport */}
                <p className="mt-2 text-lg">
                  <span className="font-bold text-green-300">Sport:</span>{" "}
                  <span className="text-white capitalize">{sport}</span>
                </p>

                {/* Date */}
                <p className="mt-2 text-lg">
                  <span className="font-bold text-green-300">Date:</span>{" "}
                  <span className="text-white">{formatDate(b.date)}</span>
                </p>

                {/* Time Range */}
                <p className="mt-2 text-lg">
                  <span className="font-bold text-green-300">Time:</span>{" "}
                  <span className="text-white">
                    {formatTime(start)} – {formatTime(end)}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Bookings;
