import { cookies } from "next/headers";
import { cache } from "react";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import type { SessionUser, UserProfile, UserRole } from "@/types";

function timestampToIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

export async function getSessionCookie() {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export const getCurrentSessionUser = cache(async (): Promise<SessionUser | null> => {
  const sessionCookie = await getSessionCookie();
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = (decoded.role as UserRole | undefined) ?? "employee";

    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      displayName: decoded.name ?? decoded.email ?? "",
      photoURL: decoded.picture ?? undefined,
      role,
      tokenIssuedAt: decoded.iat * 1000,
    } satisfies SessionUser;
  } catch (error) {
    console.error("Failed to verify Firebase session cookie", error);
    return null;
  }
});

export const getCurrentUserProfile = cache(async (): Promise<UserProfile | null> => {
  const sessionUser = await getCurrentSessionUser();
  if (!sessionUser) return null;

  const doc = await adminDb.collection("users").doc(sessionUser.uid).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  const createdAt = timestampToIso(data?.createdAt) ?? new Date().toISOString();

  return {
    id: doc.id,
    displayName: (data?.displayName as string) ?? sessionUser.displayName,
    email: (data?.email as string) ?? sessionUser.email,
    role: (data?.role as UserRole | undefined) ?? sessionUser.role,
    createdAt,
  } satisfies UserProfile;
});

export async function ensureUserProfile(sessionUser: SessionUser): Promise<UserProfile> {
  const docRef = adminDb.collection("users").doc(sessionUser.uid);
  const now = Timestamp.now();
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    await docRef.set(
      {
        displayName: sessionUser.displayName,
        email: sessionUser.email,
        role: sessionUser.role,
        createdAt: now,
      },
      { merge: true },
    );

    return {
      id: sessionUser.uid,
      displayName: sessionUser.displayName,
      email: sessionUser.email,
      role: sessionUser.role,
      createdAt: now.toDate().toISOString(),
    } satisfies UserProfile;
  }

  const data = snapshot.data();
  const needsUpdate =
    data?.displayName !== sessionUser.displayName || data?.email !== sessionUser.email;

  if (needsUpdate) {
    await docRef.set(
      {
        displayName: sessionUser.displayName,
        email: sessionUser.email,
      },
      { merge: true },
    );
  }

  return {
    id: sessionUser.uid,
    displayName: (data?.displayName as string) ?? sessionUser.displayName,
    email: (data?.email as string) ?? sessionUser.email,
    role: (data?.role as UserRole | undefined) ?? sessionUser.role,
    createdAt: timestampToIso(data?.createdAt) ?? now.toDate().toISOString(),
  } satisfies UserProfile;
}

export function assertAdmin(user: UserProfile | SessionUser | null) {
  if (!user || user.role !== "admin") {
    throw new Error("Admin privileges required");
  }
}
