import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import type { UserProfile, UserRole } from "@/types";

const usersCollection = adminDb.collection("users");

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return new Date().toISOString();
}

function mapDocToUser(doc: DocumentSnapshot): UserProfile {
  const data = doc.data();
  return {
    id: doc.id,
    displayName: (data?.displayName as string) ?? "",
    email: (data?.email as string) ?? "",
    role: (data?.role as UserRole | undefined) ?? "employee",
    createdAt: timestampToIso(data?.createdAt),
  } satisfies UserProfile;
}

export async function getUserProfile(id: string): Promise<UserProfile | null> {
  const doc = await usersCollection.doc(id).get();
  if (!doc.exists) return null;
  return mapDocToUser(doc);
}

export async function listUsers(role?: UserRole): Promise<UserProfile[]> {
  const baseQuery = role ? usersCollection.where("role", "==", role) : usersCollection;
  const snapshot = await baseQuery.get();
  return snapshot.docs.map(mapDocToUser).sort((a, b) => a.displayName.localeCompare(b.displayName));
}
