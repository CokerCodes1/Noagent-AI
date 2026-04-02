import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../api/axios.js";
import DashboardHeader from "../components/DashboardHeader.jsx";
import { clearAuthSession, getStoredUser } from "../utils/session.js";

export default function AdminDashboard() {
  const [overview, setOverview] = useState({
    stats: {
      users: 0,
      properties: 0,
      availableProperties: 0,
      rentedProperties: 0,
      revenue: 0
    },
    properties: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getStoredUser();

  useEffect(() => {
    async function loadOverview() {
      try {
        const response = await api.get("/admin/overview");
        setOverview(response.data);
      } catch (requestError) {
        const message = extractErrorMessage(requestError);
        setError(message);
        toast.error(message);

        if (requestError.response?.status === 401) {
          clearAuthSession();
        }
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  return (
    <div className="dashboard-shell">
      <section className="dashboard-section">
        <DashboardHeader
          title={`Operations overview for ${user?.name || "Admin"}`}
          subtitle="Monitor users, listings, and revenue from one place, with a clear logout path when you are done."
        />

        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>Operations overview for {user?.name || "Admin"}</h1>
          </div>
          <p>Visibility across users, listings, and contact unlock revenue.</p>
        </div>

        {error ? <div className="status-card error">{error}</div> : null}

        {loading ? (
          <div className="status-card">Loading admin overview...</div>
        ) : (
          <>
            <div className="grid stats-grid">
              <div className="card stat-card">
                <p>Users</p>
                <strong>{overview.stats.users}</strong>
              </div>
              <div className="card stat-card">
                <p>Total Properties</p>
                <strong>{overview.stats.properties}</strong>
              </div>
              <div className="card stat-card">
                <p>Available</p>
                <strong>{overview.stats.availableProperties}</strong>
              </div>
              <div className="card stat-card">
                <p>Rented</p>
                <strong>{overview.stats.rentedProperties}</strong>
              </div>
              <div className="card stat-card">
                <p>Revenue</p>
                <strong>N{Number(overview.stats.revenue / 100).toLocaleString()}</strong>
              </div>
            </div>

            <div className="section-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Property Activity</p>
                  <h2>All listings</h2>
                </div>
              </div>

              {overview.properties.length === 0 ? (
                <div className="status-card">No properties found.</div>
              ) : (
                <div className="dashboard-list">
                  {overview.properties.map((property) => (
                    <article key={property.id} className="listing-row compact">
                      <div className="listing-copy">
                        <h3>{property.type}</h3>
                        <p>{property.location}</p>
                        <p>Landlord: {property.landlord_name || "Unknown"}</p>
                      </div>

                      <div className="listing-actions">
                        <span className={`pill ${property.status}`}>
                          {property.status}
                        </span>
                        <strong>N{Number(property.price).toLocaleString()}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
