import Link from "next/link";
import SidebarNav from "./sidebar-nav";
import { logoutAction } from "./actions";

export default function Sidebar({ userEmail }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-brand">
        <div className="dashboard-brand-mark" aria-hidden="true">
          DA
        </div>
        <div className="dashboard-brand-copy">
          <p className="dashboard-kicker">Operations</p>
          <p className="dashboard-title">Deer Army Admin</p>
          <p className="dashboard-subtitle">Moderation, commerce, and content control.</p>
        </div>
      </div>
      <SidebarNav />
      <div className="dashboard-sidebar-footer">
        <div className="dashboard-session">
          <p className="dashboard-session-label">Signed in</p>
          <p className="dashboard-session-email">{userEmail}</p>
        </div>
        <Link className="dashboard-site-link" href="/">
          View public site
        </Link>
        <form action={logoutAction}>
          <button className="secondary-button" type="submit">
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
