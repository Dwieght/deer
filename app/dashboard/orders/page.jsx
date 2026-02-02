import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import { updateOrder, deleteOrder } from "../actions";
import {
  applySearch,
  formatAmount,
  formatDate,
  getQrPreviewUrl,
  normalizeSearch,
  paginate,
  parsePage,
  renderTableControls,
} from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default async function OrdersPage({ searchParams }) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });

  const PAGE_SIZE = 8;
  const ordersSearch = normalizeSearch(searchParams?.ordersSearch);
  const ordersPage = parsePage(searchParams?.ordersPage);
  const ordersFiltered = applySearch(orders, ordersSearch, (order) => [
    order.customerName,
    order.phone,
    order.product?.name,
  ]);
  const ordersPagination = paginate(ordersFiltered, ordersPage, PAGE_SIZE);

  return (
    <section className="section" id="orders">
      <div className="section-header">
        <div>
          <h2>Orders</h2>
          <p>Review and update customer orders from the shop.</p>
        </div>
      </div>

      {ordersFiltered.length > 0 || ordersSearch
        ? renderTableControls({
            searchParams,
            searchKey: "ordersSearch",
            pageKey: "ordersPage",
            searchValue: ordersSearch,
            pagination: ordersPagination,
            placeholder: "Search orders",
            anchor: "orders",
          })
        : null}

      {ordersFiltered.length === 0 ? <p className="empty-state">No orders yet.</p> : null}
      {ordersFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Product</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersPagination.items.map((order) => (
                <tr key={order.id}>
                  <td>{order.customerName}</td>
                  <td className="table-cell-truncate">{order.phone}</td>
                  <td className="table-cell-truncate">{order.product?.name || "—"}</td>
                  <td>{formatAmount(order.total)}</td>
                  <td>
                    <span className="badge">{order.status}</span>
                  </td>
                  <td className="table-cell-muted">{formatDate(order.createdAt)}</td>
                  <td>
                    <div className="table-actions is-inline">
                      <Modal
                        triggerLabel="View"
                        title={`Order from ${order.customerName}`}
                        triggerClassName="secondary-button"
                      >
                        <div className="modal-stack">
                          <div>
                            <p className="table-cell-muted">Phone: {order.phone}</p>
                            <p className="table-cell-muted">
                              Address: {order.houseNo} {order.streetName}
                              {order.building ? `, ${order.building}` : ""}, {order.barangay}, {order.city},{" "}
                              {order.province}, {order.region} {order.postalCode}
                            </p>
                            <p className="table-cell-muted">Label: {order.addressLabel}</p>
                            <p className="table-cell-muted">Status: {order.status}</p>
                            {order.size ? (
                              <p className="table-cell-muted">Size: {order.size}</p>
                            ) : null}
                            <p className="table-cell-muted">Quantity: {order.quantity}</p>
                            <p className="table-cell-muted">Total: {formatAmount(order.total)}</p>
                            {order.product ? (
                              <div className="modal-card">
                                <img
                                  src={getQrPreviewUrl(order.product.imageUrl)}
                                  alt={order.product.name}
                                  className="dashboard-image"
                                />
                                <p>{order.product.name}</p>
                                <p className="table-cell-muted">Unit price: {formatAmount(order.product.price)}</p>
                              </div>
                            ) : null}
                          </div>
                          <div className="form-card">
                            <h4>Edit Order</h4>
                            <AdminForm action={updateOrder} className="admin-form">
                              <input type="hidden" name="id" value={order.id} />
                              <label>
                                Customer Name
                                <input type="text" name="customerName" defaultValue={order.customerName} required />
                              </label>
                              <label>
                                Phone
                                <input type="text" name="phone" defaultValue={order.phone} required />
                              </label>
                              <label>
                                Region
                                <input type="text" name="region" defaultValue={order.region} required />
                              </label>
                              <label>
                                Province
                                <input type="text" name="province" defaultValue={order.province} required />
                              </label>
                              <label>
                                City
                                <input type="text" name="city" defaultValue={order.city} required />
                              </label>
                              <label>
                                Barangay
                                <input type="text" name="barangay" defaultValue={order.barangay} required />
                              </label>
                              <label>
                                Postal Code
                                <input type="text" name="postalCode" defaultValue={order.postalCode} required />
                              </label>
                              <label>
                                Street Name
                                <input type="text" name="streetName" defaultValue={order.streetName} required />
                              </label>
                              <label>
                                Building
                                <input type="text" name="building" defaultValue={order.building || ""} />
                              </label>
                              <label>
                                House No.
                                <input type="text" name="houseNo" defaultValue={order.houseNo} required />
                              </label>
                              <label>
                                Address Label
                                <select name="addressLabel" defaultValue={order.addressLabel} required>
                                  <option value="home">Home</option>
                                  <option value="work">Work</option>
                                </select>
                              </label>
                              <label>
                                Size
                                <input type="text" name="size" defaultValue={order.size || ""} />
                              </label>
                              <label>
                                Status
                                <select name="status" defaultValue={order.status} required>
                                  {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Quantity
                                <input
                                  type="number"
                                  name="quantity"
                                  min="1"
                                  step="1"
                                  defaultValue={order.quantity}
                                  required
                                />
                              </label>
                              <div className="action-row">
                                <button className="secondary-button" type="submit">
                                  Save Changes
                                </button>
                              </div>
                            </AdminForm>
                          </div>
                        </div>
                      </Modal>
                      <AdminForm action={deleteOrder} confirmMessage="Delete this order?">
                        <input type="hidden" name="id" value={order.id} />
                        <button className="ghost-button" type="submit">
                          Delete
                        </button>
                      </AdminForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
