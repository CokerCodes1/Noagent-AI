import AdminStatCard from "./AdminStatCard.jsx";
import usePagination from "../../hooks/usePagination.js";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";
import { formatCurrency, formatDate } from "./adminConfig.js";
import { FiCreditCard, FiDollarSign } from "react-icons/fi";

export default function AdminRevenueSection({
  revenueError,
  revenueLoading,
  revenueSummary,
  transactions
}) {
  const transactionsPagination = usePagination(transactions);

  if (revenueLoading) {
    return <div className="status-card">Loading revenue...</div>;
  }

  return (
    <>
      {revenueError ? <div className="status-card error">{revenueError}</div> : null}

      <div className="grid stats-grid">
        <AdminStatCard
          icon={FiDollarSign}
          label="Total revenue"
          value={formatCurrency(revenueSummary.revenue / 100)}
          note="Successful unlock payments"
        />
        <AdminStatCard
          icon={FiCreditCard}
          label="Successful transactions"
          value={revenueSummary.successfulTransactions}
          note="Completed payments"
        />
      </div>

      <div className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Transactions</p>
            <h2>All successful payments</h2>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="status-card">No successful transactions recorded yet.</div>
        ) : (
          <>
            <PaginatedContent
              className="dashboard-list"
              pageKey={`transactions-${transactionsPagination.currentPage}`}
            >
              {transactionsPagination.pageItems.map((transaction) => (
              <article key={transaction.id} className="listing-row compact revenue-row">
                <div className="listing-copy">
                  <div className="admin-user-heading">
                    <h3>{formatCurrency(transaction.amount_paid / 100)}</h3>
                    <span className="pill available">success</span>
                  </div>
                  <p>Property: {transaction.property_type || "Property removed"}</p>
                  <p>Location: {transaction.property_location || "Not available"}</p>
                  <p>
                    Renter: {transaction.renter_name || "Unknown"} (
                    {transaction.renter_email || transaction.email})
                  </p>
                  <p>Landlord: {transaction.landlord_name || "Unknown"}</p>
                  <p>Reference: {transaction.reference}</p>
                </div>

                <div className="listing-actions">
                  <strong>{formatDate(transaction.paid_at)}</strong>
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
              label="payments"
              pageNumbers={transactionsPagination.pageNumbers}
              startIndex={transactionsPagination.startIndex}
              totalItems={transactionsPagination.totalItems}
              totalPages={transactionsPagination.totalPages}
            />
          </>
        )}
      </div>
    </>
  );
}
