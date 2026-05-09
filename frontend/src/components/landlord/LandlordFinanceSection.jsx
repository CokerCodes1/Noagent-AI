import usePagination from "../../hooks/usePagination.js";
import { formatNaira } from "../../utils/propertyListing.js";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";

export default function LandlordFinanceSection({
  summary,
  records,
  form,
  editingRecordId,
  onChange,
  onDelete,
  onEdit,
  onSubmit,
  onReset,
  submitting
}) {
  const recordsPagination = usePagination(records);

  return (
    <div className="grid admin-management-grid">
      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Finance</p>
            <h2>{editingRecordId ? "Edit income record" : "Add income record"}</h2>
          </div>
        </div>

        <form className="property-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              <span>Type</span>
              <select value={form.record_type} onChange={(event) => onChange("record_type", event.target.value)}>
                <option value="rent">Rent Payment</option>
                <option value="sale">Property Sale</option>
              </select>
            </label>

            <label>
              <span>Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => onChange("amount", event.target.value)}
                required
              />
            </label>

            <label>
              <span>Payment date</span>
              <input
                type="date"
                value={form.payment_date}
                onChange={(event) => onChange("payment_date", event.target.value)}
                required
              />
            </label>
          </div>

          <label>
            <span>Description</span>
            <input
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="April rent payment for Flat A"
              required
            />
          </label>

          <div className="button-row">
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingRecordId ? "Save Record" : "Add Record"}
            </button>
            {editingRecordId ? (
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
            <p className="eyebrow">History</p>
            <h2>{formatNaira(summary.totalIncome)} total income</h2>
          </div>
        </div>

        <div className="grid stats-grid">
          <div className="card stat-card">
            <strong>{formatNaira(summary.rentIncome)}</strong>
            <p>Rent income</p>
          </div>
          <div className="card stat-card">
            <strong>{formatNaira(summary.salesIncome)}</strong>
            <p>Sales income</p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="status-card">No finance records added yet.</div>
        ) : (
          <>
            <PaginatedContent
              className="dashboard-list"
              pageKey={`finance-records-${recordsPagination.currentPage}`}
            >
              {recordsPagination.pageItems.map((record) => (
              <article key={record.id} className="listing-row compact admin-user-row">
                <div className="listing-copy">
                  <div className="admin-user-heading">
                    <h3>{record.description}</h3>
                    <span className={`pill ${record.record_type === "sale" ? "sale" : "rent"}`}>
                      {record.record_type}
                    </span>
                  </div>
                  <p>{formatNaira(record.amount)}</p>
                  <p>{record.payment_date}</p>
                </div>

                <div className="listing-actions admin-user-actions">
                  <button className="btn secondary" type="button" onClick={() => onEdit(record)}>
                    Edit
                  </button>
                  <button className="btn danger" type="button" onClick={() => onDelete(record)}>
                    Delete
                  </button>
                </div>
              </article>
              ))}
            </PaginatedContent>

            <PaginationControls
              currentPage={recordsPagination.currentPage}
              endIndex={recordsPagination.endIndex}
              goToNextPage={recordsPagination.goToNextPage}
              goToPage={recordsPagination.goToPage}
              goToPreviousPage={recordsPagination.goToPreviousPage}
              label="records"
              pageNumbers={recordsPagination.pageNumbers}
              startIndex={recordsPagination.startIndex}
              totalItems={recordsPagination.totalItems}
              totalPages={recordsPagination.totalPages}
            />
          </>
        )}
      </div>
    </div>
  );
}
