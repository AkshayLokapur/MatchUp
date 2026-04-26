// src/pages/Matches.js
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axiosInstance";
import Modal from "../components/Modal";

/**
 * Matches page — same behaviour as before, updated visuals:
 * - Gradient background (matches Home)
 * - Translucent cards with white borders and green CTAs
 * - Text colors adjusted for contrast
 */

function MatchCard({ match, onJoinClick }) {
  const start = new Date(match.start_time);
  const end = new Date(match.end_time);

  return (
    <article className="
      bg-white/10 backdrop-blur-lg border border-white/20
      rounded-2xl p-6 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5
      text-white
    ">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold capitalize">
            {match.sport} {match.format ? `• ${match.format}` : ""}
          </h3>
          <p className="text-blue-100 mt-2 text-sm">
            {start.toLocaleDateString()} •{" "}
            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>

          <div className="mt-3 text-blue-100 text-sm">
            Venue: <span className="text-white font-medium">{match.venue_name || (match.venue && match.venue.name) || "TBA"}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className={`text-xs px-2 py-1 rounded-full ${match.is_public ? "bg-green-300 text-green-900" : "bg-slate-300 text-slate-900"}`}>
            {match.is_public ? "Public" : "Private"}
          </span>

          <div className="text-blue-100 text-sm">Capacity: <span className="font-semibold text-white">{match.capacity}</span></div>

          <div className="text-lg font-semibold text-green-300">₹{match.price_per_player}</div>
        </div>
      </div>

      <button
        onClick={() => onJoinClick(match)}
        className="mt-5 w-full inline-flex items-center justify-center rounded-lg bg-green-400 text-green-900 py-2 font-semibold hover:bg-green-300 transition shadow"
      >
        Join Match
      </button>
    </article>
  );
}

export default function Matches() {
  const [all, setAll] = useState([]);
  const [sport, setSport] = useState("");
  const [selected, setSelected] = useState(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load matches from backend on mount (and refresh after join)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.get("/games");
        if (mounted) setAll(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setAll([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Filter by sport (client-side)
  const filtered = useMemo(() => {
    return all.filter((m) =>
      sport ? (m.sport || "").toLowerCase().includes(sport.toLowerCase()) : true
    );
  }, [all, sport]);

  // Join action -> POST /games/:id/join
  const confirmJoin = async () => {
    if (!selected) return;
    setJoining(true);
    setError("");
    try {
      await api.post(`/games/${selected.id}/join`);
      setSelected(null);
      // refresh list
      const { data } = await api.get("/games");
      setAll(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to join match");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 text-white pt-10 pb-20">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Error / empty / loading states */}
        {error && <div className="mb-6 text-sm text-red-300">{error}</div>}

        {loading ? (
          <div className="text-center py-20 text-blue-100">Loading matches…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-blue-100">
            No matches found. Try another sport or <a href="/create-match" className="text-green-300 underline">create a match</a>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m) => (
              <MatchCard key={m.id} match={m} onJoinClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {/* Join modal */}
      <Modal
        open={!!selected}
        title={selected ? `Join ${selected.sport}${selected.format ? ` • ${selected.format}` : ""}` : ""}
        onClose={() => { setSelected(null); setError(""); }}
        onAction={confirmJoin}
        actionText="Join"
        loading={joining}
      >
        {selected && (
          <div className="space-y-3">
            <p className="text-blue-900">You’re about to join this match.</p>
            <p className="text-sm text-blue-700">Starts at: {new Date(selected.start_time).toLocaleString()}</p>
            <p className="text-sm text-blue-700">Price per seat: ₹{selected.price_per_player}</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
