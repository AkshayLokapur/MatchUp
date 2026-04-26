import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import VenueCard from "../components/VenueCard";
import { useSearchParams } from "react-router-dom";

function Venues() {
  const [venues, setVenues] = useState([]);
  const [searchParams] = useSearchParams();
  const sport = searchParams.get("sport");

  useEffect(() => {
    const url = sport ? `/venues?sport=${sport}` : "/venues";

    axiosInstance.get(url)
      .then((res) => setVenues(res.data))
      .catch((err) => console.error(err));
  }, [sport]);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {venues.map((v) => (
        <VenueCard key={v.id} venue={v} />
      ))}
    </div>
  );
}

export default Venues;
