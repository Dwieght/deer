import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../lib/auth";
import Sidebar from "./sidebar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
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

  return (
    <div className="dashboard-shell">
      <Sidebar userEmail={session.email} />
      <main className="dashboard-main">
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
