import SidebarNav from "./sidebar-nav";
import { logoutAction } from "./actions";

export default function Sidebar({ userEmail }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-brand">
        <img src="/assets/logo_no_bg.png" alt="Deer Army logo" />
        <div>
          <p className="dashboard-title">Deer Army Admin</p>
          <p className="dashboard-subtitle">Manage community content</p>
        </div>
      </div>
      <SidebarNav />
      <div className="dashboard-session">
        <span className="badge">Signed in as {userEmail}</span>
        <form action={logoutAction}>
          <button className="ghost-button" type="submit">
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
