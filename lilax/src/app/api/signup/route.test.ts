import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, createMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findUnique: findUniqueMock,
      create: createMock
    }
  }
}));

import { POST } from "./route";

describe("POST /api/signup", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createMock.mockReset();
  });

  it("rejects password mismatches", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: "Jamie Cruz",
          email: "jamie@example.com",
          password: "Secret123!",
          confirmPassword: "Mismatch123!"
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Passwords do not match."
    });
  });

  it("creates a pending customer signup request", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: "customer_01" });

    const response = await POST(
      new Request("http://localhost:3000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: "Jamie Cruz",
          email: " JAMIE@EXAMPLE.COM ",
          password: "Secret123!",
          confirmPassword: "Secret123!"
        })
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: "Your signup request is pending admin approval."
    });
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fullName: "Jamie Cruz",
        email: "jamie@example.com",
        status: "PENDING",
        passwordHash: expect.any(String)
      })
    });
  });

  it("rejects duplicate customer emails", async () => {
    findUniqueMock.mockResolvedValue({
      id: "customer_02"
    });

    const response = await POST(
      new Request("http://localhost:3000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: "Jamie Cruz",
          email: "jamie@example.com",
          password: "Secret123!",
          confirmPassword: "Secret123!"
        })
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "This email already has a signup request."
    });
  });
});
