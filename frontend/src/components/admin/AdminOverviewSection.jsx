import { BACKEND_URL } from "../../api/axios.js";
import AdminStatCard from "./AdminStatCard.jsx";
import {
  dashboardStats,
  formatCurrency,
  formatDate
} from "./adminConfig.js";
import { formatNaira } from "../../utils/propertyListing.js";

function getStatValue(stats, config) {
  if (config.money) {
    return formatCurrency(stats[config.key] / 100);
  }

  return stats[config.key];
}

function getStatNote(stats, config) {
  if (config.note) {
    return config.note;
  }

  if (config.noteKey) {
    return `${config.notePrefix || ""}${stats[config.noteKey]}${config.noteSuffix || ""}`;
  }

  return "";
}

export default function AdminOverviewSection({
  dashboardError,
  dashboardLoading,
  overview
}) {
  if (dashboardLoading) {
    return <div className="status-card">Loading admin dashboard...</div>;
  }

  return (
    <>
      {dashboardError ? <div className="status-card error">{dashboardError}</div> : null}

      <div className="grid stats-grid admin-stats-grid">
        {dashboardStats.map((config) => (
          <AdminStatCard
            key={config.key}
            icon={config.icon}
            label={config.label}
            value={getStatValue(overview.stats, config)}
            note={getStatNote(overview.stats, config)}
          />
        ))}
      </div>

      <div className="grid admin-overview-grid">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recent Listings</p>
              <h2>Latest property activity</h2>
            </div>
          </div>

          {overview.properties.length === 0 ? (
            <div className="status-card">No properties found.</div>
          ) : (
            <div className="dashboard-list">
              {overview.properties.map((property) => (
                <article key={property.id} className="listing-row">
                  {property.images[0] ? (
                    <img
                      src={`${BACKEND_URL}/uploads/${property.images[0]}`}
                      alt={property.type}
                    />
                  ) : (
                    <div className="empty-media admin-listing-empty">No image</div>
                  )}
                  <div className="listing-copy">
                    <div className="admin-user-heading">
                      <h3>{property.type}</h3>
                      <span className={`pill ${property.status}`}>{property.status}</span>
                      <span className={`pill ${property.listing_purpose}`}>{property.listing_purpose_label}</span>
                    </div>
                    <p>{property.location}</p>
                    <p>Landlord: {property.landlord_name || "Unknown"}</p>
                    <p>
                      Contact {property.contact_label}: {formatNaira(property.contact_fee_naira)}
                    </p>
                    <p>Unlocks: {property.unlocks_count}</p>
                  </div>
                  <div className="listing-actions">
                    <strong>{formatCurrency(property.price)}</strong>
                    <span>{formatDate(property.created_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recent Revenue</p>
              <h2>Successful payments</h2>
            </div>
          </div>

          {overview.recentTransactions.length === 0 ? (
            <div className="status-card">No successful transactions yet.</div>
          ) : (
            <div className="dashboard-list">
              {overview.recentTransactions.map((transaction) => (
                <article key={transaction.id} className="listing-row compact">
                  <div className="listing-copy">
                    <h3>{formatCurrency(transaction.amount_paid / 100)}</h3>
                    <p>{transaction.property_type || "Property removed"}</p>
                    <p>Renter: {transaction.renter_name || "Unknown"}</p>
                    <p>Reference: {transaction.reference}</p>
                  </div>

                  <div className="listing-actions">
                    <span className="pill available">success</span>
                    <span>{formatDate(transaction.paid_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
