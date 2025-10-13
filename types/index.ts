export type UserRole = "employee" | "admin";

export type TimeEntryStatus = "pending" | "approved" | "rejected";

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string; // ISO string converted from Firestore Timestamp
}

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  tokenIssuedAt: number;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string; // yyyy-MM-dd
  startUtc: string; // ISO 8601
  endUtc: string; // ISO 8601
  totalMinutes: number;
  status: TimeEntryStatus;
  note?: string;
  reviewNote?: string;
  submittedAt: string; // ISO string derived from Timestamp
  approvedBy?: string;
  approvedAt?: string;
}

export interface TimeEntryWithUser extends TimeEntry {
  user?: Pick<UserProfile, "id" | "displayName" | "email">;
}

export interface TimeEntryFilter {
  userId?: string;
  status?: TimeEntryStatus | "all";
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
}
