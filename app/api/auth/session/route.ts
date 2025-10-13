import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebaseAdmin";
import { ensureUserProfile, getCurrentSessionUser, getCurrentUserProfile } from "@/lib/auth";
import {
  SESSION_COOKIE_MAX_AGE,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_SECURE,
} from "@/lib/constants";
import type { SessionUser, UserRole } from "@/types";

const sessionBodySchema = z.object({
  idToken: z.string(),
});

function decodedToSessionUser(decoded: import("firebase-admin/auth").DecodedIdToken): SessionUser {
  const role = (decoded.role as UserRole | undefined) ?? "employee";

  return {
    uid: decoded.uid,
    email: decoded.email ?? "",
    displayName: decoded.name ?? decoded.email ?? "",
    photoURL: decoded.picture ?? undefined,
    role,
    tokenIssuedAt: decoded.iat * 1000,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = sessionBodySchema.parse(body);

    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE * 1000,
    });

    const sessionUser = decodedToSessionUser(decoded);
    const profile = await ensureUserProfile(sessionUser);

    const response = NextResponse.json({ user: profile });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: SESSION_COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Error creating Firebase session", error);
    return NextResponse.json({ error: "Unable to create session" }, { status: 401 });
  }
}

export async function GET() {
  const user = await getCurrentUserProfile();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function DELETE() {
  const sessionUser = await getCurrentSessionUser();

  if (sessionUser) {
    try {
      await adminAuth.revokeRefreshTokens(sessionUser.uid);
    } catch (error) {
      console.error("Failed to revoke refresh tokens", error);
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
