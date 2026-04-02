import { describe, expect, it } from "vitest";
import { normalizeImageList, normalizeImageUrl } from "./image-url";

describe("normalizeImageUrl", () => {
  it("keeps non-drive urls unchanged", () => {
    expect(normalizeImageUrl("https://images.unsplash.com/photo-1")).toBe(
      "https://images.unsplash.com/photo-1"
    );
  });

  it("converts google drive file view links", () => {
    expect(
      normalizeImageUrl(
        "https://drive.google.com/file/d/1GsNE4UXnF0yvTydKOe1YKCItIhwJp-Ro/view?usp=sharing"
      )
    ).toBe(
      "https://drive.google.com/uc?export=view&id=1GsNE4UXnF0yvTydKOe1YKCItIhwJp-Ro"
    );
  });

  it("converts google drive id query links", () => {
    expect(
      normalizeImageUrl("https://drive.google.com/open?id=abc123")
    ).toBe("https://drive.google.com/uc?export=view&id=abc123");
  });
});

describe("normalizeImageList", () => {
  it("normalizes drive links and trims blanks", () => {
    expect(
      normalizeImageList([
        "https://drive.google.com/file/d/abc123/view?usp=sharing",
        " https://images.unsplash.com/photo-2 ",
        ""
      ])
    ).toEqual([
      "https://drive.google.com/uc?export=view&id=abc123",
      "https://images.unsplash.com/photo-2"
    ]);
  });
});
