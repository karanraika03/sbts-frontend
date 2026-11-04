const AUTH_KEY = "sbts_auth";

const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

export const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeToken(token);

  if (!payload?.exp) return true;

  return payload.exp * 1000 <= Date.now();
};

export const createAuthSession = (token, remember = true) => {
  const claims = decodeToken(token);

  if (!claims || isTokenExpired(token)) {
    throw new Error("Invalid or expired token");
  }

  const user = {
    entityId: claims.EntityId,
    loginId: claims.LoginId,
    roleId: claims.RoleId,
    name: claims[NAME_CLAIM] || claims.name || "",
  };

  const session = {
    token,
    user,
  };

  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;

  otherStorage.removeItem(AUTH_KEY);
  storage.setItem(AUTH_KEY, JSON.stringify(session));

  return session;
};

export const getAuthSession = () => {
  try {
    const raw =
      localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);

    if (!raw) return null;

    const session = JSON.parse(raw);

    if (!session.token || isTokenExpired(session.token)) {
      clearAuthSession();
      return null;
    }

    return session;
  } catch {
    clearAuthSession();
    return null;
  }
};

export const getAuthToken = () => getAuthSession()?.token || null;

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
};
