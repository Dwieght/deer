import { prisma } from "@/lib/prisma";
import { deleteOrder, updateOrder } from "../actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string | string[];
  text?: string | string[];
};

type OrderItemSnapshot = {
  productId?: string;
  slug?: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const orders = await prisma.order
    .findMany({
      orderBy: { createdAt: "desc" }
    })
    .catch(() => []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) =>
    ["PENDING", "PAID", "PROCESSING"].includes(order.status)
  ).length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const flashType = readParam(searchParams?.type);
  const flashText = readParam(searchParams?.text);

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <span className="kicker">Orders</span>
          <h1>Manage orders</h1>
          <p>Review checkout requests, update statuses, and keep fulfillment notes in one place.</p>
        </div>
      </div>

      {flashText ? (
        <div className={`flash-message ${flashType === "error" ? "is-error" : "is-success"}`}>
          {flashText}
        </div>
      ) : null}

      <div className="stat-grid">
        <article className="stat-card">
          <span>Total orders</span>
          <strong>{totalOrders}</strong>
        </article>
        <article className="stat-card">
          <span>Active queue</span>
          <strong>{pendingOrders}</strong>
        </article>
        <article className="stat-card">
          <span>Gross sales</span>
          <strong>{formatMoney(totalRevenue)}</strong>
        </article>
      </div>

      <div className="order-stack">
        {orders.map((order) => {
          const items = Array.isArray(order.items)
            ? (order.items as unknown as OrderItemSnapshot[])
            : [];

          return (
            <article key={order.id} className="order-card">
              <div className="order-card-head">
                <div>
                  <p className="meta-text">Order code</p>
                  <h2>{order.orderCode}</h2>
                </div>
                <span className={`status-badge status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-columns">
                <div className="order-block">
                  <h3>Customer</h3>
                  <p>{order.customerName}</p>
                  <p>{order.phone}</p>
                  {order.email ? <p>{order.email}</p> : null}
                </div>
                <div className="order-block">
                  <h3>Delivery</h3>
                  <p>{order.addressLine1}</p>
                  {order.addressLine2 ? <p>{order.addressLine2}</p> : null}
                  <p>
                    {order.city}, {order.province}
                  </p>
                  <p>
                    {order.postalCode} • {order.country}
                  </p>
                </div>
                <div className="order-block">
                  <h3>Summary</h3>
                  <p>Placed: {formatDate(order.createdAt)}</p>
                  <p>Total: {formatMoney(order.total)}</p>
                  {order.statusNote ? <p>Note: {order.statusNote}</p> : null}
                </div>
              </div>

              <div className="order-items">
                {items.map((item, index) => (
                  <div key={`${order.id}-${item.name}-${index}`} className="order-item-row">
                    <div>
                      <strong>{item.name}</strong>
                      <p className="meta-text">
                        Qty {item.quantity} • {formatMoney(item.unitPrice)}
                      </p>
                    </div>
                    <strong>{formatMoney(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>

              <form action={updateOrder} className="admin-form">
                <input type="hidden" name="id" value={order.id} />
                <div className="form-grid">
                  <label>
                    Status
                    <select name="status" defaultValue={order.status}>
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </label>
                  <label className="span-2">
                    Status note
                    <textarea
                      name="statusNote"
                      rows={3}
                      defaultValue={order.statusNote || ""}
                      placeholder="Example: Packed and waiting for rider pickup."
                    />
                  </label>
                </div>

                <div className="action-row">
                  <button type="submit" className="primary-button">
                    Save Changes
                  </button>
                  <button type="submit" formAction={deleteOrder} className="ghost-button">
                    Delete Order
                  </button>
                </div>
              </form>
            </article>
          );
        })}

        {orders.length === 0 ? (
          <div className="empty-card">
            <h3>No orders yet</h3>
            <p>Customer checkouts will appear here once orders are placed.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
