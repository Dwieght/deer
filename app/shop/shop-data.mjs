export function buildFeedbackPayload(feedbacks = []) {
  const payload = feedbacks.reduce(
    (acc, item) => {
      if (!item?.productId) {
        return acc;
      }

      const productId = item.productId;
      const nextTotal =
        (acc.feedbackRatingTotalsByProduct[productId] || 0) +
        (Number(item.rating) || 0);
      const nextCount =
        (acc.feedbackSummaryByProduct[productId]?.count || 0) + 1;

      acc.feedbackRatingTotalsByProduct[productId] = nextTotal;
      acc.feedbackSummaryByProduct[productId] = {
        count: nextCount,
        avg: nextTotal / nextCount,
      };

      if (!acc.feedbackPreviewByProduct[productId]) {
        acc.feedbackPreviewByProduct[productId] = [];
      }

      if (acc.feedbackPreviewByProduct[productId].length < 5) {
        acc.feedbackPreviewByProduct[productId].push({
          id: item.id,
          fullName: item.fullName,
          rating: item.rating,
          message: item.message,
          createdAt: item.createdAt,
        });
      }

      return acc;
    },
    {
      feedbackSummaryByProduct: {},
      feedbackPreviewByProduct: {},
      feedbackRatingTotalsByProduct: {},
    },
  );

  delete payload.feedbackRatingTotalsByProduct;
  return payload;
}
