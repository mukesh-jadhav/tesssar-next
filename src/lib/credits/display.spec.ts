// Regression tests for: credits display logic (stable across dependency upgrades)
import { describe, it, expect } from "vitest";
import {
  UNLIMITED_CREDITS,
  isUnlimited,
  formatCredits,
  formatDesigns,
  canAffordRun,
} from "./display";

describe("credits/display - isUnlimited", () => {
  it("treats the sentinel as unlimited", () => {
    expect(isUnlimited(UNLIMITED_CREDITS)).toBe(true);
  });

  it("treats non-negative numbers as limited", () => {
    expect(isUnlimited(0)).toBe(false);
    expect(isUnlimited(100)).toBe(false);
  });

  it("treats null/undefined as not unlimited", () => {
    expect(isUnlimited(null)).toBe(false);
    expect(isUnlimited(undefined)).toBe(false);
  });
});

describe("credits/display - formatCredits", () => {
  it("returns a dash for null/undefined", () => {
    expect(formatCredits(null)).toBe("—");
    expect(formatCredits(undefined)).toBe("—");
  });

  it("returns the infinity glyph for unlimited", () => {
    expect(formatCredits(UNLIMITED_CREDITS)).toBe("∞");
  });

  it("formats a finite balance", () => {
    expect(formatCredits(1000)).toBe("1,000");
  });
});

describe("credits/display - formatDesigns / canAffordRun", () => {
  it("shows infinity designs for unlimited", () => {
    expect(formatDesigns(UNLIMITED_CREDITS)).toBe("∞");
  });

  it("allows runs for unlimited accounts", () => {
    expect(canAffordRun(UNLIMITED_CREDITS)).toBe(true);
  });

  it("rejects runs for null balances", () => {
    expect(canAffordRun(null)).toBe(false);
  });
});
