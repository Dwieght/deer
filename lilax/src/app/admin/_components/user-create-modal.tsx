"use client";

import React, { useEffect, useState } from "react";
import { createUser } from "../actions";

export default function UserCreateModal() {
  const [open, setOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const createFormAction = process.env.NODE_ENV === "test" ? undefined : createUser;
  const passwordInputType = showPasswords ? "text" : "password";
  const toggleLabel = showPasswords ? "Hide passwords" : "Show passwords";

  const closeModal = () => {
    setShowPasswords(false);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button type="button" className="primary-button" onClick={() => setOpen(true)}>
        Add Admin
      </button>

      {open ? (
        <div className="overlay-shell admin-create-overlay" onClick={closeModal}>
          <div
            className="checkout-modal admin-create-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add Admin"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-headline">
              <div>
                <span className="panel-kicker">Admins</span>
                <h2>Add admin</h2>
                <p>Create another Lilax admin account.</p>
              </div>
              <button type="button" className="ghost-button" onClick={closeModal}>
                Close
              </button>
            </div>

            <form action={createFormAction} className="admin-form">
              <div className="form-grid">
                <label className="span-2">
                  Email
                  <input type="email" name="email" required />
                </label>
                <label>
                  Password
                  <input type={passwordInputType} name="password" required />
                </label>
                <label>
                  Confirm Password
                  <input type={passwordInputType} name="confirmPassword" required />
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
                  Save Admin
                </button>
                <button type="button" className="ghost-button" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
