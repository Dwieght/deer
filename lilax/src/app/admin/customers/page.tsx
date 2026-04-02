import { prisma } from "@/lib/prisma";
import AdminFlashAlert from "../_components/admin-flash-alert";
import CustomerAdminTable from "../_components/customer-admin-table";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string | string[];
  text?: string | string[];
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCustomersPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const customers = await prisma.customer
    .findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    })
    .catch(() => []);

  const flashType = readParam(searchParams?.type);
  const flashText = readParam(searchParams?.text);
  const pendingCustomers = customers.filter((customer) => customer.status === "PENDING").length;
  const approvedCustomers = customers.filter((customer) => customer.status === "APPROVED").length;

  return (
    <section className="admin-page admin-page-wide">
      <div className="page-heading">
        <div>
          <span className="kicker">Customers</span>
          <h1>Manage customer signups</h1>
          <p>Review pending customer requests and approve or decline them from one queue.</p>
        </div>
      </div>

      {flashText ? (
        <>
          <AdminFlashAlert type={flashType} text={flashText} scope="customers" />
          <div className={`flash-message ${flashType === "error" ? "is-error" : "is-success"}`}>
            {flashText}
          </div>
        </>
      ) : null}

      <div className="stat-grid">
        <article className="stat-card">
          <span>Total signups</span>
          <strong>{customers.length}</strong>
        </article>
        <article className="stat-card">
          <span>Pending</span>
          <strong>{pendingCustomers}</strong>
        </article>
        <article className="stat-card">
          <span>Approved</span>
          <strong>{approvedCustomers}</strong>
        </article>
      </div>

      <article className="admin-panel admin-panel-wide">
        <div className="panel-headline">
          <div>
            <h2>Customer requests</h2>
            <p>Approve or decline signups without mixing them into Lilax admin users.</p>
          </div>
        </div>

        <CustomerAdminTable customers={customers} />
      </article>
    </section>
  );
}
