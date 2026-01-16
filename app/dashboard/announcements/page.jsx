import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "../actions";
import {
  applySearch,
  formatDate,
  formatDateInput,
  normalizeSearch,
  paginate,
  parsePage,
  renderTableControls,
} from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({ searchParams }) {
  const announcements = await prisma.announcement.findMany({
    orderBy: { date: "desc" },
  });

  const PAGE_SIZE = 8;
  const announcementsSearch = normalizeSearch(searchParams?.announcementsSearch);
  const announcementsPage = parsePage(searchParams?.announcementsPage);
  const announcementsFiltered = applySearch(announcements, announcementsSearch, (item) => [
    item.title,
    item.text,
    item.type,
  ]);
  const announcementsPagination = paginate(announcementsFiltered, announcementsPage, PAGE_SIZE);

  return (
    <section className="section" id="announcements">
      <div className="section-header">
        <div>
          <h2>Announcements &amp; Updates</h2>
          <p>Create and edit the community timeline.</p>
        </div>
        <Modal triggerLabel="Add Announcement" title="Add Announcement" triggerClassName="primary-button">
          <AdminForm action={createAnnouncement} className="admin-form">
            <div className="form-row">
              <label htmlFor="admin-announcement-title">
                Title
                <input id="admin-announcement-title" type="text" name="title" required />
              </label>
              <label htmlFor="admin-announcement-date">
                Date
                <input id="admin-announcement-date" type="date" name="date" required />
              </label>
            </div>
            <label htmlFor="admin-announcement-type">
              Type
              <select id="admin-announcement-type" name="type" defaultValue="UPDATE" required>
                <option value="UPDATE">Latest Update</option>
                <option value="BOARD">Announcements Board</option>
              </select>
            </label>
            <label htmlFor="admin-announcement-text">
              Details
              <textarea id="admin-announcement-text" name="text" rows="3" required></textarea>
            </label>
            <button className="primary-button" type="submit">
              Add Announcement
            </button>
          </AdminForm>
        </Modal>
      </div>

      {announcementsFiltered.length > 0 || announcementsSearch
        ? renderTableControls({
            searchParams,
            searchKey: "announcementsSearch",
            pageKey: "announcementsPage",
            searchValue: announcementsSearch,
            pagination: announcementsPagination,
            placeholder: "Search announcements",
            anchor: "announcements",
          })
        : null}

      {announcementsFiltered.length === 0 ? <p className="empty-state">No announcements yet.</p> : null}
      {announcementsFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcementsPagination.items.map((item) => (
                <tr key={item.id}>
                  <td className="table-cell-truncate">{item.title}</td>
                  <td>
                    <span className="badge">{item.type === "UPDATE" ? "Update" : "Board"}</span>
                  </td>
                  <td className="table-cell-muted">{formatDate(item.date)}</td>
                  <td>
                    <div className="table-actions">
                      <Modal triggerLabel="View" title={item.title} triggerClassName="secondary-button">
                        <div className="modal-stack">
                          <div>
                            <p className="table-cell-muted">{formatDate(item.date)}</p>
                            <p className="modal-message">{item.text}</p>
                          </div>
                          <div className="form-card">
                            <h4>Edit Announcement</h4>
                            <AdminForm action={updateAnnouncement} className="admin-form">
                              <input type="hidden" name="id" value={item.id} />
                              <label>
                                Title
                                <input type="text" name="title" defaultValue={item.title} required />
                              </label>
                              <label>
                                Date
                                <input type="date" name="date" defaultValue={formatDateInput(item.date)} required />
                              </label>
                              <label>
                                Type
                                <select name="type" defaultValue={item.type} required>
                                  <option value="UPDATE">Latest Update</option>
                                  <option value="BOARD">Announcements Board</option>
                                </select>
                              </label>
                              <label>
                                Details
                                <textarea name="text" rows="3" defaultValue={item.text} required></textarea>
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
                      <AdminForm action={deleteAnnouncement} confirmMessage="Delete this announcement?">
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
    </section>
  );
}
