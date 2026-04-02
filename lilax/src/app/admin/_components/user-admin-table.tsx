"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatStableAdminDate } from "@/lib/date-format";
import AdminTablePagination, { ADMIN_TABLE_PAGE_SIZE } from "./admin-table-pagination";
import { deleteUser, updateUser } from "../actions";

export type UserAdminTableRow = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserPanelState =
  | {
      mode: "edit";
      userId: string;
    }
  | null;

export default function UserAdminTable({
  currentUserEmail,
  users
}: {
  currentUserEmail: string;
  users: UserAdminTableRow[];
}) {
  const [panel, setPanel] = useState<UserPanelState>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const updateFormAction = process.env.NODE_ENV === "test" ? undefined : updateUser;
  const deleteFormAction = process.env.NODE_ENV === "test" ? undefined : deleteUser;
  const passwordInputType = showPasswords ? "text" : "password";
  const toggleLabel = showPasswords ? "Hide passwords" : "Show passwords";

  const selectedUser = useMemo(
    () => users.find((user) => user.id === panel?.userId) || null,
    [panel, users]
  );
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) => user.email.toLowerCase().includes(query));
  }, [searchQuery, users]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ADMIN_TABLE_PAGE_SIZE));
  const visibleUsers = useMemo(() => {
    const startIndex = (page - 1) * ADMIN_TABLE_PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + ADMIN_TABLE_PAGE_SIZE);
  }, [filteredUsers, page]);

  useEffect(() => {
    if (!panel) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [panel]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setShowPasswords(false);
  }, [panel]);

  if (users.length === 0) {
    return (
      <div className="empty-card admin-panel">
        <h3>No admins yet</h3>
        <p>Add the first Lilax admin from the button above.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-shell">
      <div className="admin-table-tools">
        <label className="admin-search-field">
          <span>Search admins</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by email"
          />
        </label>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-card admin-panel">
          <h3>No admins match your search.</h3>
          <p>Try a different email keyword.</p>
        </div>
      ) : (
        <>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => {
              const isCurrentUser = user.email === currentUserEmail;
              const isLastAdmin = users.length === 1;
              const deleteGuardLabel = isLastAdmin ? "Last admin" : isCurrentUser ? "Current account" : null;

              return (
                <tr key={user.id} className={user.id === panel?.userId ? "is-selected" : undefined}>
                  <td>
                    <div className="table-primary-cell">
                      <strong>{user.email}</strong>
                      <span>Admin account</span>
                    </div>
                  </td>
                  <td>{formatStableAdminDate(user.createdAt)}</td>
                  <td>{formatStableAdminDate(user.updatedAt)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="ghost-button table-action-button"
                        onClick={() => setPanel({ mode: "edit", userId: user.id })}
                      >
                        Edit
                      </button>
                      {deleteGuardLabel ? (
                        <span className="meta-text">{deleteGuardLabel}</span>
                      ) : (
                        <form action={deleteFormAction} className="table-inline-form">
                          <input type="hidden" name="id" value={user.id} />
                          <button type="submit" className="ghost-button table-action-button table-action-danger">
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {selectedUser ? (
        <div className="overlay-shell admin-create-overlay" onClick={() => setPanel(null)}>
          <section
            className="checkout-modal admin-create-modal admin-detail-card"
            role="dialog"
            aria-modal="true"
            aria-label="Edit Admin"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-headline">
              <div>
                <span className="panel-kicker">Admins</span>
                <h2>Edit admin</h2>
                <p className="meta-text">
                  {selectedUser.email} • Updated {formatStableAdminDate(selectedUser.updatedAt)}
                </p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setPanel(null)}>
                Close
              </button>
            </div>

            <form action={updateFormAction} className="admin-form">
              <input type="hidden" name="id" value={selectedUser.id} />
              <div className="form-grid">
                <label className="span-2">
                  Email
                  <input type="email" name="email" defaultValue={selectedUser.email} required />
                </label>
                <label>
                  New Password
                  <input type={passwordInputType} name="password" />
                </label>
                <label>
                  Confirm New Password
                  <input type={passwordInputType} name="confirmPassword" />
                </label>
              </div>
              <div className="password-toggle-row">
                <button
                  type="button"
                  className="ghost-button password-toggle"
                  aria-pressed={showPasswords}
                  onClick={() => setShowPasswords((current) => !current)}
                >
                  {toggleLabel}
                </button>
              </div>
              <div className="action-row">
                <button type="submit" className="primary-button">
                  Save Changes
                </button>
                <button type="button" className="ghost-button" onClick={() => setPanel(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
