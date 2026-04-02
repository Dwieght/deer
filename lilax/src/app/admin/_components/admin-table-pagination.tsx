"use client";

import React from "react";

export const ADMIN_TABLE_PAGE_SIZE = 10;

export default function AdminTablePagination({
  page,
  totalPages,
  onPrevious,
  onNext
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="admin-table-pagination">
      <button
        type="button"
        className="ghost-button table-action-button"
        onClick={onPrevious}
        disabled={page <= 1}
        aria-label="Previous Page"
      >
        Previous
      </button>
      <span className="admin-pagination-label">Page {page} of {totalPages}</span>
      <button
        type="button"
        className="ghost-button table-action-button"
        onClick={onNext}
        disabled={page >= totalPages}
        aria-label="Next Page"
      >
        Next
      </button>
    </div>
  );
}
