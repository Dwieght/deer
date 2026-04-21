import test from "node:test";
import assert from "node:assert/strict";

import { buildFeedbackPayload } from "./shop-data.mjs";

test("buildFeedbackPayload keeps only five preview reviews per product while preserving summary totals", () => {
  const feedbacks = Array.from({ length: 7 }, (_, index) => ({
    id: `fb-${index + 1}`,
    productId: "tee-01",
    fullName: `Reviewer ${index + 1}`,
    rating: index < 4 ? 5 : 4,
    message: `Message ${index + 1}`,
    createdAt: new Date(`2026-04-${String(index + 1).padStart(2, "0")}`),
  }));

  const payload = buildFeedbackPayload(feedbacks);

  assert.deepEqual(payload.feedbackSummaryByProduct["tee-01"], {
    avg: 32 / 7,
    count: 7,
  });
  assert.equal(payload.feedbackPreviewByProduct["tee-01"].length, 5);
  assert.deepEqual(
    payload.feedbackPreviewByProduct["tee-01"].map((item) => item.id),
    ["fb-1", "fb-2", "fb-3", "fb-4", "fb-5"],
  );
});

test("buildFeedbackPayload ignores rows without product ids", () => {
  const payload = buildFeedbackPayload([
    {
      id: "fb-1",
      productId: "",
      fullName: "No Product",
      rating: 5,
      message: "Ignore me",
      createdAt: new Date("2026-04-01"),
    },
  ]);

  assert.deepEqual(payload.feedbackSummaryByProduct, {});
  assert.deepEqual(payload.feedbackPreviewByProduct, {});
});
