import { requireSession } from "@/lib/session";
import type { ReactNode } from "react";
import AdminNav from "./admin-nav";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const session = requireSession();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-icon">LX</span>
          <div>
            <strong>Lilax</strong>
            <p>Store admin</p>
          </div>
        </div>

        <div className="admin-session">
          <span className="kicker">Signed in</span>
          <strong>{session.email}</strong>
        </div>

        <AdminNav />

        <form action={logout} className="logout-form">
          <button type="submit" className="ghost-button wide-button">
            Log out
          </button>
        </form>
      </aside>

      <div className="admin-main">{children}</div>
    </div>
  );
}
