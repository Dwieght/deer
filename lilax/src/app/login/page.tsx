import { redirectAuthenticatedAdmin } from "@/lib/session";
import LoginForm from "./login-form";

export default function LoginPage() {
  redirectAuthenticatedAdmin();

  return (
    <main className="login-shell">
      <LoginForm />
    </main>
  );
}
