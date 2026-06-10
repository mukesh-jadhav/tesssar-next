// Regression tests for: clsx@2.1.1 + tailwind-merge@2.6.0 upgrade
import { describe, it, expect } from "vitest";
import { cn, formatINR, truncate, slugify } from "./utils";

describe("utils - cn (clsx + tailwind-merge)", () => {
  it("joins simple class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters falsy values via clsx", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("supports conditional object syntax via clsx", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c");
  });

  it("deduplicates conflicting tailwind utilities via twMerge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("keeps non-conflicting tailwind utilities", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });
});

describe("utils - formatINR", () => {
  it("formats paise into a whole-rupee INR string", () => {
    const out = formatINR(123400);
    expect(out).toContain("1,234");
    expect(out).toContain("₹");
  });
});

describe("utils - truncate", () => {
  it("returns text unchanged when under the limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends an ellipsis when over the limit", () => {
    const out = truncate("abcdefghij", 5);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(5);
  });
});

describe("utils - slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips leading/trailing separators and special chars", () => {
    expect(slugify("  --Foo & Bar!--  ")).toBe("foo-bar");
  });
});
