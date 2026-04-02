"use client";

import React from "react";
import { useEffect, useState } from "react";
import { createProduct } from "../actions";

export default function ProductCreateModal() {
  const [open, setOpen] = useState(false);
  const createFormAction = process.env.NODE_ENV === "test" ? undefined : createProduct;

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
        Add Product
      </button>

      {open ? (
        <div className="overlay-shell admin-create-overlay" onClick={() => setOpen(false)}>
          <div
            className="checkout-modal admin-create-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add Product"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-headline">
              <div>
                <span className="panel-kicker">Catalog</span>
                <h2>Add product</h2>
                <p>Everything here belongs only to Lilax.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <form action={createFormAction} className="admin-form">
              <label>
                Product name
                <input type="text" name="name" required />
              </label>
              <label>
                Slug
                <input type="text" name="slug" placeholder="Optional. Auto-generated if empty." />
              </label>
              <label>
                Category
                <input type="text" name="category" required />
              </label>
              <label>
                Description
                <textarea name="description" rows={5} required />
              </label>
              <label>
                Price
                <input type="number" name="price" min="0" step="0.01" required />
              </label>
              <label>
                Stock
                <input type="number" name="stock" min="0" step="1" required />
              </label>
              <label>
                Main image URL
                <input type="url" name="imageUrl" required />
              </label>
              <label>
                Gallery URLs
                <textarea name="gallery" rows={4} placeholder="One image URL per line" />
              </label>
              <label className="checkbox-line">
                <input type="checkbox" name="featured" />
                Featured product
              </label>
              <label className="checkbox-line">
                <input type="checkbox" name="isActive" defaultChecked />
                Visible in storefront
              </label>
              <div className="action-row">
                <button type="submit" className="primary-button">
                  Save Product
                </button>
                <button type="button" className="ghost-button" onClick={() => setOpen(false)}>
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
