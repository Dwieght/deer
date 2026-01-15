import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../lib/auth";
import AdminForm from "./admin-form";
import Modal from "./modal";
import {
  approveLetter,
  declineLetter,
  approveGallery,
  declineGallery,
  approveContact,
  declineContact,
  logoutAction,
  createLetter,
  updateLetter,
  deleteLetter,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  createVideoCollection,
  updateVideoCollection,
  deleteVideoCollection,
  createVideoItem,
  updateVideoItem,
  deleteVideoItem,
  createPaymentQr,
  updatePaymentQr,
  deletePaymentQr,
  updatePaymentSubmission,
  deletePaymentSubmission,
  upsertAbout,
  upsertUser,
} from "./actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateInput(dateValue) {
  if (!dateValue) {
    return "";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-CA");
}

function normalizeImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }
  if (!value.includes("drive.google.com")) {
    return value;
  }
  const fileMatch = value.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  }
  const idMatch = value.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  }
  if (value.includes("/uc?")) {
    return value.replace("export=download", "export=view");
  }
  return value;
}

function extractDriveFileId(url) {
  if (!url || !url.includes("drive.google.com")) {
    return "";
  }
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return idMatch[1];
  }
  return "";
}

function driveThumbnailUrl(url) {
  const id = extractDriveFileId(url);
  if (!id) {
    return "";
  }
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}

function getQrPreviewUrl(url) {
  return driveThumbnailUrl(url) || normalizeImageUrl(url);
}

