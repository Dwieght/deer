import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import { approveJoin, declineJoin } from "../actions";
import {
  applySearch,
  buildWeeklyCounts,
  formatDate,
  normalizeSearch,
  paginate,
  parsePage,
  renderTableControls,
} from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function JoinPage({ searchParams }) {
  const joinSubmissions = await prisma.joinSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  const approved = joinSubmissions.filter((item) => item.status === "APPROVED");
  const pending = joinSubmissions.filter((item) => item.status === "PENDING");
  const weeklyCounts = buildWeeklyCounts(approved, 8, (item) => item.reviewedAt || item.createdAt);
  const maxWeeklyTotal = Math.max(...weeklyCounts.map((week) => week.total), 1);

  const PAGE_SIZE = 8;
  const joinSearch = normalizeSearch(searchParams?.joinSearch);
  const joinPage = parsePage(searchParams?.joinPage);
  const joinFiltered = applySearch(joinSubmissions, joinSearch, (item) => [
    item.name,
    item.email,
    item.location,
    item.message,
    item.status,
  ]);
  const joinPagination = paginate(joinFiltered, joinPage, PAGE_SIZE);

  return (
    <section className="section" id="join">
      <div className="section-header">
        <div>
          <h2>Join Requests</h2>
          <p>Review new community join requests and track weekly growth.</p>
        </div>
      </div>

      <div className="contribution-summary">
        <div className="stat-card">
          <p className="stat-label">Total Requests</p>
          <p className="stat-value">{joinSubmissions.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Approved Members</p>
          <p className="stat-value">{approved.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending Reviews</p>
          <p className="stat-value">{pending.length}</p>
        </div>
      </div>

      <div className="chart" role="img" aria-label="Weekly join approvals">
        {weeklyCounts.map((week) => (
          <div key={week.key} className="chart-col">
            <div
              className="chart-bar"
              style={{ height: `${(week.total / maxWeeklyTotal) * 100}%` }}
              title={`${week.label}: ${week.total} approvals`}
            />
            <span className="chart-label">{week.label}</span>
            <span className="chart-value">{week.total}</span>
          </div>
        ))}
      </div>

      {joinFiltered.length > 0 || joinSearch
        ? renderTableControls({
            searchParams,
            searchKey: "joinSearch",
            pageKey: "joinPage",
            searchValue: joinSearch,
            pagination: joinPagination,
            placeholder: "Search join requests",
            anchor: "join",
          })
        : null}

      {joinFiltered.length === 0 ? <p className="empty-state">No join requests yet.</p> : null}
      {joinFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {joinPagination.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="table-cell-truncate">{item.email}</td>
                  <td className="table-cell-muted">{item.location || "—"}</td>
                  <td>
                    <span className="badge">{item.status}</span>
                  </td>
                  <td className="table-cell-muted">{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="table-actions is-inline">
                      <Modal
                        triggerLabel="View"
                        title={`Join request from ${item.name}`}
                        triggerClassName="secondary-button"
                      >
                        <div className="modal-stack">
                          <div>
                            <p className="table-cell-muted">Email: {item.email}</p>
                            {item.location ? <p className="table-cell-muted">Location: {item.location}</p> : null}
                            {item.message ? <p className="modal-message">{item.message}</p> : null}
                          </div>
                        </div>
                      </Modal>
                      {item.status === "PENDING" ? (
                        <>
                          <AdminForm action={approveJoin}>
                            <input type="hidden" name="id" value={item.id} />
                            <button className="secondary-button" type="submit">
                              Approve
                            </button>
                          </AdminForm>
                          <AdminForm action={declineJoin} confirmMessage="Decline this join request?">
                            <input type="hidden" name="id" value={item.id} />
                            <button className="ghost-button" type="submit">
                              Decline
                            </button>
                          </AdminForm>
                        </>
                      ) : (
                        <span className="table-cell-muted">Reviewed</span>
                      )}
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
