/** @jest-environment node */

import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { setLogLevel } from "firebase/firestore";

setLogLevel("error");

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const describeIfEmulator = emulatorHost ? describe : describe.skip;

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) {
    return;
  }

  const [host, port = "8080"] = emulatorHost.split(":");
  testEnv = await initializeTestEnvironment({
    projectId: "demo-clockup",
    firestore: {
      host,
      port: Number(port),
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

describeIfEmulator("Firestore security rules", () => {
  const employeeCtx = (uid: string) => testEnv.authenticatedContext(uid, { role: "employee" });

  it("allows employees to read their own user doc and denies others", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc("users/alice").set({ displayName: "Alice" });
    });

    await assertSucceeds(employeeCtx("alice").firestore().doc("users/alice").get());
    await assertFails(employeeCtx("bob").firestore().doc("users/alice").get());
  });

  it("permits employees to create their own time entries but not others", async () => {
    const alice = employeeCtx("alice");
    const bob = employeeCtx("bob");

    const entry = {
      userId: "alice",
      date: "2025-03-01",
      startUtc: "2025-03-01T09:00:00.000Z",
      endUtc: "2025-03-01T17:00:00.000Z",
      totalMinutes: 480,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    await assertSucceeds(alice.firestore().collection("timeEntries").doc("entry1").set(entry));
    await assertFails(
      bob.firestore().collection("timeEntries").doc("entry2").set({ ...entry, userId: "alice" }),
    );
  });

  it("prevents employees from modifying non-pending entries", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("timeEntries").doc("entry3").set({
        userId: "alice",
        date: "2025-03-01",
        startUtc: "2025-03-01T09:00:00.000Z",
        endUtc: "2025-03-01T17:00:00.000Z",
        totalMinutes: 480,
        status: "approved",
        submittedAt: new Date().toISOString(),
      });
    });

    await assertFails(
      employeeCtx("alice").firestore().collection("timeEntries").doc("entry3").update({ note: "Attempt" }),
    );
  });
});

if (!emulatorHost) {
  console.warn("Skipping Firestore security tests; FIRESTORE_EMULATOR_HOST is not set.");
}




