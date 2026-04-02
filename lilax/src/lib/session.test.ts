import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, redirectMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  redirectMock: vi.fn()
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

import { createSessionToken } from "./auth";
import { getSession, redirectAuthenticatedAdmin } from "./session";

function setCookieValue(token?: string) {
  cookiesMock.mockReturnValue({
    get: () => (token ? { value: token } : undefined)
  });
}

describe("session helpers", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret";
    cookiesMock.mockReset();
    redirectMock.mockReset();
  });

  it("reads the signed-in admin session from the cookie", () => {
    const token = createSessionToken({
      sub: "user_01",
      email: "admin@lilax.shop"
    });

    setCookieValue(token);

    expect(getSession()).toMatchObject({
      sub: "user_01",
      email: "admin@lilax.shop"
    });
  });

  it("redirects authenticated admins away from auth pages", () => {
    const token = createSessionToken({
      sub: "user_01",
      email: "admin@lilax.shop"
    });

    setCookieValue(token);

    redirectAuthenticatedAdmin();

    expect(redirectMock).toHaveBeenCalledWith("/admin/products");
  });

  it("does not redirect guests away from auth pages", () => {
    setCookieValue();

    redirectAuthenticatedAdmin();

    expect(redirectMock).not.toHaveBeenCalled();
  });
});
