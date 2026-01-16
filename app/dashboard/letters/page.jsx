import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import { createLetter, updateLetter, deleteLetter } from "../actions";
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

export default async function LettersPage({ searchParams }) {
  const approvedLetters = await prisma.letterSubmission.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  const PAGE_SIZE = 8;
  const lettersSearch = normalizeSearch(searchParams?.lettersSearch);
  const lettersPage = parsePage(searchParams?.lettersPage);
  const lettersFiltered = applySearch(approvedLetters, lettersSearch, (letter) => [
    letter.name,
    letter.messageEn,
    letter.messageAr,
    letter.tiktok,
  ]);
  const lettersPagination = paginate(lettersFiltered, lettersPage, PAGE_SIZE);

  return (
    <section className="section" id="letters">
      <div className="section-header">
        <div>
          <h2>Fan Letters</h2>
          <p>Add new letters or edit the published collection.</p>
        </div>
        <Modal triggerLabel="Add Letter" title="Add Fan Letter" triggerClassName="primary-button">
          <AdminForm action={createLetter} className="admin-form">
            <div className="form-row">
              <label htmlFor="admin-letter-name">
                Fan Name
                <input id="admin-letter-name" type="text" name="name" required />
              </label>
              <label htmlFor="admin-letter-tiktok">
                TikTok Link
                <input id="admin-letter-tiktok" type="url" name="tiktok" />
              </label>
            </div>
            <div className="form-row">
              <label htmlFor="admin-letter-message-en">
                Message (English)
                <textarea id="admin-letter-message-en" name="messageEn" rows="3" required></textarea>
              </label>
              <label htmlFor="admin-letter-message-ar">
                Message (Arabic)
                <textarea id="admin-letter-message-ar" name="messageAr" rows="3"></textarea>
              </label>
            </div>
            <button className="primary-button" type="submit">
              Publish Letter
            </button>
          </AdminForm>
        </Modal>
      </div>

      {lettersFiltered.length > 0 || lettersSearch
        ? renderTableControls({
            searchParams,
            searchKey: "lettersSearch",
            pageKey: "lettersPage",
            searchValue: lettersSearch,
            pagination: lettersPagination,
            placeholder: "Search letters",
            anchor: "letters",
          })
        : null}

      {lettersFiltered.length === 0 ? <p className="empty-state">No published letters yet.</p> : null}
      {lettersFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Fan Name</th>
                <th>TikTok</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lettersPagination.items.map((letter) => (
                <tr key={letter.id}>
                  <td>{letter.name}</td>
                  <td className="table-cell-truncate">
                    {letter.tiktok ? (
                      <a className="table-link" href={letter.tiktok} target="_blank" rel="noopener">
                        {letter.tiktok}
                      </a>
                    ) : (
                      <span className="table-cell-muted">—</span>
                    )}
                  </td>
                  <td className="table-cell-muted">{formatDate(letter.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Modal
                        triggerLabel="View"
                        title={`Letter from ${letter.name}`}
                        triggerClassName="secondary-button"
                      >
                        <div className="modal-stack">
                          <div>
                            <p className="table-cell-muted">Submitted {formatDate(letter.createdAt)}</p>
                            <p className="modal-message">{letter.messageEn}</p>
                            {letter.messageAr ? (
                              <p className="arabic modal-message" lang="ar" dir="rtl">
                                {letter.messageAr}
                              </p>
                            ) : null}
                            {letter.tiktok ? (
                              <a className="table-link" href={letter.tiktok} target="_blank" rel="noopener">
                                TikTok Link
                              </a>
                            ) : null}
                          </div>
                          <div className="form-card">
                            <h4>Edit Letter</h4>
                            <AdminForm action={updateLetter} className="admin-form">
                              <input type="hidden" name="id" value={letter.id} />
                              <label>
                                Fan Name
                                <input type="text" name="name" defaultValue={letter.name} required />
                              </label>
                              <label>
                                TikTok Link
                                <input type="url" name="tiktok" defaultValue={letter.tiktok || ""} />
                              </label>
                              <label>
                                Message (English)
                                <textarea name="messageEn" rows="3" defaultValue={letter.messageEn} required></textarea>
                              </label>
                              <label>
                                Message (Arabic)
                                <textarea name="messageAr" rows="3" defaultValue={letter.messageAr || ""}></textarea>
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
                      <AdminForm action={deleteLetter} confirmMessage="Delete this letter?">
                        <input type="hidden" name="id" value={letter.id} />
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
