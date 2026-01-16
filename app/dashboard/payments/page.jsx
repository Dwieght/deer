import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import {
  createPaymentQr,
  updatePaymentQr,
  deletePaymentQr,
  updatePaymentSubmission,
  updatePaymentSubmissionDetails,
  deletePaymentSubmission,
} from "../actions";
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

export default async function PaymentsPage({ searchParams }) {
  const [paymentQrs, paymentSubmissions] = await Promise.all([
    prisma.paymentQrCode.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.paymentSubmission.findMany({
      orderBy: { createdAt: "desc" },
      include: { qrCode: true },
    }),
  ]);

  const PAGE_SIZE = 8;

  const qrsSearch = normalizeSearch(searchParams?.qrsSearch);
  const qrsPage = parsePage(searchParams?.qrsPage);
  const qrsFiltered = applySearch(paymentQrs, qrsSearch, (qr) => [qr.title, qr.note, qr.imageUrl]);
  const qrsPagination = paginate(qrsFiltered, qrsPage, PAGE_SIZE);

  const paymentsSearch = normalizeSearch(searchParams?.paymentsSearch);
  const paymentsPage = parsePage(searchParams?.paymentsPage);
  const paymentsFiltered = applySearch(paymentSubmissions, paymentsSearch, (submission) => [
    submission.senderName,
    submission.referenceNumber,
    submission.qrCode?.title,
    submission.amount,
  ]);
  const paymentsPagination = paginate(paymentsFiltered, paymentsPage, PAGE_SIZE);

  return (
    <section className="section" id="payments">
      <div className="section-header">
        <div>
          <h2>Payment QR Codes</h2>
          <p>Add QR codes and review payment references from supporters.</p>
        </div>
        <Modal triggerLabel="Add QR Code" title="Add QR Code" triggerClassName="primary-button">
          <AdminForm action={createPaymentQr} className="admin-form">
            <label htmlFor="payment-qr-title">
              Title
              <input id="payment-qr-title" type="text" name="title" />
            </label>
            <label htmlFor="payment-qr-note">
              Note
              <textarea id="payment-qr-note" name="note" rows="3"></textarea>
            </label>
            <label htmlFor="payment-qr-image">
              QR Image URL
              <input id="payment-qr-image" type="text" name="imageUrl" placeholder="https://..." required />
            </label>
            <button className="primary-button" type="submit">
              Add QR Code
            </button>
          </AdminForm>
        </Modal>
      </div>

      {qrsFiltered.length > 0 || qrsSearch
        ? renderTableControls({
            searchParams,
            searchKey: "qrsSearch",
            pageKey: "qrsPage",
            searchValue: qrsSearch,
            pagination: qrsPagination,
            placeholder: "Search QR codes",
            anchor: "payments",
          })
        : null}

      {qrsFiltered.length === 0 ? <p className="empty-state">No QR codes yet.</p> : null}
      {qrsFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Note</th>
                <th>Preview</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {qrsPagination.items.map((qr) => (
                <tr key={qr.id}>
                  <td className="table-cell-truncate">{qr.title || "Deer Army QR Code"}</td>
                  <td className="table-cell-truncate table-cell-muted">{qr.note || "—"}</td>
                  <td>
                    <img
                      src={getQrPreviewUrl(qr.imageUrl)}
                      alt={qr.title || "Payment QR code"}
                      className="table-image"
                    />
                  </td>
                  <td>
                    <div className="table-actions is-inline">
                      <Modal triggerLabel="View" title={qr.title || "Payment QR Code"} triggerClassName="secondary-button">
                        <div className="modal-stack">
                          <div>
                            <img
                              src={getQrPreviewUrl(qr.imageUrl)}
                              alt={qr.title || "Payment QR code"}
                              className="dashboard-image"
                            />
                            {qr.note ? <p>{qr.note}</p> : null}
                          </div>
                        </div>
                      </Modal>
                      <Modal
                        triggerLabel="Edit"
                        title={`Edit QR: ${qr.title || "Deer Army"}`}
                        triggerClassName="secondary-button"
                      >
                        <AdminForm action={updatePaymentQr} className="admin-form">
                          <input type="hidden" name="id" value={qr.id} />
                          <label>
                            Title
                            <input type="text" name="title" defaultValue={qr.title || ""} />
                          </label>
                          <label>
                            Note
                            <textarea name="note" rows="3" defaultValue={qr.note || ""}></textarea>
                          </label>
                          <label>
                            QR Image URL
                            <input type="text" name="imageUrl" defaultValue={qr.imageUrl} required />
                          </label>
                          <div className="action-row">
                            <button className="secondary-button" type="submit">
                              Update QR
                            </button>
                          </div>
                        </AdminForm>
                      </Modal>
                      <AdminForm action={deletePaymentQr} confirmMessage="Delete this QR code?">
                        <input type="hidden" name="id" value={qr.id} />
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

      <h3 className="dashboard-subheading" id="payment-submissions">
        Payment References
      </h3>
      {paymentsFiltered.length > 0 || paymentsSearch
        ? renderTableControls({
            searchParams,
            searchKey: "paymentsSearch",
            pageKey: "paymentsPage",
            searchValue: paymentsSearch,
            pagination: paymentsPagination,
            placeholder: "Search payments",
            anchor: "payment-submissions",
          })
        : null}

      {paymentsFiltered.length === 0 ? <p className="empty-state">No payment references yet.</p> : null}
      {paymentsFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Reference</th>
                <th>QR Code</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentsPagination.items.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.senderName}</td>
                  <td className="table-cell-truncate">{submission.referenceNumber}</td>
                  <td className="table-cell-truncate table-cell-muted">
                    {submission.qrCode?.title || "Deer Army QR Code"}
                  </td>
                  <td>{formatAmount(submission.amount)}</td>
                  <td>
                    <span className="badge">{submission.matched ? "Matched" : "Unmatched"}</span>
                  </td>
                  <td className="table-cell-muted">{formatDate(submission.createdAt)}</td>
                  <td>
                    <div className="table-actions is-inline">
                      <Modal
                        triggerLabel="View"
                        title={`Payment from ${submission.senderName}`}
                        triggerClassName="secondary-button"
                      >
                        <div className="modal-stack">
                          <div>
                            <p className="table-cell-muted">{formatDate(submission.createdAt)}</p>
                            <p>Reference: {submission.referenceNumber}</p>
                            <p>QR: {submission.qrCode?.title || "Deer Army QR Code"}</p>
                            <p>Amount: {formatAmount(submission.amount)}</p>
                            <p>Status: {submission.matched ? "Matched" : "Unmatched"}</p>
                          </div>
                        </div>
                      </Modal>
                      <Modal
                        triggerLabel="Edit"
                        title={`Edit Payment: ${submission.senderName}`}
                        triggerClassName="secondary-button"
                      >
                        <AdminForm action={updatePaymentSubmissionDetails} className="admin-form">
                          <input type="hidden" name="id" value={submission.id} />
                          <label>
                            Contributor Name
                            <input type="text" name="senderName" defaultValue={submission.senderName} required />
                          </label>
                          <label>
                            Reference Number
                            <input type="text" name="referenceNumber" defaultValue={submission.referenceNumber} required />
                          </label>
                          <label>
                            Amount
                            <input type="number" name="amount" min="0" step="0.01" defaultValue={submission.amount ?? ""} />
                          </label>
                          <div className="action-row">
                            <button className="secondary-button" type="submit">
                              Update Contribution
                            </button>
                          </div>
                        </AdminForm>
                      </Modal>
                      <AdminForm action={updatePaymentSubmission}>
                        <input type="hidden" name="id" value={submission.id} />
                        <input type="hidden" name="matched" value={submission.matched ? "false" : "true"} />
                        <button className="secondary-button" type="submit">
                          {submission.matched ? "Mark Unmatched" : "Mark Matched"}
                        </button>
                      </AdminForm>
                      <AdminForm action={deletePaymentSubmission} confirmMessage="Delete this payment reference?">
                        <input type="hidden" name="id" value={submission.id} />
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
