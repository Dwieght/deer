import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import {
  approveLetter,
  declineLetter,
  approveGallery,
  declineGallery,
  approveContact,
  declineContact,
} from "../actions";
import {
  applySearch,
  formatDate,
  normalizeImageUrl,
  normalizeSearch,
  paginate,
  parsePage,
  renderTableControls,
} from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PendingPage({ searchParams }) {
  const [pendingLetters, pendingGallery, pendingContacts] = await Promise.all([
    prisma.letterSubmission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gallerySubmission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactSubmission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const PAGE_SIZE = 8;

  const pendingLettersSearch = normalizeSearch(searchParams?.pendingLettersSearch);
  const pendingLettersPage = parsePage(searchParams?.pendingLettersPage);
  const pendingLettersFiltered = applySearch(pendingLetters, pendingLettersSearch, (letter) => [
    letter.name,
    letter.messageEn,
    letter.messageAr,
    letter.tiktok,
  ]);
  const pendingLettersPagination = paginate(pendingLettersFiltered, pendingLettersPage, PAGE_SIZE);

  const pendingGallerySearch = normalizeSearch(searchParams?.pendingGallerySearch);
  const pendingGalleryPage = parsePage(searchParams?.pendingGalleryPage);
  const pendingGalleryFiltered = applySearch(pendingGallery, pendingGallerySearch, (item) => [
    item.caption,
    item.name,
    item.category,
  ]);
  const pendingGalleryPagination = paginate(pendingGalleryFiltered, pendingGalleryPage, PAGE_SIZE);

  const pendingContactsSearch = normalizeSearch(searchParams?.pendingContactsSearch);
  const pendingContactsPage = parsePage(searchParams?.pendingContactsPage);
  const pendingContactsFiltered = applySearch(pendingContacts, pendingContactsSearch, (item) => [
    item.name,
    item.email,
    item.type,
    item.message,
  ]);
  const pendingContactsPagination = paginate(pendingContactsFiltered, pendingContactsPage, PAGE_SIZE);

  return (
    <section className="section" id="pending">
      <div className="section-header">
        <div>
          <h2>Pending Submissions</h2>
          <p>Approve or decline new fan submissions before publishing.</p>
        </div>
      </div>

      <div className="section" id="pending-letters">
        <div className="section-header">
          <div>
            <h3>Pending Fan Letters</h3>
            <p>Approve letters to feature them on the homepage.</p>
          </div>
        </div>
        {pendingLettersFiltered.length > 0 || pendingLettersSearch
          ? renderTableControls({
              searchParams,
              searchKey: "pendingLettersSearch",
              pageKey: "pendingLettersPage",
              searchValue: pendingLettersSearch,
              pagination: pendingLettersPagination,
              placeholder: "Search pending letters",
              anchor: "pending-letters",
            })
          : null}
        {pendingLettersFiltered.length === 0 ? <p className="empty-state">No pending letters.</p> : null}
        {pendingLettersFiltered.length > 0 ? (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Fan Name</th>
                  <th>Submitted</th>
                  <th>TikTok</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLettersPagination.items.map((letter) => (
                  <tr key={letter.id}>
                    <td>{letter.name}</td>
                    <td className="table-cell-muted">{formatDate(letter.createdAt)}</td>
                    <td className="table-cell-truncate">
                      {letter.tiktok ? (
                        <a className="table-link" href={letter.tiktok} target="_blank" rel="noopener">
                          {letter.tiktok}
                        </a>
                      ) : (
                        <span className="table-cell-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions is-inline">
                        <Modal
                          triggerLabel="View"
                          title={`Letter from ${letter.name}`}
                          triggerClassName="secondary-button"
                        >
                          <div className="modal-stack">
                            <div>
                              <p className="modal-message">{letter.messageEn}</p>
                              {letter.messageAr ? (
                                <p className="arabic modal-message" lang="ar" dir="rtl">
                                  {letter.messageAr}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </Modal>
                        <AdminForm action={approveLetter}>
                          <input type="hidden" name="id" value={letter.id} />
                          <button className="secondary-button" type="submit">
                            Approve
                          </button>
                        </AdminForm>
                        <AdminForm action={declineLetter} confirmMessage="Decline and remove this letter?">
                          <input type="hidden" name="id" value={letter.id} />
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

      <div className="section" id="pending-gallery">
        <div className="section-header">
          <div>
            <h3>Pending Gallery Submissions</h3>
            <p>Approve photos, video edits, or fan art to publish them.</p>
          </div>
        </div>
        {pendingGalleryFiltered.length > 0 || pendingGallerySearch
          ? renderTableControls({
              searchParams,
              searchKey: "pendingGallerySearch",
              pageKey: "pendingGalleryPage",
              searchValue: pendingGallerySearch,
              pagination: pendingGalleryPagination,
              placeholder: "Search pending gallery",
              anchor: "pending-gallery",
            })
          : null}
        {pendingGalleryFiltered.length === 0 ? <p className="empty-state">No pending gallery items.</p> : null}
        {pendingGalleryFiltered.length > 0 ? (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Caption</th>
                  <th>Category</th>
                  <th>Contributor</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingGalleryPagination.items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell-truncate">{item.caption}</td>
                    <td>
                      <span className="badge">{item.category}</span>
                    </td>
                    <td className="table-cell-muted">{item.name}</td>
                    <td className="table-cell-muted">{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <Modal triggerLabel="View" title={item.caption} triggerClassName="secondary-button">
                          <div className="modal-stack">
                            <div>
                              <p className="table-cell-muted">By {item.name}</p>
                              {item.category === "VIDEOS" && item.embed ? (
                                <div className="timeline-video">
                                  <iframe
                                    src={item.embed}
                                    title={item.caption}
                                    loading="lazy"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              ) : null}
                              {item.category !== "VIDEOS" && item.src ? (
                                <img
                                  src={normalizeImageUrl(item.src)}
                                  alt={item.caption}
                                  className="dashboard-image"
                                />
                              ) : null}
                            </div>
                          </div>
                        </Modal>
                        <AdminForm action={approveGallery}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="secondary-button" type="submit">
                            Approve
                          </button>
                        </AdminForm>
                        <AdminForm action={declineGallery} confirmMessage="Decline and remove this submission?">
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

      <div className="section" id="pending-contacts">
        <div className="section-header">
          <div>
            <h3>Pending Contact Submissions</h3>
            <p>Review community notes and coordination requests.</p>
          </div>
        </div>
        {pendingContactsFiltered.length > 0 || pendingContactsSearch
          ? renderTableControls({
              searchParams,
              searchKey: "pendingContactsSearch",
              pageKey: "pendingContactsPage",
              searchValue: pendingContactsSearch,
              pagination: pendingContactsPagination,
              placeholder: "Search pending contacts",
              anchor: "pending-contacts",
            })
          : null}
        {pendingContactsFiltered.length === 0 ? <p className="empty-state">No pending messages.</p> : null}
        {pendingContactsFiltered.length > 0 ? (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Email</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingContactsPagination.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="table-cell-muted">{item.type}</td>
                    <td className="table-cell-truncate">{item.email}</td>
                    <td className="table-cell-muted">{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <Modal
                          triggerLabel="View"
                          title={`Message from ${item.name}`}
                          triggerClassName="secondary-button"
                        >
                          <div className="modal-stack">
                            <div>
                              <p className="table-cell-muted">{item.email}</p>
                              <p className="modal-message">{item.message}</p>
                            </div>
                          </div>
                        </Modal>
                        <AdminForm action={approveContact}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="secondary-button" type="submit">
                            Approve
                          </button>
                        </AdminForm>
                        <AdminForm action={declineContact} confirmMessage="Decline and delete this message?">
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
    </section>
  );
}
