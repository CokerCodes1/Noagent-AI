import { useState } from "react";

export const PAGINATION_PAGE_SIZE = 5;

export default function usePagination(
  items,
  { itemsPerPage = PAGINATION_PAGE_SIZE, resetKey } = {}
) {
  const [paginationState, setPaginationState] = useState({
    page: 1,
    resetKey
  });
  const safeItemsPerPage = Math.max(1, Number(itemsPerPage) || PAGINATION_PAGE_SIZE);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeItemsPerPage));
  const requestedPage =
    paginationState.resetKey === resetKey ? paginationState.page : 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * safeItemsPerPage;
  const endIndex = Math.min(startIndex + safeItemsPerPage, totalItems);
  const pageItems = items.slice(startIndex, endIndex);

  function goToPage(pageNumber) {
    const nextPage = Math.min(totalPages, Math.max(1, pageNumber));
    setPaginationState({
      page: nextPage,
      resetKey
    });
  }

  function goToPreviousPage() {
    goToPage(currentPage - 1);
  }

  function goToNextPage() {
    goToPage(currentPage + 1);
  }

  const visiblePageCount = 5;
  const visiblePageStart = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - visiblePageCount + 1)
  );
  const visiblePageEnd = Math.min(totalPages, visiblePageStart + visiblePageCount - 1);
  const pageNumbers = Array.from(
    { length: visiblePageEnd - visiblePageStart + 1 },
    (_, index) => visiblePageStart + index
  );

  return {
    currentPage,
    endIndex,
    goToNextPage,
    goToPage,
    goToPreviousPage,
    pageItems,
    pageNumbers,
    startIndex,
    totalItems,
    totalPages
  };
}
