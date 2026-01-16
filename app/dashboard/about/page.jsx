import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import { upsertAbout } from "../actions";
import { formatDate } from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const about = await prisma.aboutContent.findUnique({ where: { key: "primary" } });

  return (
    <section className="section" id="about">
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
                <Modal triggerLabel="View" title="About Deer Army" triggerClassName="secondary-button">
                  <div className="modal-stack">
                    <div>
                      {about?.story ? <p className="modal-message">{about.story}</p> : <p>Add your story.</p>}
                      {about?.mission ? <p className="modal-message">{about.mission}</p> : null}
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
  );
}
