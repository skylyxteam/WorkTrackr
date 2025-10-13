"use client";

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

async function exchangeSession(idToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to establish a secure session");
  }

  const { user } = (await response.json()) as { user: unknown };
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return exchangeSession(idToken);
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update the user's display name if provided
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName });
    // Force token refresh to include updated profile information
    await credential.user.getIdToken(true);
  }
  
  const idToken = await credential.user.getIdToken();
  return exchangeSession(idToken);
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();

  if (typeof window !== "undefined" && window.innerWidth < 640) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  const credential = await signInWithPopup(auth, provider);
  const idToken = await credential.user.getIdToken();
  return exchangeSession(idToken);
}

export async function finalizeRedirectSignIn() {
  const auth = getFirebaseAuth();
  const result = await getRedirectResult(auth);
  if (!result || !result.user) {
    return null;
  }
  const idToken = await result.user.getIdToken();
  return exchangeSession(idToken);
}

export async function signOutEverywhere() {
  const auth = getFirebaseAuth();
  await signOut(auth);
  await fetch("/api/auth/session", {
    method: "DELETE",
  });
}

