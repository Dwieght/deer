"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { formatStableAdminDate } from "@/lib/date-format";
import { normalizeImageList, normalizeImageUrl } from "@/lib/image-url";
import AdminTablePagination, { ADMIN_TABLE_PAGE_SIZE } from "./admin-table-pagination";
import { deleteProduct, updateProduct } from "../actions";

export type ProductAdminTableRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  gallery: string[];
  featured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ProductPanelState =
  | {
      mode: "view" | "edit";
      productId: string;
    }
  | null;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(value);
}

function readGallery(product: ProductAdminTableRow) {
  return normalizeImageList(product.gallery.length ? product.gallery : [product.imageUrl]);
}

export default function ProductAdminTable({
  products
}: {
  products: ProductAdminTableRow[];
}) {
  const [panel, setPanel] = useState<ProductPanelState>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const updateFormAction = process.env.NODE_ENV === "test" ? undefined : updateProduct;
  const deleteFormAction = process.env.NODE_ENV === "test" ? undefined : deleteProduct;

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === panel?.productId) || null,
    [panel, products]
  );
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return [product.name, product.category, product.slug].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ADMIN_TABLE_PAGE_SIZE));
  const visibleProducts = useMemo(() => {
    const startIndex = (page - 1) * ADMIN_TABLE_PAGE_SIZE;
    return filteredProducts.slice(startIndex, startIndex + ADMIN_TABLE_PAGE_SIZE);
  }, [filteredProducts, page]);

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

  if (products.length === 0) {
    return (
      <div className="empty-card admin-panel">
        <h3>No products yet</h3>
        <p>Create your first Lilax product from the Add Product button.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-shell">
      <div className="admin-table-tools">
        <label className="admin-search-field">
          <span>Search products</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, category, or slug"
          />
        </label>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-card admin-panel">
          <h3>No products match your search.</h3>
          <p>Try a different keyword for name, category, or slug.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Slug</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => {
                  const isSelected = product.id === panel?.productId;

                  return (
                    <tr key={product.id} className={isSelected ? "is-selected" : undefined}>
                      <td>
                        <Image
                          src={normalizeImageUrl(product.imageUrl)}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="table-thumb"
                        />
                      </td>
                      <td>
                        <div className="table-primary-cell">
                          <strong>{product.name}</strong>
                          <span>{product.description}</span>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>{formatMoney(product.price)}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span className={`status-badge ${product.isActive ? "status-delivered" : "status-cancelled"}`}>
                          {product.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td>{product.featured ? "Yes" : "No"}</td>
                      <td>
                        <span className="table-code">{product.slug}</span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="ghost-button table-action-button"
                            onClick={() => setPanel({ mode: "view", productId: product.id })}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="ghost-button table-action-button"
                            onClick={() => setPanel({ mode: "edit", productId: product.id })}
                          >
                            Edit
                          </button>
                          <form action={deleteFormAction} className="table-inline-form">
                            <input type="hidden" name="id" value={product.id} />
                            <button type="submit" className="ghost-button table-action-button table-action-danger">
                              Delete
                            </button>
                          </form>
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

      {selectedProduct ? (
        <div className="overlay-shell admin-product-overlay" onClick={() => setPanel(null)}>
          <section
            className="checkout-modal admin-product-modal admin-detail-card"
            role="dialog"
            aria-modal="true"
            aria-label={panel?.mode === "edit" ? "Edit Product" : "View Product"}
            onClick={(event) => event.stopPropagation()}
          >
          <div className="panel-headline">
            <div>
              <span className="panel-kicker">
                {panel?.mode === "edit" ? "Editing product" : "Selected product"}
              </span>
              <h2>{panel?.mode === "edit" ? "Edit product" : "Product overview"}</h2>
              <p className="meta-text">
                {selectedProduct.name} • Updated {formatStableAdminDate(selectedProduct.updatedAt)}
              </p>
            </div>
            <button type="button" className="ghost-button" onClick={() => setPanel(null)}>
              Close
            </button>
          </div>

          {panel?.mode === "edit" ? (
            <form action={updateFormAction} className="admin-form">
              <input type="hidden" name="id" value={selectedProduct.id} />
              <div className="form-grid">
                <label>
                  Name
                  <input type="text" name="name" defaultValue={selectedProduct.name} required />
                </label>
                <label>
                  Slug
                  <input type="text" name="slug" defaultValue={selectedProduct.slug} required />
                </label>
                <label>
                  Category
                  <input type="text" name="category" defaultValue={selectedProduct.category} required />
                </label>
                <label>
                  Price
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    defaultValue={selectedProduct.price}
                    required
                  />
                </label>
                <label>
                  Stock
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    defaultValue={selectedProduct.stock}
                    required
                  />
                </label>
                <label className="span-2">
                  Main image URL
                  <input
                    type="url"
                    name="imageUrl"
                    defaultValue={normalizeImageUrl(selectedProduct.imageUrl)}
                    required
                  />
                </label>
                <label className="span-2">
                  Description
                  <textarea name="description" rows={4} defaultValue={selectedProduct.description} required />
                </label>
                <label className="span-2">
                  Gallery URLs
                  <textarea
                    name="gallery"
                    rows={4}
                    defaultValue={readGallery(selectedProduct).join("\n")}
                  />
                </label>
                <label className="checkbox-line">
                  <input type="checkbox" name="featured" defaultChecked={selectedProduct.featured} />
                  Featured
                </label>
                <label className="checkbox-line">
                  <input type="checkbox" name="isActive" defaultChecked={selectedProduct.isActive} />
                  Active
                </label>
              </div>

              <div className="action-row">
                <button type="submit" className="primary-button">
                  Update Product
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setPanel({ mode: "view", productId: selectedProduct.id })}
                >
                  Switch to View
                </button>
              </div>
            </form>
          ) : (
            <div className="admin-detail-grid">
              <div className="admin-detail-media">
                <Image
                  src={normalizeImageUrl(selectedProduct.imageUrl)}
                  alt={selectedProduct.name}
                  width={320}
                  height={320}
                  className="admin-detail-image"
                />
                <div className="admin-gallery-strip">
                  {readGallery(selectedProduct).slice(0, 4).map((imageUrl, index) => (
                    <Image
                      key={`${selectedProduct.id}-${index}`}
                      src={imageUrl}
                      alt={`${selectedProduct.name} preview ${index + 1}`}
                      width={72}
                      height={72}
                      className="admin-gallery-thumb"
                    />
                  ))}
                </div>
              </div>

              <div className="admin-detail-stack">
                <article className="admin-detail-panel-block">
                  <h3>Description</h3>
                  <p>{selectedProduct.description}</p>
                </article>
                <article className="admin-detail-panel-block">
                  <h3>Catalog details</h3>
                  <dl className="admin-key-grid">
                    <div>
                      <dt>Category</dt>
                      <dd>{selectedProduct.category}</dd>
                    </div>
                    <div>
                      <dt>Price</dt>
                      <dd>{formatMoney(selectedProduct.price)}</dd>
                    </div>
                    <div>
                      <dt>Stock</dt>
                      <dd>{selectedProduct.stock}</dd>
                    </div>
                    <div>
                      <dt>Slug</dt>
                      <dd>{selectedProduct.slug}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{selectedProduct.isActive ? "Visible in storefront" : "Hidden from storefront"}</dd>
                    </div>
                    <div>
                      <dt>Featured</dt>
                      <dd>{selectedProduct.featured ? "Yes" : "No"}</dd>
                    </div>
                  </dl>
                </article>
              </div>
            </div>
          )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
