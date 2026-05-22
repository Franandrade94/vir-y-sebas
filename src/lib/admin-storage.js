export const ADMIN_AUTH_STORAGE_KEY = "viryseba_admin_auth";

export function setAdminAuthInStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearAdminAuthInStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasAdminAuthInStorage() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
