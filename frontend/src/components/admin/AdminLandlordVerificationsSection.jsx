import { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiXCircle
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import { BACKEND_URL } from "../../api/axios.js";
import usePagination from "../../hooks/usePagination.js";
import EmptyStateCard from "../shared/EmptyStateCard.jsx";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";
import { formatDate } from "./adminConfig.js";

function resolveDocumentUrl(documentPath = "") {
  if (!documentPath) {
    return "";
  }

  if (/^https?:\/\//i.test(documentPath)) {
    return documentPath;
  }

  return `${BACKEND_URL}${documentPath}`;
}

function isPdfDocument(documentPath = "") {
  return String(documentPath || "").toLowerCase().endsWith(".pdf");
}

const filterOptions = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" }
];

export default function AdminLandlordVerificationsSection({
  applications,
  landlordVerificationsError,
  landlordVerificationsLoading,
  onDecision,
  updatingVerificationId
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [adminNotesById, setAdminNotesById] = useState({});

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        filterStatus === "all" ||
        application.verificationStatus === filterStatus;
      const matchesSearch =
        !normalizedQuery ||
        application.name.toLowerCase().includes(normalizedQuery) ||
        application.email.toLowerCase().includes(normalizedQuery) ||
        application.phone.toLowerCase().includes(normalizedQuery) ||
        application.propertyAddress.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesSearch;
    });
  }, [applications, filterStatus, searchQuery]);

  const applicationsPagination = usePagination(filteredApplications, {
    resetKey: `${searchQuery.trim().toLowerCase()}-${filterStatus}`
  });

  function updateAdminNotes(applicationId, value) {
    setAdminNotesById((currentValue) => ({
      ...currentValue,
      [applicationId]: value
    }));
  }

  async function handleDecision(application, verificationStatus) {
    await onDecision({
      adminNotes:
        adminNotesById[application.id] ?? application.verificationNotes ?? "",
      application,
      verificationStatus
    });
  }

  if (landlordVerificationsLoading) {
    return <div className="status-card">Loading landlord applications...</div>;
  }

  return (
    <>
      {landlordVerificationsError ? (
        <div className="status-card error">{landlordVerificationsError}</div>
      ) : null}

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Verification Queue</p>
            <h2>Landlord Applications</h2>
          </div>
          <p>
            Review ownership documents, add notes, and approve or reject
            landlord onboarding requests without affecting the rest of auth.
          </p>
        </div>

        <div className="hero-search landlord-verification-filters">
          <div className="input-shell">
            <FiSearch className="input-icon" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or address..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="auth-tabs auth-role-tabs landlord-verification-tabs">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={filterStatus === option.value ? "tab active" : "tab"}
                onClick={() => setFilterStatus(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <EmptyStateCard
            title="No landlord applications found"
            description={
              searchQuery || filterStatus !== "all"
                ? "Try a different search or status filter."
                : "Landlord registrations will appear here once new applications are submitted."
            }
          />
        ) : (
          <>
            <PaginatedContent
              className="landlord-verification-grid"
              pageKey={`landlord-verifications-${applicationsPagination.currentPage}`}
            >
              {applicationsPagination.pageItems.map((application) => {
                const documentUrl = resolveDocumentUrl(
                  application.verificationDocument
                );
                const pendingAction = updatingVerificationId === application.id;

                return (
                  <article
                    key={application.id}
                    className="testimonial-admin-card landlord-verification-card"
                  >
                    <div className="testimonial-admin-card-head landlord-verification-head">
                      <div className="testimonial-admin-avatar">
                        {application.name?.charAt(0)?.toUpperCase() || "L"}
                      </div>
                      <div className="loan-request-head-copy">
                        <h3>{application.name}</h3>
                        <p>{application.email}</p>
                      </div>
                      <span
                        className={`pill ${application.verificationStatus === "approved" ? "available" : application.verificationStatus === "rejected" ? "rented" : "sale"}`}
                      >
                        {application.verificationStatus}
                      </span>
                    </div>

                    <div className="landlord-verification-meta">
                      <div className="listing-tag-row">
                        <FiPhone className="loan-request-row-icon" />
                        <span>{application.phone || "No phone provided"}</span>
                      </div>
                      <div className="listing-tag-row">
                        <FaWhatsapp className="loan-request-row-icon" />
                        <span>
                          {application.whatsappNumber || "No WhatsApp provided"}
                        </span>
                      </div>
                      <div className="listing-tag-row">
                        <FiMapPin className="loan-request-row-icon" />
                        <span>
                          {application.propertyAddress || "No property address"}
                        </span>
                      </div>
                      <div className="listing-tag-row">
                        <FiClock className="loan-request-row-icon" />
                        <span>
                          Submitted{" "}
                          {formatDate(
                            application.verificationSubmittedAt ||
                              application.createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="landlord-verification-document">
                      <div className="landlord-verification-document-header">
                        <strong>Ownership Proof</strong>
                        {documentUrl ? (
                          <a
                            className="btn secondary"
                            href={documentUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FiFileText aria-hidden="true" />
                            Open Document
                          </a>
                        ) : null}
                      </div>

                      {documentUrl ? (
                        isPdfDocument(application.verificationDocument) ? (
                          <div className="landlord-verification-pdf">
                            <FiFileText aria-hidden="true" />
                            <span>PDF document uploaded</span>
                          </div>
                        ) : (
                          <img
                            src={documentUrl}
                            alt={`${application.name} verification document`}
                            className="landlord-verification-preview"
                          />
                        )
                      ) : (
                        <div className="landlord-verification-pdf">
                          <FiFileText aria-hidden="true" />
                          <span>No document uploaded</span>
                        </div>
                      )}
                    </div>

                    <label className="admin-field">
                      <span>Admin notes</span>
                      <textarea
                        rows="4"
                        value={
                          adminNotesById[application.id] ??
                          application.verificationNotes ??
                          ""
                        }
                        onChange={(event) =>
                          updateAdminNotes(application.id, event.target.value)
                        }
                        placeholder="Add context for the verification team or applicant."
                      />
                    </label>

                    <div className="listing-row-action-group">
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => handleDecision(application, "approved")}
                        disabled={pendingAction}
                      >
                        <FiCheckCircle aria-hidden="true" />
                        {pendingAction ? "Saving..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="btn danger"
                        onClick={() => handleDecision(application, "rejected")}
                        disabled={pendingAction}
                      >
                        <FiXCircle aria-hidden="true" />
                        {pendingAction ? "Saving..." : "Reject"}
                      </button>
                    </div>

                    {application.verifiedAt ? (
                      <p className="section-meta">
                        Reviewed on {formatDate(application.verifiedAt)}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </PaginatedContent>

            <PaginationControls
              currentPage={applicationsPagination.currentPage}
              endIndex={applicationsPagination.endIndex}
              goToNextPage={applicationsPagination.goToNextPage}
              goToPage={applicationsPagination.goToPage}
              goToPreviousPage={applicationsPagination.goToPreviousPage}
              label="applications"
              pageNumbers={applicationsPagination.pageNumbers}
              startIndex={applicationsPagination.startIndex}
              totalItems={applicationsPagination.totalItems}
              totalPages={applicationsPagination.totalPages}
            />
          </>
        )}
      </div>
    </>
  );
}
