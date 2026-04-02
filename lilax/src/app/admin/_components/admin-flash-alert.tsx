"use client";

import { useEffect } from "react";

export default function AdminFlashAlert({
  type,
  text,
  scope
}: {
  type?: string;
  text?: string;
  scope: string;
}) {
  useEffect(() => {
    if (type !== "success" || !text || !scope) {
      return;
    }

    const storageKey = `admin-flash:${scope}:${type}:${text}`;
    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");
    window.alert(text);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("type");
    nextUrl.searchParams.delete("text");
    window.history.replaceState({}, "", nextUrl.toString());
  }, [scope, text, type]);

  return null;
}
