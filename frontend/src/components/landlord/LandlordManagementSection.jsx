import { buildWhatsAppMessageLink } from "../../utils/whatsapp.js";
import usePagination from "../../hooks/usePagination.js";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";

export default function LandlordManagementSection({
  tenants,
  reminderMessage,
  setReminderMessage
}) {
  const overdueTenants = tenants.filter((tenant) => tenant.is_overdue);
  const sanitationTenants = tenants.filter((tenant) => tenant.sanitation_date);
  const overduePagination = usePagination(overdueTenants);

  function messageTenants(collection) {
    collection.forEach((tenant) => {
      const link = buildWhatsAppMessageLink(tenant.whatsapp || tenant.phone, reminderMessage);

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
            <p className="eyebrow">Rent Management</p>
            <h2>Due dates and reminders</h2>
          </div>
        </div>

        <label>
          <span>Reminder message</span>
          <textarea
            rows="4"
            value={reminderMessage}
            onChange={(event) => setReminderMessage(event.target.value)}
            placeholder="Hello, this is a friendly reminder that your rent is due..."
          />
        </label>

        <div className="button-row">
          <button
            className="btn primary"
            type="button"
            onClick={() => messageTenants(overdueTenants)}
            disabled={overdueTenants.length === 0}
          >
            Message Overdue Tenants
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => messageTenants(sanitationTenants)}
            disabled={sanitationTenants.length === 0}
          >
            Message Sanitation Schedule
          </button>
        </div>
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Attention Needed</p>
            <h2>{overdueTenants.length} overdue tenants</h2>
          </div>
        </div>

        {overdueTenants.length === 0 ? (
          <div className="status-card">No overdue tenants right now.</div>
        ) : (
          <>
            <PaginatedContent
              className="dashboard-list"
              pageKey={`overdue-tenants-${overduePagination.currentPage}`}
            >
              {overduePagination.pageItems.map((tenant) => (
              <article key={tenant.id} className="listing-row compact admin-user-row">
                <div className="listing-copy">
                  <div className="admin-user-heading">
                    <h3>{tenant.name}</h3>
                    <span className="pill rented">Overdue</span>
                  </div>
                  <p>Rent expiry: {tenant.rent_expiry_date}</p>
                  <p>Sanitation: {tenant.sanitation_date || "Not assigned"}</p>
                </div>

                <div className="listing-actions admin-user-actions">
                  <a
                    className="btn secondary"
                    href={buildWhatsAppMessageLink(tenant.whatsapp || tenant.phone, reminderMessage)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Send Reminder
                  </a>
                </div>
              </article>
              ))}
            </PaginatedContent>

            <PaginationControls
              currentPage={overduePagination.currentPage}
              endIndex={overduePagination.endIndex}
              goToNextPage={overduePagination.goToNextPage}
              goToPage={overduePagination.goToPage}
              goToPreviousPage={overduePagination.goToPreviousPage}
              label="overdue tenants"
              pageNumbers={overduePagination.pageNumbers}
              startIndex={overduePagination.startIndex}
              totalItems={overduePagination.totalItems}
              totalPages={overduePagination.totalPages}
            />
          </>
        )}
      </div>
    </div>
  );
}
