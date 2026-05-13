import { BACKEND_URL } from "../../api/axios.js";
import usePagination from "../../hooks/usePagination.js";
import EmptyStateCard from "../shared/EmptyStateCard.jsx";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";
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
  const propertiesPagination = usePagination(overview.properties);
  const transactionsPagination = usePagination(overview.recentTransactions);

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
            <EmptyStateCard
              title="No recent listings yet"
              description="Once landlords or admins publish properties, the newest activity will appear here."
            />
          ) : (
            <>
              <PaginatedContent
                className="dashboard-list"
                pageKey={`overview-properties-${propertiesPagination.currentPage}`}
              >
                {propertiesPagination.pageItems.map((property, index) => (
                  <article key={property.id ?? `property-${index}`} className="listing-row">
                    <div className="listing-row-media">
                      {property.images[0] ? (
                        <img
                          src={`${BACKEND_URL}/uploads/${property.images[0]}`}
                          alt={property.type}
                        />
                      ) : (
                        <div className="empty-media admin-listing-empty">No image</div>
                      )}
                    </div>
                    <div className="listing-row-content">
                      <div className="listing-row-header">
                        <div>
                          <h3>{property.type}</h3>
                          <p>{property.location}</p>
                        </div>
                        <strong className="listing-row-price">
                          {formatCurrency(property.price)}
                        </strong>
                      </div>
                      <div className="listing-tag-row">
                        <span className={`pill ${property.status}`}>{property.status}</span>
                        <span className={`pill ${property.listing_purpose}`}>
                          {property.listing_purpose_label}
                        </span>
                      </div>
                      <div className="listing-row-meta">
                        <div className="listing-row-meta-item">
                          <span>Landlord</span>
                          <strong>{property.landlord_name || "Unknown"}</strong>
                        </div>
                        <div className="listing-row-meta-item">
                          <span>Contact Fee</span>
                          <strong>
                            Contact {property.contact_label}:{" "}
                            {formatNaira(property.contact_fee_naira)}
                          </strong>
                        </div>
                        <div className="listing-row-meta-item">
                          <span>Unlocks</span>
                          <strong>{property.unlocks_count}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="listing-row-side">
                      <div className="listing-actions">
                        <strong>{formatDate(property.created_at)}</strong>
                        <span className="section-meta">Recently created listing</span>
                      </div>
                    </div>
                  </article>
                ))}
              </PaginatedContent>

              <PaginationControls
                currentPage={propertiesPagination.currentPage}
                endIndex={propertiesPagination.endIndex}
                goToNextPage={propertiesPagination.goToNextPage}
                goToPage={propertiesPagination.goToPage}
                goToPreviousPage={propertiesPagination.goToPreviousPage}
                label="listings"
                pageNumbers={propertiesPagination.pageNumbers}
                startIndex={propertiesPagination.startIndex}
                totalItems={propertiesPagination.totalItems}
                totalPages={propertiesPagination.totalPages}
              />
            </>
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
            <EmptyStateCard
              title="No successful transactions yet"
              description="Completed renter unlock payments will begin appearing here automatically."
            />
          ) : (
            <>
              <PaginatedContent
                className="dashboard-list"
                pageKey={`overview-transactions-${transactionsPagination.currentPage}`}
              >
                {transactionsPagination.pageItems.map((transaction, index) => (
                  <article
                    key={transaction.id ?? `transaction-${index}`}
                    className="listing-row compact"
                  >
                    <div className="listing-row-content">
                      <div className="listing-row-header">
                        <div>
                          <h3>{formatCurrency(transaction.amount_paid / 100)}</h3>
                          <p>{transaction.property_type || "Property removed"}</p>
                        </div>
                        <span className="pill available">success</span>
                      </div>
                      <div className="listing-row-meta">
                        <div className="listing-row-meta-item">
                          <span>Renter</span>
                          <strong>{transaction.renter_name || "Unknown"}</strong>
                        </div>
                        <div className="listing-row-meta-item">
                          <span>Reference</span>
                          <strong>{transaction.reference}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="listing-row-side">
                      <div className="listing-actions">
                        <strong>{formatDate(transaction.paid_at)}</strong>
                        <span className="section-meta">Payment completed</span>
                      </div>
                    </div>
                  </article>
                ))}
              </PaginatedContent>

              <PaginationControls
                currentPage={transactionsPagination.currentPage}
                endIndex={transactionsPagination.endIndex}
                goToNextPage={transactionsPagination.goToNextPage}
                goToPage={transactionsPagination.goToPage}
                goToPreviousPage={transactionsPagination.goToPreviousPage}
                label="transactions"
                pageNumbers={transactionsPagination.pageNumbers}
                startIndex={transactionsPagination.startIndex}
                totalItems={transactionsPagination.totalItems}
                totalPages={transactionsPagination.totalPages}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
