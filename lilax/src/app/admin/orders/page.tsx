import { prisma } from "@/lib/prisma";
import AdminFlashAlert from "../_components/admin-flash-alert";
import OrderAdminTable from "../_components/order-admin-table";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string | string[];
  text?: string | string[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const orders = await prisma.order
    .findMany({
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) =>
    ["PENDING", "PAID", "PROCESSING"].includes(order.status),
  ).length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const flashType = readParam(searchParams?.type);
  const flashText = readParam(searchParams?.text);

  return (
    <section className="admin-page admin-page-wide">
      <div className="page-heading">
        <div>
          <span className="kicker">Orders</span>
          <h1>Manage orders</h1>
          <p>
            Review checkout requests, update statuses, and keep fulfillment
            notes in one place.
          </p>
        </div>
      </div>

      {flashText ? (
        <>
          <AdminFlashAlert type={flashType} text={flashText} scope="orders" />
          <div
            className={`flash-message ${flashType === "error" ? "is-error" : "is-success"}`}
          >
            {flashText}
          </div>
        </>
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

      <OrderAdminTable orders={orders} />
    </section>
  );
}
