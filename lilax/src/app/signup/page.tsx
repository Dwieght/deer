import { redirectAuthenticatedAdmin } from "@/lib/session";
import SignupForm from "./signup-form";

export default function SignupPage() {
  redirectAuthenticatedAdmin();

  return (
    <main className="login-shell">
      <SignupForm />
    </main>
  );
}
