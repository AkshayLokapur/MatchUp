// src/components/VenueCard.js
import React, { useState } from "react";
import api from "../api/axiosInstance";

export default function VenueCard({ venue, onBooked }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="text-xl font-bold">{venue.name}</h3>
        <p className="text-gray-600">{venue.city}</p>
        <p className="mt-2 font-semibold text-blue-700">
          ₹{venue.price_per_hour}/hour
        </p>

        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={() => setOpen(true)}
        >
          Book Now
        </button>
      </div>

      {open && (
        <BookingModal
          venue={venue}
          onClose={() => setOpen(false)}
          onBooked={onBooked}
        />
      )}
    </>
  );
}

function BookingModal({ venue, onClose, onBooked }) {
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("7");
  const [endHour, setEndHour] = useState("8");

  // ✅ NEW: selected sport
  const [selectedSport, setSelectedSport] = useState(
    Array.isArray(venue.sports_available) && venue.sports_available.length > 0
      ? venue.sports_available[0]
      : ""
  );

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const duration = Number(endHour) - Number(startHour);
  const estimatedAmount =
    duration > 0 ? duration * venue.price_per_hour : 0;

  const handleConfirm = async () => {
    console.log("PAYMENT FLOW STARTED");
    setErr("");

    if (!date || duration <= 0) {
      setErr("Invalid date or time");
      return;
    }

    if (!selectedSport) {
      setErr("Please select a sport");
      return;
    }

    const start_time = new Date(
      `${date}T${startHour.padStart(2, "0")}:00:00`
    ).toISOString();

    const end_time = new Date(
      `${date}T${endHour.padStart(2, "0")}:00:00`
    ).toISOString();

    try {
      setLoading(true);
          // ✅ 1. Create Razorpay Order
    const orderRes = await api.post("/create-order", {
      amount: estimatedAmount,
    });

    const order = orderRes.data;

    // ✅ 2. Open Razorpay Popup
    const options = {
      key: "rzp_test_SVtaN9SiGN0DOD",
      amount: order.amount,
      currency: "INR",
      name: "MatchUp",
      description: "Venue Booking",
      order_id: order.id,

      handler: async function (response) {
        console.log("PAYMENT SUCCESS RESPONSE:", response);
        try {
          // ✅ 3. Verify payment + create booking
          await api.post("/verify-payment", {
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,

            venue_id: venue.id,
            sport: selectedSport,
            amount: estimatedAmount,
            start_time,
            end_time,
          });

          alert("Payment Successful 🎉");
          onBooked && onBooked();
          onClose();
        } catch (err) {
          setErr("Payment verification failed");
        }
      },
        modal: {
    ondismiss: function () {
      setErr("Payment cancelled");
    },
  },

      theme: {
        color: "#2563eb",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

    setLoading(false);
  } catch (e) {
    setLoading(false);
    setErr("Payment failed to start");
  }
};


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Book {venue.name}
        </h2>

        {/* ✅ SPORTS AVAILABLE */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Sport
          </label>
          <select
            className="w-full border rounded-md p-2"
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            {Array.isArray(venue.sports_available) &&
              venue.sports_available.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            className="w-full border rounded-md p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Start Hour
            </label>
            <input
              type="number"
              min="0"
              max="23"
              className="w-full border rounded-md p-2"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              End Hour
            </label>
            <input
              type="number"
              min="0"
              max="23"
              className="w-full border rounded-md p-2"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
            />
          </div>
        </div>

        <p className="mb-3 font-semibold">
          Estimated Amount: ₹{estimatedAmount}
        </p>

        {err && <p className="text-red-600 mb-3">{err}</p>}

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 border rounded-md"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
