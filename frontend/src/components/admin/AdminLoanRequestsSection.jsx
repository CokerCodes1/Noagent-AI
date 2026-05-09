import { motion as Motion } from "framer-motion";
import { useState } from "react";
import usePagination from "../../hooks/usePagination.js";
import PaginationControls from "../shared/PaginationControls.jsx";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import {
  FiSearch,
  FiTrash2,
  FiPhone,
  FiMapPin,
  FiUser,
  FiBriefcase,
  FiCalendar,
} from "react-icons/fi";
import { formatCurrency, formatDate } from "./adminConfig.js";

const loanTypeLabels = {
  land_acquisition: "Land Acquisition",
  building_project: "Building Project",
  house_rent: "House Rent",
};

const loanTypeColors = {
  land_acquisition: "sale",
  building_project: "neutral",
  house_rent: "rent",
};

export default function AdminLoanRequestsSection({
  loanRequests,
  loanRequestsError,
  loanRequestsLoading,
  deletingRequestId,
  handleDeleteRequest,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredRequests = loanRequests.filter((request) => {
    const matchesSearch =
      searchQuery === "" ||
      request.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone?.includes(searchQuery) ||
      request.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || request.loanType === filterType;
    return matchesSearch && matchesType;
  });
  const requestsPagination = usePagination(filteredRequests, {
    resetKey: `${searchQuery.trim().toLowerCase()}-${filterType}`
  });

  if (loanRequestsLoading) {
    return <div className="status-card">Loading loan requests...</div>;
  }

  return (
    <>
      {loanRequestsError ? (
        <div className="status-card error">{loanRequestsError}</div>
      ) : null}

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Loan Support</p>
            <h2>Loan Support Requests</h2>
          </div>
        </div>

        <div
          className="hero-search"
          style={{ marginTop: "1.25rem", marginBottom: "1.5rem" }}
        >
          <div className="input-shell">
            <FiSearch className="input-icon" />
            <input
              type="text"
              placeholder="Search by name, phone, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="input-shell">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Loan Types</option>
              <option value="land_acquisition">Land Acquisition</option>
              <option value="building_project">Building Project</option>
              <option value="house_rent">House Rent</option>
            </select>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="admin-empty-state">
            <p>No loan requests found.</p>
            {searchQuery || filterType !== "all" ? (
              <p className="form-hint">
                Try adjusting your search or filter criteria.
              </p>
            ) : (
              <p className="form-hint">
                Loan applications will appear here when submitted.
              </p>
            )}
          </div>
        ) : (
          <>
            <PaginatedContent
              className="testimonial-admin-grid"
              pageKey={`loan-requests-${requestsPagination.currentPage}`}
            >
              {requestsPagination.pageItems.map((request, index) => (
              <Motion.article
                key={request.id}
                className="testimonial-admin-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="testimonial-admin-card-head">
                  <div className="testimonial-admin-avatar">
                    {request.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3>{request.name}</h3>
                    <span
                      className={`pill ${loanTypeColors[request.loanType]}`}
                    >
                      {loanTypeLabels[request.loanType]}
                    </span>
                  </div>
                </div>

                <div className="testimonial-admin-copy">
                  <div
                    className="listing-tag-row"
                    style={{ marginTop: "0.75rem" }}
                  >
                    <FiPhone style={{ opacity: 0.65, fontSize: "0.9rem" }} />
                    <span>{request.phone || "Not provided"}</span>
                  </div>

                  <div className="listing-tag-row">
                    <FiMapPin style={{ opacity: 0.65, fontSize: "0.9rem" }} />
                    <span>{request.address || "Not provided"}</span>
                  </div>

                  <div className="listing-tag-row">
                    <FiBriefcase
                      style={{ opacity: 0.65, fontSize: "0.9rem" }}
                    />
                    <span>{request.occupation || "Not provided"}</span>
                  </div>

                  <div className="listing-tag-row">
                    <FiUser style={{ opacity: 0.65, fontSize: "0.9rem" }} />
                    <span>
                      Landlord: {request.landlordName || "Not provided"}
                    </span>
                  </div>

                  {request.monthlyIncome > 0 && (
                    <div className="listing-tag-row">
                      <span
                        style={{ fontWeight: 600, color: "var(--accent-dark)" }}
                      >
                        Income: {formatCurrency(request.monthlyIncome)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="testimonial-admin-footer">
                  <small>
                    <FiCalendar
                      style={{ marginRight: "0.35rem", opacity: 0.65 }}
                    />
                    {formatDate(request.createdAt)}
                  </small>

                  <div className="action-buttons">
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => handleDeleteRequest(request)}
                      disabled={deletingRequestId === request.id}
                      title="Delete request"
                    >
                      {deletingRequestId === request.id ? (
                        <span>Deleting...</span>
                      ) : (
                        <FiTrash2 />
                      )}
                    </button>
                  </div>
                </div>
              </Motion.article>
              ))}
            </PaginatedContent>

            <PaginationControls
              currentPage={requestsPagination.currentPage}
              endIndex={requestsPagination.endIndex}
              goToNextPage={requestsPagination.goToNextPage}
              goToPage={requestsPagination.goToPage}
              goToPreviousPage={requestsPagination.goToPreviousPage}
              label="requests"
              pageNumbers={requestsPagination.pageNumbers}
              startIndex={requestsPagination.startIndex}
              totalItems={requestsPagination.totalItems}
              totalPages={requestsPagination.totalPages}
            />
          </>
        )}
      </div>

      <style>{`
        .admin-empty-state {
          padding: 3rem 1.5rem;
          text-align: center;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.5);
          border-radius: 24px;
        }
        .admin-empty-state p {
          margin: 0;
          color: var(--muted-strong);
        }
        .form-hint {
          color: var(--muted);
          font-size: 0.95rem;
          margin-top: 0.35rem;
        }
      `}</style>
    </>
  );
}
