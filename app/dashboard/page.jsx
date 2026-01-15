import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../lib/auth";
import AdminForm from "./admin-form";
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
  ]);

  const updates = announcements.filter((item) => item.type === "UPDATE");
  const boardAnnouncements = announcements.filter((item) => item.type === "BOARD");

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
          </div>
          <div className="form-card">
            <h3>Add Fan Letter</h3>
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
          </div>

          <h3 className="dashboard-subheading">Published Letters</h3>
          {approvedLetters.length === 0 ? <p className="empty-state">No published letters yet.</p> : null}
          <div className="dashboard-grid">
            {approvedLetters.map((letter) => (
              <article key={letter.id} className="card">
                <span className="badge">Published {formatDate(letter.createdAt)}</span>
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
                <AdminForm action={deleteLetter} className="action-row" confirmMessage="Delete this letter?">
                  <input type="hidden" name="id" value={letter.id} />
                  <button className="ghost-button" type="submit">
                    Delete Letter
                  </button>
                </AdminForm>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="dashboard-announcements">
          <div className="section-header">
            <div>
              <h2>Announcements &amp; Updates</h2>
              <p>Create and edit the community timeline.</p>
            </div>
          </div>
          <div className="form-card">
            <h3>Add Announcement</h3>
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
          </div>

          <h3 className="dashboard-subheading">Latest Updates</h3>
          {updates.length === 0 ? <p className="empty-state">No updates yet.</p> : null}
          <div className="dashboard-grid">
            {updates.map((item) => (
              <article key={item.id} className="card">
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
                <AdminForm action={deleteAnnouncement} className="action-row" confirmMessage="Delete this announcement?">
                  <input type="hidden" name="id" value={item.id} />
                  <button className="ghost-button" type="submit">
                    Delete
                  </button>
                </AdminForm>
              </article>
            ))}
          </div>

          <h3 className="dashboard-subheading">Announcements Board</h3>
          {boardAnnouncements.length === 0 ? <p className="empty-state">No announcements yet.</p> : null}
          <div className="dashboard-grid">
            {boardAnnouncements.map((item) => (
              <article key={item.id} className="card">
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
                <AdminForm action={deleteAnnouncement} className="action-row" confirmMessage="Delete this announcement?">
                  <input type="hidden" name="id" value={item.id} />
                  <button className="ghost-button" type="submit">
                    Delete
                  </button>
                </AdminForm>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="dashboard-gallery">
          <div className="section-header">
            <div>
              <h2>Fan Gallery</h2>
              <p>Add or edit fan photos, video edits, and fan art.</p>
            </div>
          </div>
          <div className="form-card">
            <h3>Add Gallery Item</h3>
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
                  <input
                    id="admin-gallery-src"
                    type="text"
                    name="src"
                    placeholder="https://..."
                  />
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
          </div>

          <h3 className="dashboard-subheading">Published Gallery Items</h3>
          {approvedGallery.length === 0 ? <p className="empty-state">No gallery items yet.</p> : null}
          <div className="dashboard-grid">
            {approvedGallery.map((item) => (
              <article key={item.id} className="card">
                <span className="badge">{item.category}</span>
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
                  <img src={item.src} alt={item.caption} className="dashboard-image" />
                ) : null}
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
                <AdminForm
                  action={deleteGalleryItem}
                  className="action-row"
                  confirmMessage="Delete this gallery item?"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <button className="ghost-button" type="submit">
                    Delete
                  </button>
                </AdminForm>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="dashboard-videos">
          <div className="section-header">
            <div>
              <h2>Video Library</h2>
              <p>Create and organize the Deer Army video collections.</p>
            </div>
          </div>
          <div className="form-card">
            <h3>Add Video Collection</h3>
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
          </div>

          <h3 className="dashboard-subheading">Collections</h3>
          {videoCollections.length === 0 ? <p className="empty-state">No video collections yet.</p> : null}
          <div className="dashboard-grid">
            {videoCollections.map((collection) => (
              <article key={collection.id} className="card">
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
                <AdminForm
                  action={deleteVideoCollection}
                  className="action-row"
                  confirmMessage="Delete this collection and all its videos?"
                >
                  <input type="hidden" name="id" value={collection.id} />
                  <button className="ghost-button" type="submit">
                    Delete Collection
                  </button>
                </AdminForm>

                <div className="form-card" style={{ marginTop: "16px" }}>
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

                {collection.items.length === 0 ? (
                  <p className="empty-state">No videos in this collection.</p>
                ) : (
                  <div className="dashboard-grid" style={{ marginTop: "16px" }}>
                    {collection.items.map((item) => (
                      <article key={item.id} className="card">
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
                        <AdminForm action={deleteVideoItem} className="action-row" confirmMessage="Delete this video?">
                          <input type="hidden" name="id" value={item.id} />
                          <button className="ghost-button" type="submit">
                            Delete Video
                          </button>
                        </AdminForm>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="dashboard-about">
          <div className="section-header">
            <div>
              <h2>About Deer Army</h2>
              <p>Update the community story and mission statement.</p>
            </div>
          </div>
          <div className="form-card">
            <AdminForm action={upsertAbout} className="admin-form">
              <label htmlFor="about-story">
                Our Story
                <textarea
                  id="about-story"
                  name="story"
                  rows="4"
                  defaultValue={about?.story || ""}
                  required
                ></textarea>
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
          </div>
        </section>

        <section className="section" id="dashboard-users">
          <div className="section-header">
            <div>
              <h2>Admin Users</h2>
              <p>Add a new admin login or reset an existing password.</p>
            </div>
          </div>
          <div className="form-card">
            <AdminForm action={upsertUser} className="admin-form">
              <div className="form-row">
                <label htmlFor="admin-user-email">
                  Username (Email)
                  <input
                    id="admin-user-email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    required
                  />
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
          </div>

          <h3 className="dashboard-subheading">Current Admins</h3>
          {users.length === 0 ? <p className="empty-state">No admin users found.</p> : null}
          <div className="dashboard-grid">
            {users.map((user) => (
              <article key={user.id} className="card">
                <span className="badge">Created {formatDate(user.createdAt)}</span>
                <h3>{user.email}</h3>
              </article>
            ))}
          </div>
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
            <div className="dashboard-grid">
              {pendingLetters.map((letter) => (
                <article key={letter.id} className="card">
                  <span className="badge">{formatDate(letter.createdAt)}</span>
                  <h3>{letter.name}</h3>
                  <p>{letter.messageEn}</p>
                  {letter.messageAr ? (
                    <p className="arabic" lang="ar" dir="rtl">
                      {letter.messageAr}
                    </p>
                  ) : null}
                  {letter.tiktok ? (
                    <a className="letter-link" href={letter.tiktok} target="_blank" rel="noopener">
                      TikTok
                    </a>
                  ) : null}
                  <div className="action-row">
                    <AdminForm action={approveLetter}>
                      <input type="hidden" name="id" value={letter.id} />
                      <button className="secondary-button" type="submit">
                        Approve
                      </button>
                    </AdminForm>
                    <AdminForm
                      action={declineLetter}
                      confirmMessage="Decline and remove this letter?"
                    >
                      <input type="hidden" name="id" value={letter.id} />
                      <button className="ghost-button" type="submit">
                        Decline
                      </button>
                    </AdminForm>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <div>
                <h3>Pending Gallery Submissions</h3>
                <p>Approve photos, video edits, or fan art to publish them.</p>
              </div>
            </div>
            {pendingGallery.length === 0 ? <p className="empty-state">No pending gallery items.</p> : null}
            <div className="dashboard-grid">
              {pendingGallery.map((item) => (
                <article key={item.id} className="card">
                  <span className="badge">{formatDate(item.createdAt)}</span>
                  <h3>{item.caption}</h3>
                  <p>By {item.name}</p>
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
                    <img src={item.src} alt={item.caption} className="dashboard-image" />
                  ) : null}
                  <div className="action-row">
                    <AdminForm action={approveGallery}>
                      <input type="hidden" name="id" value={item.id} />
                      <button className="secondary-button" type="submit">
                        Approve
                      </button>
                    </AdminForm>
                    <AdminForm
                      action={declineGallery}
                      confirmMessage="Decline and remove this submission?"
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <button className="ghost-button" type="submit">
                        Decline
                      </button>
                    </AdminForm>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <div>
                <h3>Pending Contact Submissions</h3>
                <p>Review community notes and coordination requests.</p>
              </div>
            </div>
            {pendingContacts.length === 0 ? <p className="empty-state">No pending messages.</p> : null}
            <div className="dashboard-grid">
              {pendingContacts.map((item) => (
                <article key={item.id} className="card">
                  <span className="badge">{formatDate(item.createdAt)}</span>
                  <h3>{item.name}</h3>
                  <p>{item.email}</p>
                  <p>{item.type}</p>
                  <p>{item.message}</p>
                  <div className="action-row">
                    <AdminForm action={approveContact}>
                      <input type="hidden" name="id" value={item.id} />
                      <button className="secondary-button" type="submit">
                        Approve
                      </button>
                    </AdminForm>
                    <AdminForm
                      action={declineContact}
                      confirmMessage="Decline and delete this message?"
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <button className="ghost-button" type="submit">
                        Decline
                      </button>
                    </AdminForm>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
