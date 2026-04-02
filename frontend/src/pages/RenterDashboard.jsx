import { useEffect, useEffectEvent, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import api, { BACKEND_URL, extractErrorMessage } from "../api/axios.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import Hero from "../components/Hero.jsx";
import PropertyCard from "../components/PropertyCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { clearAuthSession, getStoredUser } from "../utils/session.js";

function applyFilters(properties, filters) {
  const locationFilter = filters.location?.trim().toLowerCase();
  const typeFilter = filters.type?.trim().toLowerCase();
  const maxPrice = filters.price ? Number(filters.price) : null;

  return properties.filter((property) => {
    const locationMatches = locationFilter
      ? property.location.toLowerCase().includes(locationFilter)
      : true;
    const typeMatches = typeFilter
      ? property.type.toLowerCase().includes(typeFilter)
      : true;
    const priceMatches = maxPrice ? Number(property.price) <= maxPrice : true;

    return locationMatches && typeMatches && priceMatches;
  });
}

export default function RenterDashboard() {
  const [allProperties, setAllProperties] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProperties() {
    try {
      setError("");
      const response = await api.get("/property");
      setAllProperties(response.data);
    } catch (requestError) {
      const message = extractErrorMessage(requestError);
      setError(message);

      if (requestError.response?.status === 401) {
        clearAuthSession();
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSocketRefresh = useEffectEvent((payload) => {
    if (payload?.message) {
      toast.info(payload.message);
    }

    loadProperties();
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"]
    });

    socket.on("new_property", handleSocketRefresh);
    socket.on("property_rented", handleSocketRefresh);

    return () => {
      socket.off("new_property", handleSocketRefresh);
      socket.off("property_rented", handleSocketRefresh);
      socket.disconnect();
    };
  }, []);

  const filteredProperties = applyFilters(allProperties, filters);
  const user = getStoredUser();

  return (
    <div className="dashboard-shell">
      <section className="dashboard-section">
        <DashboardHeader
          title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
          subtitle="Browse listings, unlock landlord contact after payment, and log out cleanly from the same screen."
        />
      </section>

      <Hero
        title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
        subtitle="Browse verified listings, unlock contact after payment, and get real-time updates when landlords post or mark properties as rented."
        onSearch={setFilters}
      />

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Renter Dashboard</p>
            <h2>Available Listings</h2>
          </div>
          <p>{filteredProperties.length} properties match your filters</p>
        </div>

        {error ? <div className="status-card error">{error}</div> : null}

        {loading ? (
          <div className="grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="status-card">No properties matched your current filters.</div>
        ) : (
          <div className="grid">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onPaymentStateChange={loadProperties}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
