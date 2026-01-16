import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import { upsertUser } from "../actions";
import {
  applySearch,
  formatDate,
  normalizeSearch,
  paginate,
  parsePage,
  renderTableControls,
} from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }) {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  const PAGE_SIZE = 8;
  const usersSearch = normalizeSearch(searchParams?.usersSearch);
  const usersPage = parsePage(searchParams?.usersPage);
  const usersFiltered = applySearch(users, usersSearch, (user) => [user.email]);
  const usersPagination = paginate(usersFiltered, usersPage, PAGE_SIZE);

  return (
    <section className="section" id="users">
      <div className="section-header">
        <div>
          <h2>Admin Users</h2>
          <p>Add a new admin login or reset an existing password.</p>
        </div>
        <Modal triggerLabel="Add Admin" title="Add Admin User" triggerClassName="primary-button">
          <AdminForm action={upsertUser} className="admin-form">
            <div className="form-row">
              <label htmlFor="admin-user-email">
                Username (Email)
                <input id="admin-user-email" type="email" name="email" placeholder="name@example.com" required />
              </label>
              <label htmlFor="admin-user-password">
                Password
                <input id="admin-user-password" type="password" name="password" minLength={6} required />
              </label>
            </div>
            <p className="form-note">Submitting an existing email will reset its password.</p>
            <button className="primary-button" type="submit">
              Save User
            </button>
          </AdminForm>
        </Modal>
      </div>

      {usersFiltered.length > 0 || usersSearch
        ? renderTableControls({
            searchParams,
            searchKey: "usersSearch",
            pageKey: "usersPage",
            searchValue: usersSearch,
            pagination: usersPagination,
            placeholder: "Search admins",
            anchor: "users",
          })
        : null}

      {usersFiltered.length === 0 ? <p className="empty-state">No admin users found.</p> : null}
      {usersFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersPagination.items.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td className="table-cell-muted">{formatDate(user.createdAt)}</td>
                  <td>
                    <Modal
                      triggerLabel="Reset Password"
                      title={`Reset Password: ${user.email}`}
                      triggerClassName="secondary-button"
                    >
                      <AdminForm action={upsertUser} className="admin-form">
                        <label>
                          Username (Email)
                          <input type="email" name="email" defaultValue={user.email} readOnly />
                        </label>
                        <label>
                          New Password
                          <input type="password" name="password" minLength={6} required />
                        </label>
                        <button className="primary-button" type="submit">
                          Save User
                        </button>
                      </AdminForm>
                    </Modal>
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