export default async function DashboardPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  let session = null;
  try {
    session = verifySessionToken(token);
  } catch (error) {
    redirect("/login");
  }
  if (!session) {
    redirect("/login");
  }

  const [
    pendingLetters,
    approvedLetters,
    pendingGallery,
    approvedGallery,
    pendingContacts,
    announcements,
    about,
    users,
    videoCollections,
    paymentQrs,
    paymentSubmissions,
  ] = await Promise.all([
    prisma.letterSubmission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.letterSubmission.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gallerySubmission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gallerySubmission.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactSubmission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.announcement.findMany({
      orderBy: { date: "desc" },
    }),
    prisma.aboutContent.findUnique({ where: { key: "primary" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.videoCollection.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.paymentQrCode.findMany({
      orderBy: { createdAt: "asc" },
    }),
    prisma.paymentSubmission.findMany({
      orderBy: { createdAt: "desc" },
      include: { qrCode: true },
    }),
  ]);

  return (
    <main className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <img src="/assets/logo_no_bg.png" alt="Deer Army logo" />
          <div>
            <p className="dashboard-title">Deer Army Admin</p>
            <p className="dashboard-subtitle">Manage community content</p>
          </div>
        </div>
        <nav className="dashboard-nav" aria-label="Admin sections">
          <a href="/">Home</a>
          <a href="#dashboard-overview">Overview</a>
          <a href="#dashboard-letters">Fan Letters</a>
          <a href="#dashboard-announcements">Announcements</a>
          <a href="#dashboard-gallery">Fan Gallery</a>
          <a href="#dashboard-videos">Video Library</a>
          <a href="#dashboard-payments">Payment QR</a>
          <a href="#dashboard-about">About Deer Army</a>
          <a href="#dashboard-users">Admin Users</a>
          <a href="#dashboard-pending">Pending Submissions</a>
        </nav>
      </aside>

      <div className="dashboard-content">
        <section className="section" id="dashboard-overview">
          <div className="section-header">
            <div>
              <h2>Dashboard</h2>
              <p>Publish updates, manage fan content, and review submissions.</p>
            </div>
            <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
          </div>
          <div className="dashboard-actions">
            <span className="badge">Signed in as {session.email}</span>
            <form action={logoutAction}>
              <button className="ghost-button" type="submit">
                Log out
              </button>
            </form>
          </div>
        </section>

        <section className="section" id="dashboard-letters">
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

          {approvedLetters.length === 0 ? <p className="empty-state">No published letters yet.</p> : null}
          {approvedLetters.length > 0 ? (
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
                  {approvedLetters.map((letter) => (
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
                                <p>{letter.messageEn}</p>
                                {letter.messageAr ? (
                                  <p className="arabic" lang="ar" dir="rtl">
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

        <section className="section" id="dashboard-announcements">
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

          {announcements.length === 0 ? <p className="empty-state">No announcements yet.</p> : null}
          {announcements.length > 0 ? (
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
                  {announcements.map((item) => (
                    <tr key={item.id}>
                      <td className="table-cell-truncate">{item.title}</td>
                      <td>
                        <span className="badge">{item.type === "UPDATE" ? "Update" : "Board"}</span>
                      </td>
                      <td className="table-cell-muted">{formatDate(item.date)}</td>
                      <td>
                        <div className="table-actions">
                          <Modal
                            triggerLabel="View"
                            title={item.title}
                            triggerClassName="secondary-button"
                          >
                            <div className="modal-stack">
                              <div>
                                <p className="table-cell-muted">{formatDate(item.date)}</p>
                                <p>{item.text}</p>
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

        <section className="section" id="dashboard-gallery">
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

          {approvedGallery.length === 0 ? <p className="empty-state">No gallery items yet.</p> : null}
          {approvedGallery.length > 0 ? (
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
                  {approvedGallery.map((item) => (
                    <tr key={item.id}>
                      <td className="table-cell-truncate">{item.caption}</td>
                      <td>
                        <span className="badge">{item.category}</span>
                      </td>
                      <td className="table-cell-muted">{item.name}</td>
                      <td>
                        <div className="table-actions">
                          <Modal
                            triggerLabel="View"
                            title={item.caption}
                            triggerClassName="secondary-button"
                          >
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

        <section className="section" id="dashboard-videos">
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

          {videoCollections.length === 0 ? <p className="empty-state">No video collections yet.</p> : null}
          {videoCollections.length > 0 ? (
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
                  {videoCollections.map((collection) => (
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

        <section className="section" id="dashboard-payments">
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

          {paymentQrs.length === 0 ? <p className="empty-state">No QR codes yet.</p> : null}
          {paymentQrs.length > 0 ? (
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
                  {paymentQrs.map((qr) => (
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
                        <div className="table-actions">
                          <Modal
                            triggerLabel="View"
                            title={qr.title || "Payment QR Code"}
                            triggerClassName="secondary-button"
                          >
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

          <h3 className="dashboard-subheading">Payment References</h3>
          {paymentSubmissions.length === 0 ? (
            <p className="empty-state">No payment references yet.</p>
          ) : null}
          {paymentSubmissions.length > 0 ? (
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Reference</th>
                    <th>QR Code</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentSubmissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>{submission.senderName}</td>
                      <td className="table-cell-truncate">{submission.referenceNumber}</td>
                      <td className="table-cell-truncate table-cell-muted">
                        {submission.qrCode?.title || "Deer Army QR Code"}
                      </td>
                      <td>
                        <span className="badge">{submission.matched ? "Matched" : "Unmatched"}</span>
                      </td>
                      <td className="table-cell-muted">{formatDate(submission.createdAt)}</td>
                      <td>
                        <div className="table-actions">
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
                                <p>Status: {submission.matched ? "Matched" : "Unmatched"}</p>
                              </div>
                            </div>
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

        <section className="section" id="dashboard-about">
          <div className="section-header">
            <div>
              <h2>About Deer Army</h2>
              <p>Update the community story and mission statement.</p>
            </div>
            <Modal triggerLabel="Edit Content" title="Edit About Content" triggerClassName="primary-button">
              <AdminForm action={upsertAbout} className="admin-form">
                <label htmlFor="about-story">
                  Our Story
                  <textarea id="about-story" name="story" rows="4" defaultValue={about?.story || ""} required></textarea>
                </label>
                <label htmlFor="about-mission">
                  Mission Statement
                  <textarea
                    id="about-mission"
                    name="mission"
                    rows="4"
                    defaultValue={about?.mission || ""}
                    required
                  ></textarea>
                </label>
                <label htmlFor="about-guidelines">
                  Community Guidelines (one per line)
                  <textarea
                    id="about-guidelines"
                    name="guidelines"
                    rows="4"
                    defaultValue={about?.guidelines?.join("\n") || ""}
                    required
                  ></textarea>
                </label>
                <button className="primary-button" type="submit">
                  Save About Content
                </button>
              </AdminForm>
            </Modal>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Community Story &amp; Mission</td>
                  <td className="table-cell-muted">{about ? formatDate(about.updatedAt) : "Not set"}</td>
                  <td>
                    <Modal
                      triggerLabel="View"
                      title="About Deer Army"
                      triggerClassName="secondary-button"
                    >
                      <div className="modal-stack">
                        <div>
                          {about?.story ? <p>{about.story}</p> : <p className="empty-state">Add your story.</p>}
                          {about?.mission ? <p>{about.mission}</p> : null}
                          {about?.guidelines?.length ? (
                            <ul>
                              {about.guidelines.map((line, index) => (
                                <li key={`${line}-${index}`}>{line}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        <div className="form-card">
                          <h4>Edit About</h4>
                          <AdminForm action={upsertAbout} className="admin-form">
                            <label>
                              Our Story
                              <textarea name="story" rows="4" defaultValue={about?.story || ""} required></textarea>
                            </label>
                            <label>
                              Mission Statement
                              <textarea name="mission" rows="4" defaultValue={about?.mission || ""} required></textarea>
                            </label>
                            <label>
                              Community Guidelines (one per line)
                              <textarea
                                name="guidelines"
                                rows="4"
                                defaultValue={about?.guidelines?.join("\n") || ""}
                                required
                              ></textarea>
                            </label>
                            <div className="action-row">
                              <button className="secondary-button" type="submit">
                                Save About Content
                              </button>
                            </div>
                          </AdminForm>
                        </div>
                      </div>
                    </Modal>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="section" id="dashboard-users">
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

          {users.length === 0 ? <p className="empty-state">No admin users found.</p> : null}
          {users.length > 0 ? (
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
                  {users.map((user) => (
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

        <section className="section" id="dashboard-pending">
          <div className="section-header">
            <div>
              <h2>Pending Submissions</h2>
              <p>Approve or decline new fan submissions before publishing.</p>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <div>
                <h3>Pending Fan Letters</h3>
                <p>Approve letters to feature them on the homepage.</p>
              </div>
            </div>
            {pendingLetters.length === 0 ? <p className="empty-state">No pending letters.</p> : null}
            {pendingLetters.length > 0 ? (
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
                    {pendingLetters.map((letter) => (
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

          <div className="section">
            <div className="section-header">
              <div>
                <h3>Pending Gallery Submissions</h3>
                <p>Approve photos, video edits, or fan art to publish them.</p>
              </div>
            </div>
            {pendingGallery.length === 0 ? <p className="empty-state">No pending gallery items.</p> : null}
            {pendingGallery.length > 0 ? (
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
                    {pendingGallery.map((item) => (
                      <tr key={item.id}>
                        <td className="table-cell-truncate">{item.caption}</td>
                        <td>
                          <span className="badge">{item.category}</span>
                        </td>
                        <td className="table-cell-muted">{item.name}</td>
                        <td className="table-cell-muted">{formatDate(item.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <Modal
                              triggerLabel="View"
                              title={item.caption}
                              triggerClassName="secondary-button"
                            >
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

          <div className="section">
            <div className="section-header">
              <div>
                <h3>Pending Contact Submissions</h3>
                <p>Review community notes and coordination requests.</p>
              </div>
            </div>
            {pendingContacts.length === 0 ? <p className="empty-state">No pending messages.</p> : null}
            {pendingContacts.length > 0 ? (
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
                    {pendingContacts.map((item) => (
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
                                  <p>{item.message}</p>
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
      </div>
    </main>
  );
}
