import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getFeatureFlags, isFeatureEnabled } from "../feature-flags";

const original = process.env.NEXT_PUBLIC_FEATURE_FLAGS;

beforeEach(() => {
  process.env.NEXT_PUBLIC_FEATURE_FLAGS = "example-feature";
});

afterEach(() => {
  process.env.NEXT_PUBLIC_FEATURE_FLAGS = original;
});

describe("feature flags utils", () => {
  it("parses comma separated flags", () => {
    expect(getFeatureFlags()).toEqual(["example-feature"]);
  });

  it("checks if feature is enabled", () => {
    const flags = ["alpha", "beta"];
    expect(isFeatureEnabled("alpha", flags)).toBe(true);
    expect(isFeatureEnabled("gamma", flags)).toBe(false);
  });
});
