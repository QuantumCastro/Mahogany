type Tokens = {
  access: string;
  refresh: string;
};

const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

let memoryTokens: Tokens | null = null;

export function saveTokens(tokens: Tokens, persist = false): void {
  memoryTokens = tokens;

  const storage = getStorage();
  if (persist && storage) {
    storage.setItem(ACCESS_KEY, tokens.access);
    storage.setItem(REFRESH_KEY, tokens.refresh);
  } else if (storage) {
    storage.removeItem(ACCESS_KEY);
    storage.removeItem(REFRESH_KEY);
  }
}

export function loadTokens(): Tokens | null {
  if (memoryTokens) {
    return memoryTokens;
  }

  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const access = storage.getItem(ACCESS_KEY);
  const refresh = storage.getItem(REFRESH_KEY);
  if (access && refresh) {
    memoryTokens = { access, refresh };
    return memoryTokens;
  }

  return null;
}

export function clearTokens(): void {
  resetTokenStore();
}

export function getAccessToken(): string | null {
  return loadTokens()?.access ?? null;
}

export function getRefreshToken(): string | null {
  return loadTokens()?.refresh ?? null;
}

export function resetTokenStore(options: { keepStorage?: boolean } = {}): void {
  memoryTokens = null;
  if (options.keepStorage) {
    return;
  }
  const storage = getStorage();
  if (storage) {
    storage.removeItem(ACCESS_KEY);
    storage.removeItem(REFRESH_KEY);
  }
}
