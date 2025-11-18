import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  loadTokens,
  resetTokenStore,
  saveTokens,
} from "../token-store";

const mockStorage = (() => {
  let data: Record<string, string> = {};
  return {
    getItem(key: string) {
      return data[key] ?? null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
    removeItem(key: string) {
      delete data[key];
    },
    clear() {
      data = {};
    },
  };
})();

describe("token-store", () => {
  beforeAll(() => {
    Object.defineProperty(window, "sessionStorage", {
      value: mockStorage,
    });
  });

  afterEach(() => {
    clearTokens();
    mockStorage.clear();
  });

  it("saves and loads tokens in memory", () => {
    saveTokens({ access: "a", refresh: "b" });
    expect(getAccessToken()).toBe("a");
    expect(getRefreshToken()).toBe("b");
  });

  it("persists tokens when requested", () => {
    saveTokens({ access: "a", refresh: "b" }, true);
    resetTokenStore({ keepStorage: true });
    expect(loadTokens()).toEqual({ access: "a", refresh: "b" });
    const access = mockStorage.getItem("auth_access_token");
    const refresh = mockStorage.getItem("auth_refresh_token");
    expect(access).toBe("a");
    expect(refresh).toBe("b");
  });
});
