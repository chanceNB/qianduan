import { it, expect } from "vitest";
import { reviewDisplayState } from "../src/components/reviewPolicy";
import { reviewSchema } from "../src/contracts";
import { review } from "../src/mocks/fixtures/demo";
it("pending and failed agent responses cannot be adopted", () => {
  expect(
    reviewDisplayState(reviewSchema.parse({ ...review, status: "PENDING" })),
  ).toBe("pending");
  expect(
    reviewDisplayState(reviewSchema.parse({ ...review, status: "FAILED" })),
  ).toBe("failed");
});
it("unavailable or not-computable reviews cannot expose deterministic conclusions", () => {
  for (const availability of ["UNAVAILABLE", "NOT_COMPUTABLE"])
    expect(
      reviewDisplayState(
        reviewSchema.parse({
          ...review,
          quality: { ...review.quality, availability },
        }),
      ),
    ).toBe("insufficient");
  expect(reviewDisplayState(reviewSchema.parse(review))).toBe("ready");
});
