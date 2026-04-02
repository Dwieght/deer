import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import AdminFlashAlert from "../_components/admin-flash-alert";
import UserAdminTable from "../_components/user-admin-table";
import UserCreateModal from "../_components/user-create-modal";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string | string[];
  text?: string | string[];
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const session = requireSession();
  const users = await prisma.user
    .findMany({
      orderBy: { createdAt: "desc" }
    })
    .catch(() => []);
  const flashType = readParam(searchParams?.type);
  const flashText = readParam(searchParams?.text);

  return (
    <section className="admin-page admin-page-wide">
      <div className="page-heading">
        <div>
          <span className="kicker">Admins</span>
          <h1>Manage admins</h1>
          <p>Add, update, and remove Lilax admin accounts with guardrails.</p>
        </div>
        <div className="admin-page-actions">
          <UserCreateModal />
        </div>
      </div>

      {flashText ? (
        <>
          <AdminFlashAlert type={flashType} text={flashText} scope="users" />
          <div className={`flash-message ${flashType === "error" ? "is-error" : "is-success"}`}>
            {flashText}
          </div>
        </>
      ) : null}

      <div className="stat-grid">
        <article className="stat-card">
          <span>Total admins</span>
          <strong>{users.length}</strong>
        </article>
      </div>

      <article className="admin-panel admin-panel-wide">
        <div className="panel-headline">
          <div>
            <h2>Current admins</h2>
            <p>Keep Lilax access managed in one place.</p>
          </div>
        </div>

        <UserAdminTable currentUserEmail={session.email} users={users} />
      </article>
    </section>
  );
}
