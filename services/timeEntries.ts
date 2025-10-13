import { Timestamp, type DocumentData, type DocumentSnapshot, type Query } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import type { TimeEntry, TimeEntryFilter, TimeEntryStatus, TimeEntryWithUser, UserProfile } from "@/types";
import { getMinutesBetween, isDateInFuture, isDateMatching } from "@/utils/date";
import { getAppTimezone } from "@/lib/env";

const entriesCollection = adminDb.collection("timeEntries");
const usersCollection = adminDb.collection("users");
const DEFAULT_LIMIT = 500;

function timestampToIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function docToTimeEntry(doc: DocumentSnapshot<DocumentData>): TimeEntry {
  const data = doc.data();
  if (!data) {
    throw new Error("Time entry document is missing data");
  }

  return {
    id: doc.id,
    userId: data.userId as string,
    date: data.date as string,
    startUtc: data.startUtc as string,
    endUtc: data.endUtc as string,
    totalMinutes: data.totalMinutes as number,
    status: data.status as TimeEntryStatus,
    note: data.note ?? undefined,
    reviewNote: data.reviewNote ?? undefined,
    submittedAt: timestampToIso(data.submittedAt) ?? new Date().toISOString(),
    approvedBy: data.approvedBy ?? undefined,
    approvedAt: timestampToIso(data.approvedAt),
  } satisfies TimeEntry;
}

async function attachUsers(entries: TimeEntry[]): Promise<TimeEntryWithUser[]> {
  const uniqueIds = Array.from(new Set(entries.map((entry) => entry.userId)));
  if (!uniqueIds.length) {
    return entries;
  }

  const refs = uniqueIds.map((id) => usersCollection.doc(id));
  const snapshots = await adminDb.getAll(...refs);
  const map = new Map<string, UserProfile>();

  for (const snap of snapshots) {
    if (!snap.exists) continue;
    const data = snap.data();
    map.set(snap.id, {
      id: snap.id,
      displayName: (data?.displayName as string) ?? "",
      email: (data?.email as string) ?? "",
      role: (data?.role as UserProfile["role"]) ?? "employee",
      createdAt: timestampToIso(data?.createdAt) ?? new Date().toISOString(),
    });
  }

  return entries.map((entry) => ({
    ...entry,
    user: map.get(entry.userId),
  }));
}

function validateEntryPayload(date: string, startUtc: string, endUtc: string) {
  const timezone = getAppTimezone();

  if (isDateInFuture(date, timezone)) {
    throw new Error("Date cannot be in the future");
  }

  if (!isDateMatching(startUtc, date, timezone)) {
    throw new Error("date must match the startUtc calendar day");
  }

  const totalMinutes = getMinutesBetween(startUtc, endUtc);
  return totalMinutes;
}

export async function createTimeEntryRecord(args: {
  userId: string;
  date: string;
  startUtc: string;
  endUtc: string;
  note?: string;
}) {
  const totalMinutes = validateEntryPayload(args.date, args.startUtc, args.endUtc);
  const payload = {
    userId: args.userId,
    date: args.date,
    startUtc: args.startUtc,
    endUtc: args.endUtc,
    totalMinutes,
    status: "pending" as TimeEntryStatus,
    note: args.note ?? null,
    reviewNote: null,
    submittedAt: Timestamp.now(),
  };

  const docRef = await entriesCollection.add(payload);
  const snapshot = await docRef.get();
  return docToTimeEntry(snapshot);
}

export async function updateTimeEntryRecord(args: {
  entryId: string;
  userId: string;
  date: string;
  startUtc: string;
  endUtc: string;
  note?: string;
  actingRole: UserProfile["role"];
}) {
  const docRef = entriesCollection.doc(args.entryId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw new Error("Entry not found");
  }

  const current = docToTimeEntry(snapshot);

  if (current.userId !== args.userId && args.actingRole !== "admin") {
    throw new Error("You can only update your own entries");
  }

  if (current.status !== "pending" && args.actingRole !== "admin") {
    throw new Error("Only pending entries can be updated");
  }

  const totalMinutes = validateEntryPayload(args.date, args.startUtc, args.endUtc);

  const updates = {
    date: args.date,
    startUtc: args.startUtc,
    endUtc: args.endUtc,
    totalMinutes,
    note: args.note ?? null,
  };

  await docRef.update(updates);
  const fresh = await docRef.get();
  return docToTimeEntry(fresh);
}

export async function deleteTimeEntryRecord(entryId: string, userId: string, actingRole: UserProfile["role"]) {
  const docRef = entriesCollection.doc(entryId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw new Error("Entry not found");
  }

  const current = docToTimeEntry(snapshot);

  if (current.userId !== userId && actingRole !== "admin") {
    throw new Error("You can only delete your own entries");
  }

  if (current.status !== "pending" && actingRole !== "admin") {
    throw new Error("Only pending entries can be deleted");
  }

  await docRef.delete();
}

export async function listEntriesForUser(userId: string, filter: TimeEntryFilter = {}): Promise<TimeEntry[]> {
  let query: Query<DocumentData> = entriesCollection
    .where("userId", "==", userId)
    .orderBy("date", "desc")
    .limit(DEFAULT_LIMIT);

  if (filter.startDate) {
    query = query.where("date", ">=", filter.startDate);
  }
  if (filter.endDate) {
    query = query.where("date", "<=", filter.endDate);
  }

  const snapshot = await query.get();
  let entries = snapshot.docs.map(docToTimeEntry);

  if (filter.status && filter.status !== "all") {
    entries = entries.filter((entry) => entry.status === filter.status);
  }

  return entries;
}

export async function listEntriesForAdmin(filter: TimeEntryFilter = {}): Promise<TimeEntryWithUser[]> {
  let query: Query<DocumentData> = entriesCollection.orderBy("date", "desc").limit(DEFAULT_LIMIT);

  if (filter.userId) {
    query = entriesCollection.where("userId", "==", filter.userId).orderBy("date", "desc").limit(DEFAULT_LIMIT);
  } else if (filter.status && filter.status !== "all") {
    query = entriesCollection.where("status", "==", filter.status).orderBy("date", "desc").limit(DEFAULT_LIMIT);
  }

  const snapshot = await query.get();
  let entries = snapshot.docs.map(docToTimeEntry);

  if (filter.startDate) {
    entries = entries.filter((entry) => entry.date >= filter.startDate!);
  }
  if (filter.endDate) {
    entries = entries.filter((entry) => entry.date <= filter.endDate!);
  }
  if (filter.status && filter.status !== "all" && !filter.userId) {
    entries = entries.filter((entry) => entry.status === filter.status);
  }

  return attachUsers(entries);
}

export async function setEntryStatus(
  entryIds: string[],
  status: Exclude<TimeEntryStatus, "pending">,
  approval: { reviewerId: string; reviewNote?: string },
) {
  const batch = adminDb.batch();
  const now = Timestamp.now();

  for (const entryId of entryIds) {
    const docRef = entriesCollection.doc(entryId);
    batch.update(docRef, {
      status,
      reviewNote: approval.reviewNote ?? null,
      approvedBy: approval.reviewerId,
      approvedAt: now,
    });
  }

  await batch.commit();
}

export async function exportEntries(filter: TimeEntryFilter = {}): Promise<TimeEntryWithUser[]> {
  const entries = await listEntriesForAdmin(filter);
  return entries;
}
