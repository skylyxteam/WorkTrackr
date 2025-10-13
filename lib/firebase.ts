import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, type Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFirebaseClientConfig } from "@/lib/env";

let clientApp: FirebaseApp | null = null;
let authEmulatorLinked = false;
let firestoreEmulatorLinked = false;

export function getFirebaseApp(): FirebaseApp {
  if (clientApp) {
    return clientApp;
  }

  if (!getApps().length) {
    clientApp = initializeApp(getFirebaseClientConfig());
  } else {
    clientApp = getApp();
  }

  return clientApp;
}

export function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
  if (!authEmulatorLinked && typeof window !== "undefined") {
    const host = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    if (host) {
      authEmulatorLinked = true;
      connectAuthEmulator(auth, `http://${host}`, { disableWarnings: true });
    }
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  const firestore = getFirestore(getFirebaseApp());
  if (!firestoreEmulatorLinked && typeof window !== "undefined") {
    const host = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;
    if (host) {
      const [hostname, port = "8080"] = host.split(":");
      firestoreEmulatorLinked = true;
      connectFirestoreEmulator(firestore, hostname, Number(port));
    }
  }
  return firestore;
}
