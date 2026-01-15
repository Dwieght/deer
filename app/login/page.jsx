"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    };

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: data?.error || "Login failed" });
        return;
      }
      setMessage({ type: "success", text: "Login successful. Redirecting..." });
      form.reset();
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (error) {
      setMessage({ type: "error", text: "Login failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Log In</h2>
            <p>Access the Deer Army community tools.</p>
          </div>
          <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
        </div>

        <div className="form-card">
          <h3>Welcome Back</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="login-email">
                Email
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label htmlFor="login-password">
                Password
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                />
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Log In"}
            </button>
            {message ? (
              <p className="form-message" style={{ color: message.type === "error" ? "#a33" : "#2a3d31" }}>
                {message.text}
              </p>
            ) : null}
          </form>
          <div className="action-row" style={{ marginTop: "16px" }}>
            <a className="ghost-button" href="/">
              Back to Home
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
