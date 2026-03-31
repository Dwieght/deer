import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./auth";

export function getSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function requireSession() {
  const session = getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
