"use client";

import { useFormState } from "react-dom";

const initialState = { ok: null, message: "" };

export default function AdminForm({ action, className, children, confirmMessage }) {
  const [state, formAction] = useFormState(action, initialState);

  const handleSubmit = (event) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className={className} onSubmit={confirmMessage ? handleSubmit : undefined}>
      {children}
      {state?.message ? (
        <p className="form-message" style={{ color: state.ok ? "#2a3d31" : "#a33" }}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
