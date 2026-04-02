import { describe, expect, it } from "vitest";
import { formatStableAdminDate } from "./date-format";

describe("formatStableAdminDate", () => {
  it("formats dates using a fixed timezone to avoid hydration drift", () => {
    expect(formatStableAdminDate("2026-03-04T23:00:00.000Z")).toBe("Mar 5, 2026");
  });
});
