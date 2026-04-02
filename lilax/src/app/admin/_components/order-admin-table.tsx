"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { formatStableAdminDate } from "@/lib/date-format";
import { normalizeImageUrl } from "@/lib/image-url";
import AdminTablePagination, { ADMIN_TABLE_PAGE_SIZE } from "./admin-table-pagination";
import { deleteOrder, updateOrder } from "../actions";

type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type OrderItemSnapshot = {
  productId?: string;
  slug?: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderAdminTableRow = {
  id: string;
  orderCode: string;
  customerName: string;
  email: string | null;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  notes: string | null;
  status: OrderStatus;
  statusNote: string | null;
  items: unknown;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
};

type OrderPanelState =
  | {
      mode: "view" | "edit";
      orderId: string;
    }
  | null;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(value);
}

function readItems(order: OrderAdminTableRow) {
  return Array.isArray(order.items) ? (order.items as OrderItemSnapshot[]) : [];
}

export default function OrderAdminTable({
  orders
}: {
  orders: OrderAdminTableRow[];
}) {
  const [panel, setPanel] = useState<OrderPanelState>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const updateFormAction = process.env.NODE_ENV === "test" ? undefined : updateOrder;
  const deleteFormAction = process.env.NODE_ENV === "test" ? undefined : deleteOrder;

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === panel?.orderId) || null,
    [orders, panel]
  );
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      return [order.orderCode, order.customerName, order.phone].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ADMIN_TABLE_PAGE_SIZE));
  const visibleOrders = useMemo(() => {
    const startIndex = (page - 1) * ADMIN_TABLE_PAGE_SIZE;
    return filteredOrders.slice(startIndex, startIndex + ADMIN_TABLE_PAGE_SIZE);
  }, [filteredOrders, page]);

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

  if (orders.length === 0) {
    return (
      <div className="empty-card admin-panel">
        <h3>No orders yet</h3>
        <p>Customer checkouts will appear here once orders are placed.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-shell">
      <div className="admin-table-tools">
        <label className="admin-search-field">
          <span>Search orders</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by code, customer, or phone"
          />
        </label>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-card admin-panel">
          <h3>No orders match your search.</h3>
          <p>Try a different keyword for code, customer, or phone.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => {
                  const isSelected = order.id === panel?.orderId;

                  return (
                    <tr key={order.id} className={isSelected ? "is-selected" : undefined}>
                      <td>
                        <span className="table-code">{order.orderCode}</span>
                      </td>
                      <td>
                        <div className="table-primary-cell">
                          <strong>{order.customerName}</strong>
                          <span>{order.email || "No email provided"}</span>
                        </div>
                      </td>
                      <td>{order.phone}</td>
                      <td>{formatStableAdminDate(order.createdAt)}</td>
                      <td>{formatMoney(order.total)}</td>
                      <td>
                        <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="ghost-button table-action-button"
                            onClick={() => setPanel({ mode: "view", orderId: order.id })}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="ghost-button table-action-button"
                            onClick={() => setPanel({ mode: "edit", orderId: order.id })}
                          >
                            Edit
                          </button>
                          <form action={deleteFormAction} className="table-inline-form">
                            <input type="hidden" name="id" value={order.id} />
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

      {selectedOrder ? (
        <div className="overlay-shell admin-product-overlay" onClick={() => setPanel(null)}>
          <section
            className="checkout-modal admin-product-modal admin-detail-card"
            role="dialog"
            aria-modal="true"
            aria-label={panel?.mode === "edit" ? "Edit Order" : "View Order"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-headline">
              <div>
                <span className="panel-kicker">Orders</span>
                <h2>{panel?.mode === "edit" ? "Edit order" : "Order overview"}</h2>
                <p className="meta-text">
                  {selectedOrder.orderCode} • Placed {formatStableAdminDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setPanel(null)}>
                Close
              </button>
            </div>

            {panel?.mode === "edit" ? (
              <form action={updateFormAction} className="admin-form">
                <input type="hidden" name="id" value={selectedOrder.id} />
                <div className="form-grid">
                  <label>
                    Status
                    <select name="status" defaultValue={selectedOrder.status}>
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </label>
                  <label>
                    Order total
                    <input type="text" value={formatMoney(selectedOrder.total)} readOnly />
                  </label>
                  <label className="span-2">
                    Status note
                    <textarea
                      name="statusNote"
                      rows={4}
                      defaultValue={selectedOrder.statusNote || ""}
                      placeholder="Example: Parcel sorted and waiting for courier handoff."
                    />
                  </label>
                </div>

                <div className="action-row">
                  <button type="submit" className="primary-button">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setPanel({ mode: "view", orderId: selectedOrder.id })}
                  >
                    Switch to View
                  </button>
                </div>
              </form>
            ) : (
              <div className="admin-detail-stack">
                <article className="admin-detail-panel-block">
                  <h3>Order snapshot</h3>
                  <dl className="admin-key-grid">
                    <div>
                      <dt>Order code</dt>
                      <dd>{selectedOrder.orderCode}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{selectedOrder.status}</dd>
                    </div>
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{formatMoney(selectedOrder.subtotal)}</dd>
                    </div>
                    <div>
                      <dt>Shipping</dt>
                      <dd>{formatMoney(selectedOrder.shippingFee)}</dd>
                    </div>
                    <div>
                      <dt>Total</dt>
                      <dd>{formatMoney(selectedOrder.total)}</dd>
                    </div>
                    <div>
                      <dt>Last update</dt>
                      <dd>{formatStableAdminDate(selectedOrder.updatedAt)}</dd>
                    </div>
                  </dl>
                </article>

                <div className="order-detail-columns">
                  <article className="admin-detail-panel-block">
                    <h3>Customer</h3>
                    <p>{selectedOrder.customerName}</p>
                    <p>{selectedOrder.phone}</p>
                    {selectedOrder.email ? <p>{selectedOrder.email}</p> : null}
                  </article>

                  <article className="admin-detail-panel-block">
                    <h3>Delivery</h3>
                    <p>{selectedOrder.addressLine1}</p>
                    {selectedOrder.addressLine2 ? <p>{selectedOrder.addressLine2}</p> : null}
                    <p>
                      {selectedOrder.city}, {selectedOrder.province}
                    </p>
                    <p>
                      {selectedOrder.postalCode} • {selectedOrder.country}
                    </p>
                  </article>
                </div>

                <article className="admin-detail-panel-block">
                  <h3>Items</h3>
                  <div className="order-items">
                    {readItems(selectedOrder).map((item, index) => (
                      <div key={`${selectedOrder.id}-${item.name}-${index}`} className="order-item-row">
                        <div className="order-item-main">
                          {item.imageUrl ? (
                            <Image
                              src={normalizeImageUrl(item.imageUrl)}
                              alt={item.name}
                              width={56}
                              height={56}
                              className="order-item-thumb"
                            />
                          ) : null}
                          <div>
                            <strong>{item.name}</strong>
                            <p className="meta-text">
                              Qty {item.quantity} • {formatMoney(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                        <strong>{formatMoney(item.lineTotal)}</strong>
                      </div>
                    ))}
                  </div>
                  {selectedOrder.statusNote ? (
                    <p className="order-note">
                      <strong>Status note:</strong> {selectedOrder.statusNote}
                    </p>
                  ) : null}
                </article>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
