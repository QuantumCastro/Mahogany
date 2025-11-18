import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { clearTokenCookies, login, refreshToken, setTokenCookies } from "../auth";

describe("auth api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
    global.fetch = originalFetch;
  });

  it("performs login request", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ access: "a", refresh: "b" }),
    } as Response;
    (global.fetch as unknown as Mock).mockResolvedValue(mockResponse);

    const result = await login({ email: "test@example.com", password: "pass" });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/token/"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.access).toBe("a");
  });

  it("refreshes token", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ access: "new" }),
    } as Response;
    (global.fetch as unknown as Mock).mockResolvedValue(mockResponse);

    const result = await refreshToken("refresh-token");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/token/refresh/"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.access).toBe("new");
  });

  it("sets token cookies", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({}),
    } as Response;
    (global.fetch as unknown as Mock).mockResolvedValue(mockResponse);

    await setTokenCookies();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/token/cookie/"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("clears token cookies", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({}),
    } as Response;
    (global.fetch as unknown as Mock).mockResolvedValue(mockResponse);

    await clearTokenCookies();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/token/cookie/"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
