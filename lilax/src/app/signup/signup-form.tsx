"use client";

import React from "react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type FormMessage = {
  type: "success" | "error";
  text: string;
};

const INITIAL_FORM = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: ""
};

export default function SignupForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data?.error || "Signup failed. Please try again."
        });
        return;
      }

      setForm(INITIAL_FORM);
      setMessage({
        type: "success",
        text: data?.message || "Your signup request is pending admin approval."
      });
    } catch {
      setMessage({
        type: "error",
        text: "Signup failed. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="login-card signup-card">
      <div>
        <span className="kicker">Customer Account</span>
        <h1>Create your Lilax account</h1>
        <p>Customer signups are reviewed by an admin before they are approved.</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit} aria-label="Customer signup form">
        <label>
          Full name
          <input
            type="text"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((current) => ({ ...current, confirmPassword: event.target.value }))
            }
            required
          />
        </label>
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? "Sending request..." : "Create Account"}
        </button>
        {message ? (
          <p className={message.type === "success" ? "store-message is-success" : "error-text"}>
            {message.text}
          </p>
        ) : null}
      </form>

      <div className="signup-links">
        <Link href="/" className="ghost-button">
          Back to Store
        </Link>
        <Link href="/login" className="ghost-button">
          Admin Login
        </Link>
      </div>
    </section>
  );
}
