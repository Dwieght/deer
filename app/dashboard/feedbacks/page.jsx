import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import { approveFeedback, declineFeedback, deleteFeedback } from "../actions";
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

const FILLED_STAR = "\u2605";
const EMPTY_STAR = "\u2606";

const renderStars = (rating) => {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return FILLED_STAR.repeat(value) + EMPTY_STAR.repeat(5 - value);
};

export default async function FeedbacksPage({ searchParams }) {
  const [pendingFeedback, approvedFeedback] = await Promise.all([
    prisma.productFeedback.findMany({
      where: { status: "PENDING" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productFeedback.findMany({
      where: { status: "APPROVED" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const PAGE_SIZE = 8;

  const pendingSearch = normalizeSearch(searchParams?.pendingSearch);
  const pendingPage = parsePage(searchParams?.pendingPage);
  const pendingFiltered = applySearch(pendingFeedback, pendingSearch, (item) => [
    item.fullName,
    item.message,
    item.product?.name,
  ]);
  const pendingPagination = paginate(pendingFiltered, pendingPage, PAGE_SIZE);

  const approvedSearch = normalizeSearch(searchParams?.approvedSearch);
  const approvedPage = parsePage(searchParams?.approvedPage);
  const approvedFiltered = applySearch(approvedFeedback, approvedSearch, (item) => [
    item.fullName,
    item.message,
    item.product?.name,
  ]);
  const approvedPagination = paginate(approvedFiltered, approvedPage, PAGE_SIZE);

  return (
    <section className="section" id="feedbacks">
      <div className="section-header">
        <div>
          <h2>Product Feedback</h2>
          <p>Approve customer ratings before they appear on the shop page.</p>
        </div>
      </div>

      <div className="section" id="pending-feedback">
        <div className="section-header">
          <div>
            <h3>Pending Feedback</h3>
            <p>Review and approve feedback for products.</p>
          </div>
        </div>
        {pendingFiltered.length > 0 || pendingSearch
          ? renderTableControls({
              searchParams,
              searchKey: "pendingSearch",
              pageKey: "pendingPage",
              searchValue: pendingSearch,
              pagination: pendingPagination,
              placeholder: "Search pending feedback",
              anchor: "pending-feedback",
            })
          : null}
        {pendingFiltered.length === 0 ? <p className="empty-state">No pending feedback.</p> : null}
        {pendingFiltered.length > 0 ? (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Name</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPagination.items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell-truncate">{item.product?.name || "—"}</td>
                    <td className="rating-stars">{renderStars(item.rating)}</td>
                    <td>{item.fullName}</td>
                    <td className="table-cell-muted">{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="table-actions is-inline">
                        <Modal
                          triggerLabel="View"
                          title={`Feedback from ${item.fullName}`}
                          triggerClassName="secondary-button"
                        >
                          <div className="modal-stack">
                            <div>
                              <p className="table-cell-muted">Product: {item.product?.name || "—"}</p>
                              <p className="rating-stars">{renderStars(item.rating)}</p>
                              <p className="modal-message">{item.message}</p>
                            </div>
                          </div>
                        </Modal>
                        <AdminForm action={approveFeedback}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="secondary-button" type="submit">
                            Approve
                          </button>
                        </AdminForm>
                        <AdminForm action={declineFeedback} confirmMessage="Decline and remove this feedback?">
                          <input type="hidden" name="id" value={item.id} />
                          <button className="ghost-button" type="submit">
                            Decline
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
      </div>

      <div className="section" id="approved-feedback">
        <div className="section-header">
          <div>
            <h3>Approved Feedback</h3>
            <p>Visible on the shop page.</p>
          </div>
        </div>
        {approvedFiltered.length > 0 || approvedSearch
          ? renderTableControls({
              searchParams,
              searchKey: "approvedSearch",
              pageKey: "approvedPage",
              searchValue: approvedSearch,
              pagination: approvedPagination,
              placeholder: "Search approved feedback",
              anchor: "approved-feedback",
            })
          : null}
        {approvedFiltered.length === 0 ? <p className="empty-state">No approved feedback yet.</p> : null}
        {approvedFiltered.length > 0 ? (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Name</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedPagination.items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell-truncate">{item.product?.name || "—"}</td>
                    <td className="rating-stars">{renderStars(item.rating)}</td>
                    <td>{item.fullName}</td>
                    <td className="table-cell-muted">{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="table-actions is-inline">
                        <Modal
                          triggerLabel="View"
                          title={`Feedback from ${item.fullName}`}
                          triggerClassName="secondary-button"
                        >
                          <div className="modal-stack">
                            <div>
                              <p className="table-cell-muted">Product: {item.product?.name || "—"}</p>
                              <p className="rating-stars">{renderStars(item.rating)}</p>
                              <p className="modal-message">{item.message}</p>
                            </div>
                          </div>
                        </Modal>
                        <AdminForm action={deleteFeedback} confirmMessage="Delete this feedback?">
                          <input type="hidden" name="id" value={item.id} />
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
      </div>
    </section>
  );
}
