export const SESSION_COOKIE_NAME = "worktrackr_session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
export const SESSION_COOKIE_SECURE = process.env.NODE_ENV === "production";

export const FIRESTORE_COLLECTIONS = {
  users: "users",
  timeEntries: "timeEntries",
} as const;

export const DEFAULT_PAGE_SIZE = 25;

export const APP_TIMEZONE = "UTC"; // adjust via env if needed

