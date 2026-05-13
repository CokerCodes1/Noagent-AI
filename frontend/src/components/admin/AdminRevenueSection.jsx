import AdminStatCard from "./AdminStatCard.jsx";
import usePagination from "../../hooks/usePagination.js";
import PaginatedContent from "../shared/PaginatedContent.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";
import { formatCurrency, formatDate } from "./adminConfig.js";
import { FiCreditCard, FiDollarSign } from "react-icons/fi";
import EmptyStateCard from "../shared/EmptyStateCard.jsx";

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
          <EmptyStateCard
            title="No successful transactions recorded yet"
            description="Completed renter unlock payments will appear here automatically once transactions begin."
          />
        ) : (
          <>
            <PaginatedContent
              className="dashboard-list"
              pageKey={`transactions-${transactionsPagination.currentPage}`}
            >
              {transactionsPagination.pageItems.map((transaction) => (
                <article key={transaction.id} className="listing-row compact revenue-row">
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
                        <span>Location</span>
                        <strong>{transaction.property_location || "Not available"}</strong>
                      </div>
                      <div className="listing-row-meta-item">
                        <span>Renter</span>
                        <strong>
                          {transaction.renter_name || "Unknown"} (
                          {transaction.renter_email || transaction.email})
                        </strong>
                      </div>
                      <div className="listing-row-meta-item">
                        <span>Landlord</span>
                        <strong>{transaction.landlord_name || "Unknown"}</strong>
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
                      <span className="section-meta">Successful unlock payment</span>
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
