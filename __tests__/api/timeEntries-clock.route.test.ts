/** @jest-environment node */

import { POST as clockIn } from "@/app/api/timeEntries/clock-in/route";
import { POST as clockOut } from "@/app/api/timeEntries/clock-out/route";
import type { TimeEntry } from "@/types";

jest.mock("@/lib/auth", () => ({
  getCurrentUserProfile: jest.fn(),
}));

jest.mock("@/services/timeEntries", () => ({
  startTimeEntryRecord: jest.fn(),
  completeTimeEntryRecord: jest.fn(),
}));

const { getCurrentUserProfile } = jest.requireMock("@/lib/auth") as {
  getCurrentUserProfile: jest.Mock;
};
const services = jest.requireMock("@/services/timeEntries") as {
  startTimeEntryRecord: jest.Mock;
  completeTimeEntryRecord: jest.Mock;
};

const employee = {
  id: "user-1",
  displayName: "User",
  email: "user@example.com",
  role: "employee" as const,
  createdAt: new Date().toISOString(),
};

const openEntry: TimeEntry = {
  id: "entry-open",
  userId: employee.id,
  date: "2025-03-01",
  startUtc: "2025-03-01T09:00:00.000Z",
  endUtc: null,
  totalMinutes: null,
  status: "pending",
  note: undefined,
  reviewNote: undefined,
  submittedAt: new Date().toISOString(),
  approvedBy: undefined,
  approvedAt: undefined,
};

describe("clock workflow routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /clock-in", () => {
    it("creates a new open entry for the user", async () => {
      getCurrentUserProfile.mockResolvedValue(employee);
      services.startTimeEntryRecord.mockResolvedValue(openEntry);

      const response = await clockIn(new Request("http://localhost/api/timeEntries/clock-in", { method: "POST" }));
      expect(response.status).toBe(201);
      expect(services.startTimeEntryRecord).toHaveBeenCalledWith({ userId: employee.id });
      const body = await response.json();
      expect(body.entry.id).toBe("entry-open");
    });

    it("returns 401 when unauthenticated", async () => {
      getCurrentUserProfile.mockResolvedValue(null);
      const response = await clockIn(new Request("http://localhost/api/timeEntries/clock-in", { method: "POST" }));
      expect(response.status).toBe(401);
      expect(services.startTimeEntryRecord).not.toHaveBeenCalled();
    });
  });

  describe("POST /clock-out", () => {
    it("completes the latest open entry with an optional note", async () => {
      const completed: TimeEntry = {
        ...openEntry,
        endUtc: "2025-03-01T17:00:00.000Z",
        totalMinutes: 480,
        note: "Wrapped up",
      };
      getCurrentUserProfile.mockResolvedValue(employee);
      services.completeTimeEntryRecord.mockResolvedValue(completed);

      const request = new Request("http://localhost/api/timeEntries/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: " Wrapped up " }),
      });

      const response = await clockOut(request);
      expect(response.status).toBe(200);
      expect(services.completeTimeEntryRecord).toHaveBeenCalledWith({ userId: employee.id, note: "Wrapped up" });
      const body = await response.json();
      expect(body.entry.endUtc).toBe(completed.endUtc);
    });

    it("returns 401 when unauthenticated", async () => {
      getCurrentUserProfile.mockResolvedValue(null);
      const response = await clockOut(new Request("http://localhost/api/timeEntries/clock-out", { method: "POST" }));
      expect(response.status).toBe(401);
      expect(services.completeTimeEntryRecord).not.toHaveBeenCalled();
    });
  });
});
