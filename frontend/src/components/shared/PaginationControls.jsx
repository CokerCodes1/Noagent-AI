import { motion as Motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function resolveRangeLabel({
  endIndex,
  label,
  startIndex,
  totalItems
}) {
  if (totalItems === 0) {
    return `No ${label} available`;
  }

  return `Showing ${startIndex + 1}-${endIndex} of ${totalItems} ${label}`;
}

export default function PaginationControls({
  currentPage,
  endIndex,
  goToNextPage,
  goToPage,
  goToPreviousPage,
  label = "items",
  pageNumbers,
  startIndex,
  totalItems,
  totalPages
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Motion.div
      className="pagination-shell sticky-mobile"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="pagination-summary">
        <strong>Page {currentPage}</strong>
        <span>{resolveRangeLabel({ endIndex, label, startIndex, totalItems })}</span>
      </div>

      <div className="pagination-controls" aria-label={`${label} pagination`}>
        <button
          type="button"
          className="pagination-nav-button"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
        >
          <FiChevronLeft aria-hidden="true" />
          <span>Previous</span>
        </button>

        <div className="pagination-page-list">
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={
                pageNumber === currentPage
                  ? "pagination-page-button active"
                  : "pagination-page-button"
              }
              onClick={() => goToPage(pageNumber)}
              aria-current={pageNumber === currentPage ? "page" : undefined}
            >
              {pageNumber}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pagination-nav-button"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
        >
          <span>Next</span>
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>
    </Motion.div>
  );
}
