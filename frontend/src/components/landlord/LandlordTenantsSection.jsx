import { buildWhatsAppMessageLink } from "../../utils/whatsapp.js";
import usePagination from "../../hooks/usePagination.js";
import { formatNaira } from "../../utils/propertyListing.js";
import EmptyStateCard from "../shared/EmptyStateCard.jsx";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";

export default function LandlordTenantsSection({
  form,
  tenants,
  editingTenantId,
  onChange,
  onDelete,
  onEdit,
  onSubmit,
  onReset,
  submitting,
  messageTemplate,
  setMessageTemplate
}) {
  const tenantsPagination = usePagination(tenants);

  function messageAllTenants() {
    tenants.forEach((tenant) => {
      const link = buildWhatsAppMessageLink(tenant.whatsapp || tenant.phone, messageTemplate);

      if (link) {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    });
  }

  return (
    <div className="grid admin-management-grid">
      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tenants</p>
            <h2>{editingTenantId ? "Edit tenant" : "Add tenant"}</h2>
          </div>
        </div>

        <form className="property-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input value={form.name} onChange={(event) => onChange("name", event.target.value)} required />
            </label>

            <label>
              <span>Phone</span>
              <input value={form.phone} onChange={(event) => onChange("phone", event.target.value)} required />
            </label>

            <label>
              <span>WhatsApp</span>
              <input value={form.whatsapp} onChange={(event) => onChange("whatsapp", event.target.value)} />
            </label>

            <label>
              <span>Rent amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.rent_amount}
                onChange={(event) => onChange("rent_amount", event.target.value)}
                required
              />
            </label>

            <label>
              <span>Rent start date</span>
              <input
                type="date"
                value={form.rent_start_date}
                onChange={(event) => onChange("rent_start_date", event.target.value)}
                required
              />
            </label>

            <label>
              <span>Rent expiry date</span>
              <input
                type="date"
                value={form.rent_expiry_date}
                onChange={(event) => onChange("rent_expiry_date", event.target.value)}
                required
              />
            </label>

            <label>
              <span>Sanitation date</span>
              <input
                type="date"
                value={form.sanitation_date}
                onChange={(event) => onChange("sanitation_date", event.target.value)}
              />
            </label>
          </div>

          <div className="button-row">
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingTenantId ? "Save Tenant" : "Add Tenant"}
            </button>
            {editingTenantId ? (
              <button className="btn secondary" type="button" onClick={onReset}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Contacts</p>
            <h2>{tenants.length} tenants</h2>
          </div>
        </div>

        <label>
          <span>Bulk WhatsApp message</span>
          <textarea
            rows="3"
            value={messageTemplate}
            onChange={(event) => setMessageTemplate(event.target.value)}
            placeholder="Hello, this is a quick update from your landlord..."
          />
        </label>

        <div className="button-row">
          <button className="btn secondary" type="button" onClick={messageAllTenants} disabled={tenants.length === 0}>
            Message All Tenants
          </button>
        </div>

        {tenants.length === 0 ? (
          <EmptyStateCard
            title="No tenants added yet"
            description="Create tenant records from the form so you can send reminders, track rent dates, and organize contact history."
          />
        ) : (
          <>
            <PaginatedContent
              className="dashboard-list"
              pageKey={`tenants-${tenantsPagination.currentPage}`}
            >
              {tenantsPagination.pageItems.map((tenant) => (
                <article key={tenant.id} className="listing-row compact admin-user-row">
                  <div className="listing-row-content">
                    <div className="listing-row-header">
                      <div>
                        <h3>{tenant.name}</h3>
                        <p>{tenant.phone}</p>
                      </div>
                      {tenant.is_overdue ? (
                        <span className="pill rented">Overdue</span>
                      ) : (
                        <span className="pill available">Active</span>
                      )}
                    </div>

                    <div className="listing-row-meta">
                      <div className="listing-row-meta-item">
                        <span>Rent Amount</span>
                        <strong>{formatNaira(tenant.rent_amount)}</strong>
                      </div>
                      <div className="listing-row-meta-item">
                        <span>Expiry</span>
                        <strong>{tenant.rent_expiry_date}</strong>
                      </div>
                      <div className="listing-row-meta-item">
                        <span>Sanitation</span>
                        <strong>{tenant.sanitation_date || "Not assigned"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="listing-row-side">
                    <div className="listing-row-action-group admin-user-actions">
                      <a
                        className="btn secondary"
                        href={buildWhatsAppMessageLink(
                          tenant.whatsapp || tenant.phone,
                          messageTemplate
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Message
                      </a>
                      <button className="btn" type="button" onClick={() => onEdit(tenant)}>
                        Edit
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => onDelete(tenant)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </PaginatedContent>

            <PaginationControls
              currentPage={tenantsPagination.currentPage}
              endIndex={tenantsPagination.endIndex}
              goToNextPage={tenantsPagination.goToNextPage}
              goToPage={tenantsPagination.goToPage}
              goToPreviousPage={tenantsPagination.goToPreviousPage}
              label="tenants"
              pageNumbers={tenantsPagination.pageNumbers}
              startIndex={tenantsPagination.startIndex}
              totalItems={tenantsPagination.totalItems}
              totalPages={tenantsPagination.totalPages}
            />
          </>
        )}
      </div>
    </div>
  );
}
