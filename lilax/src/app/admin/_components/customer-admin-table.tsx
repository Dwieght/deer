"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatStableAdminDate } from "@/lib/date-format";
import AdminTablePagination, { ADMIN_TABLE_PAGE_SIZE } from "./admin-table-pagination";
import { approveCustomer, declineCustomer, deleteCustomer } from "../actions";

type CustomerStatus = "PENDING" | "APPROVED" | "DECLINED";

export type CustomerAdminTableRow = {
  id: string;
  fullName: string;
  email: string;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
};

export default function CustomerAdminTable({
  customers
}: {
  customers: CustomerAdminTableRow[];
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const approveFormAction = process.env.NODE_ENV === "test" ? undefined : approveCustomer;
  const declineFormAction = process.env.NODE_ENV === "test" ? undefined : declineCustomer;
  const deleteFormAction = process.env.NODE_ENV === "test" ? undefined : deleteCustomer;

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.fullName, customer.email].some((value) => value.toLowerCase().includes(query))
    );
  }, [customers, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ADMIN_TABLE_PAGE_SIZE));
  const visibleCustomers = useMemo(() => {
    const startIndex = (page - 1) * ADMIN_TABLE_PAGE_SIZE;
    return filteredCustomers.slice(startIndex, startIndex + ADMIN_TABLE_PAGE_SIZE);
  }, [filteredCustomers, page]);

  useEffect(() => {
    if (!selectedCustomer) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedCustomer]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  if (customers.length === 0) {
    return (
      <div className="empty-card admin-panel">
        <h3>No customer signups yet</h3>
        <p>Pending customer requests will appear here after someone signs up.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-shell">
      <div className="admin-table-tools">
        <label className="admin-search-field">
          <span>Search customers</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or email"
          />
        </label>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="empty-card admin-panel">
          <h3>No customers match your search.</h3>
          <p>Try a different keyword for name or email.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} className={customer.id === selectedCustomerId ? "is-selected" : undefined}>
                    <td>
                      <div className="table-primary-cell">
                        <strong>{customer.fullName}</strong>
                        <span>{formatStableAdminDate(customer.updatedAt)}</span>
                      </div>
                    </td>
                    <td>{customer.email}</td>
                    <td>
                      <span className={`status-badge status-${customer.status.toLowerCase()}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td>{formatStableAdminDate(customer.createdAt)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="ghost-button table-action-button"
                          onClick={() => setSelectedCustomerId(customer.id)}
                        >
                          View
                        </button>
                        <form action={approveFormAction} className="table-inline-form">
                          <input type="hidden" name="id" value={customer.id} />
                          <button type="submit" className="ghost-button table-action-button">
                            Approve
                          </button>
                        </form>
                        <form action={declineFormAction} className="table-inline-form">
                          <input type="hidden" name="id" value={customer.id} />
                          <button type="submit" className="ghost-button table-action-button">
                            Decline
                          </button>
                        </form>
                        <form action={deleteFormAction} className="table-inline-form">
                          <input type="hidden" name="id" value={customer.id} />
                          <button type="submit" className="ghost-button table-action-button table-action-danger">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminTablePagination
            page={page}
            totalPages={totalPages}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          />
        </>
      )}

      {selectedCustomer ? (
        <div className="overlay-shell admin-product-overlay" onClick={() => setSelectedCustomerId(null)}>
          <section
            className="checkout-modal admin-product-modal admin-detail-card"
            role="dialog"
            aria-modal="true"
            aria-label="View Customer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-headline">
              <div>
                <span className="panel-kicker">Customers</span>
                <h2>Customer request</h2>
                <p className="meta-text">
                  {selectedCustomer.email} • Submitted {formatStableAdminDate(selectedCustomer.createdAt)}
                </p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setSelectedCustomerId(null)}>
                Close
              </button>
            </div>

            <div className="admin-detail-stack">
              <article className="admin-detail-panel-block">
                <h3>Customer details</h3>
                <dl className="admin-key-grid">
                  <div>
                    <dt>Name</dt>
                    <dd>{selectedCustomer.fullName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{selectedCustomer.email}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{selectedCustomer.status}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatStableAdminDate(selectedCustomer.updatedAt)}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
