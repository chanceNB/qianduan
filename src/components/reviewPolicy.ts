import type { Review } from "../contracts";
export function reviewDisplayState(
  review: Review,
): "ready" | "pending" | "failed" | "insufficient" {
  if (review.status === "PENDING") return "pending";
  if (review.status === "FAILED") return "failed";
  if (
    review.status === "INSUFFICIENT_EVIDENCE" ||
    !["AVAILABLE", "PARTIAL"].includes(review.quality.availability)
  )
    return "insufficient";
  return "ready";
}
