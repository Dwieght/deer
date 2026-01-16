import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import { createGalleryItem, updateGalleryItem, deleteGalleryItem } from "../actions";
import {
  applySearch,
  normalizeImageUrl,
  normalizeSearch,
  paginate,
  parsePage,
  renderTableControls,
} from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function GalleryPage({ searchParams }) {
  const approvedGallery = await prisma.gallerySubmission.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  const PAGE_SIZE = 8;
  const gallerySearch = normalizeSearch(searchParams?.gallerySearch);
  const galleryPage = parsePage(searchParams?.galleryPage);
  const galleryFiltered = applySearch(approvedGallery, gallerySearch, (item) => [
    item.caption,
    item.name,
    item.category,
  ]);
  const galleryPagination = paginate(galleryFiltered, galleryPage, PAGE_SIZE);

  return (
    <section className="section" id="gallery">
      <div className="section-header">
        <div>
          <h2>Fan Gallery</h2>
          <p>Add or edit fan photos, video edits, and fan art.</p>
        </div>
        <Modal triggerLabel="Add Gallery Item" title="Add Gallery Item" triggerClassName="primary-button">
          <AdminForm action={createGalleryItem} className="admin-form">
            <div className="form-row">
              <label htmlFor="admin-gallery-name">
                Contributor Name
                <input id="admin-gallery-name" type="text" name="name" required />
              </label>
              <label htmlFor="admin-gallery-category">
                Category
                <select id="admin-gallery-category" name="category" defaultValue="PHOTOS" required>
                  <option value="PHOTOS">Photo</option>
                  <option value="VIDEOS">Video Edit</option>
                  <option value="ART">Fan Art</option>
                </select>
              </label>
            </div>
            <label htmlFor="admin-gallery-caption">
              Caption / Title
              <input id="admin-gallery-caption" type="text" name="caption" required />
            </label>
            <div className="form-row">
              <label htmlFor="admin-gallery-src">
                Image URL (for photos/art)
                <input id="admin-gallery-src" type="text" name="src" placeholder="https://..." />
              </label>
              <label htmlFor="admin-gallery-embed">
                Video URL (YouTube/TikTok)
                <input
                  id="admin-gallery-embed"
                  type="text"
                  name="embed"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </label>
            </div>
            <p className="form-note">Fill only the image URL for photos/art or the video URL for video edits.</p>
            <button className="primary-button" type="submit">
              Publish Gallery Item
            </button>
          </AdminForm>
        </Modal>
      </div>

      {galleryFiltered.length > 0 || gallerySearch
        ? renderTableControls({
            searchParams,
            searchKey: "gallerySearch",
            pageKey: "galleryPage",
            searchValue: gallerySearch,
            pagination: galleryPagination,
            placeholder: "Search gallery",
            anchor: "gallery",
          })
        : null}

      {galleryFiltered.length === 0 ? <p className="empty-state">No gallery items yet.</p> : null}
      {galleryFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Caption</th>
                <th>Category</th>
                <th>Contributor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {galleryPagination.items.map((item) => (
                <tr key={item.id}>
                  <td className="table-cell-truncate">{item.caption}</td>
                  <td>
                    <span className="badge">{item.category}</span>
                  </td>
                  <td className="table-cell-muted">{item.name}</td>
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
                          <div className="form-card">
                            <h4>Edit Gallery Item</h4>
                            <AdminForm action={updateGalleryItem} className="admin-form">
                              <input type="hidden" name="id" value={item.id} />
                              <label>
                                Contributor Name
                                <input type="text" name="name" defaultValue={item.name} required />
                              </label>
                              <label>
                                Category
                                <select name="category" defaultValue={item.category} required>
                                  <option value="PHOTOS">Photo</option>
                                  <option value="VIDEOS">Video Edit</option>
                                  <option value="ART">Fan Art</option>
                                </select>
                              </label>
                              <label>
                                Caption / Title
                                <input type="text" name="caption" defaultValue={item.caption} required />
                              </label>
                              <label>
                                Image URL
                                <input type="text" name="src" defaultValue={item.src || ""} />
                              </label>
                              <label>
                                Video URL
                                <input type="text" name="embed" defaultValue={item.embed || ""} />
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
                      <AdminForm action={deleteGalleryItem} confirmMessage="Delete this gallery item?">
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
