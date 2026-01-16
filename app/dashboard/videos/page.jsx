import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import {
  createVideoCollection,
  updateVideoCollection,
  deleteVideoCollection,
  createVideoItem,
  updateVideoItem,
  deleteVideoItem,
} from "../actions";
import {
  applySearch,
  normalizeSearch,
  paginate,
  parsePage,
  renderTableControls,
} from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function VideosPage({ searchParams }) {
  const videoCollections = await prisma.videoCollection.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const PAGE_SIZE = 6;
  const videosSearch = normalizeSearch(searchParams?.videosSearch);
  const videosPage = parsePage(searchParams?.videosPage);
  const videosFiltered = applySearch(videoCollections, videosSearch, (collection) => [
    collection.title,
    collection.description,
    collection.layout,
  ]);
  const videosPagination = paginate(videosFiltered, videosPage, PAGE_SIZE);

  return (
    <section className="section" id="videos">
      <div className="section-header">
        <div>
          <h2>Video Library</h2>
          <p>Create and organize the Deer Army video collections.</p>
        </div>
        <Modal triggerLabel="Add Collection" title="Add Video Collection" triggerClassName="primary-button">
          <AdminForm action={createVideoCollection} className="admin-form">
            <div className="form-row">
              <label htmlFor="video-collection-title">
                Title
                <input id="video-collection-title" type="text" name="title" required />
              </label>
              <label htmlFor="video-collection-layout">
                Layout
                <select id="video-collection-layout" name="layout" defaultValue="GRID" required>
                  <option value="GRID">Grid</option>
                  <option value="CAROUSEL">Carousel</option>
                </select>
              </label>
            </div>
            <label htmlFor="video-collection-description">
              Description
              <textarea id="video-collection-description" name="description" rows="3"></textarea>
            </label>
            <button className="primary-button" type="submit">
              Add Collection
            </button>
          </AdminForm>
        </Modal>
      </div>

      {videosFiltered.length > 0 || videosSearch
        ? renderTableControls({
            searchParams,
            searchKey: "videosSearch",
            pageKey: "videosPage",
            searchValue: videosSearch,
            pagination: videosPagination,
            placeholder: "Search collections",
            anchor: "videos",
          })
        : null}

      {videosFiltered.length === 0 ? <p className="empty-state">No video collections yet.</p> : null}
      {videosFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Layout</th>
                <th>Videos</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videosPagination.items.map((collection) => (
                <tr key={collection.id}>
                  <td className="table-cell-truncate">{collection.title}</td>
                  <td>
                    <span className="badge">{collection.layout}</span>
                  </td>
                  <td className="table-cell-muted">{collection.items.length}</td>
                  <td>
                    <div className="table-actions">
                      <Modal
                        triggerLabel="View"
                        title={`Collection: ${collection.title}`}
                        triggerClassName="secondary-button"
                      >
                        <div className="modal-stack">
                          <div>
                            <p className="table-cell-muted">Layout: {collection.layout}</p>
                            {collection.description ? <p>{collection.description}</p> : null}
                          </div>
                          <div className="form-card">
                            <h4>Edit Collection</h4>
                            <AdminForm action={updateVideoCollection} className="admin-form">
                              <input type="hidden" name="id" value={collection.id} />
                              <label>
                                Title
                                <input type="text" name="title" defaultValue={collection.title} required />
                              </label>
                              <label>
                                Layout
                                <select name="layout" defaultValue={collection.layout} required>
                                  <option value="GRID">Grid</option>
                                  <option value="CAROUSEL">Carousel</option>
                                </select>
                              </label>
                              <label>
                                Description
                                <textarea name="description" rows="3" defaultValue={collection.description || ""}></textarea>
                              </label>
                              <div className="action-row">
                                <button className="secondary-button" type="submit">
                                  Save Collection
                                </button>
                              </div>
                            </AdminForm>
                          </div>

                          <div className="form-card">
                            <h4>Add Video Item</h4>
                            <AdminForm action={createVideoItem} className="admin-form">
                              <input type="hidden" name="collectionId" value={collection.id} />
                              <label>
                                Title
                                <input type="text" name="title" required />
                              </label>
                              <label>
                                Video URL
                                <input type="text" name="url" placeholder="https://drive.google.com/file/d/.../view" required />
                              </label>
                              <button className="primary-button" type="submit">
                                Add Video
                              </button>
                            </AdminForm>
                          </div>

                          <div>
                            <h4>Video Items</h4>
                            {collection.items.length === 0 ? (
                              <p className="empty-state">No videos in this collection.</p>
                            ) : (
                              <div className="dashboard-grid">
                                {collection.items.map((item) => (
                                  <div key={item.id} className="modal-card">
                                    <h5>{item.title}</h5>
                                    <p className="table-cell-muted">{item.url}</p>
                                    <div className="timeline-video">
                                      <iframe
                                        src={item.url}
                                        title={item.title}
                                        loading="lazy"
                                        allow="autoplay; encrypted-media; fullscreen"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                    <AdminForm action={updateVideoItem} className="admin-form">
                                      <input type="hidden" name="id" value={item.id} />
                                      <label>
                                        Title
                                        <input type="text" name="title" defaultValue={item.title} required />
                                      </label>
                                      <label>
                                        Video URL
                                        <input type="text" name="url" defaultValue={item.url} required />
                                      </label>
                                      <div className="action-row">
                                        <button className="secondary-button" type="submit">
                                          Save Video
                                        </button>
                                      </div>
                                    </AdminForm>
                                    <AdminForm action={deleteVideoItem} confirmMessage="Delete this video?">
                                      <input type="hidden" name="id" value={item.id} />
                                      <button className="ghost-button" type="submit">
                                        Delete Video
                                      </button>
                                    </AdminForm>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Modal>
                      <AdminForm
                        action={deleteVideoCollection}
                        confirmMessage="Delete this collection and all its videos?"
                      >
                        <input type="hidden" name="id" value={collection.id} />
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
