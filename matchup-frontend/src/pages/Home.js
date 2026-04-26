// src/pages/Home.js
import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";

/* AnimatedNumber – unchanged */
function AnimatedNumber({ value = 0, duration = 800 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start;
    const v = Number(value) || 0;
    if (v === 0) {
      setDisplay(0);
      return;
    }

    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round(progress * v));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{display}</span>;
}

/* SPORTS LIST */
const SPORTS = [
  { id: "football", name: "Football", emoji: "⚽", desc: "5-a-side, 7-a-side and pickup matches." },
  { id: "badminton", name: "Badminton", emoji: "🏸", desc: "Singles & doubles games at local courts." },
  { id: "cricket", name: "Cricket", emoji: "🏏", desc: "Turf and mat matches: join or host." },
  { id: "basketball", name: "Basketball", emoji: "🏀", desc: "Court bookings and pickup games." },
  { id: "tennis", name: "Tennis", emoji: "🎾", desc: "Singles/doubles matches and coaching." },
];

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ hosted: 0, joined: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/users/me/stats");
        const d = res.data || {};
        setStats({
          hosted: d.hosted ?? 0,
          joined: d.joined ?? 0,
          upcoming: d.upcoming ?? 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ✅ CORRECT LINK — GO TO VENUES */
  const venueLink = (sport) =>
    `/venues?sport=${encodeURIComponent(sport)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 text-white">

      {/* HERO */}
      <section className="pt-12 pb-10 text-center">
        <h1 className="text-5xl font-extrabold">
          Welcome to <span className="text-green-300">MatchUp</span>
        </h1>
        <p className="mt-4 text-blue-100 text-lg">
          Choose a sport to find available venues near you.
        </p>
      </section>

      {/* SPORTS GRID */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-4">Popular sports</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SPORTS.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl p-6 bg-white/10 border border-white/20"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{s.emoji}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{s.name}</h3>
                    <p className="text-sm text-blue-100">{s.desc}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  {/* ✅ THIS IS THE IMPORTANT BUTTON */}
                  <Link
                    to={venueLink(s.id)}
                    className="px-4 py-2 rounded-lg bg-green-400 text-green-900 font-semibold hover:bg-green-300 transition"
                    style={{ textDecoration: "none" }}
                  >
                    Find Venues
                  </Link>

                  <Link
                    to={`/create-match?sport=${encodeURIComponent(s.id)}`}
                    className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                    style={{ textDecoration: "none" }}
                  >
                    Host Game
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 p-6 rounded-xl">
            <div className="text-sm text-blue-100">Matches Hosted</div>
            <div className="text-3xl font-bold">
              {loading ? "—" : <AnimatedNumber value={stats.hosted} />}
            </div>
          </div>

          <div className="bg-white/10 p-6 rounded-xl">
            <div className="text-sm text-blue-100">Venues Visited</div>
            <div className="text-3xl font-bold">
              {loading ? "—" : <AnimatedNumber value={stats.joined} />}
            </div>
          </div>

          <div className="bg-white/10 p-6 rounded-xl">
            <div className="text-sm text-blue-100">Upcoming Games</div>
            <div className="text-3xl font-bold">
              {loading ? "—" : <AnimatedNumber value={stats.upcoming} />}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
