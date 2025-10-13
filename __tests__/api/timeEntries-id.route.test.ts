/** @jest-environment node */

import { PATCH, DELETE } from "@/app/api/timeEntries/[entryId]/route";
import type { TimeEntry } from "@/types";
import { type NextResponse } from "next/server";

jest.mock("@/lib/auth", () => ({
  getCurrentUserProfile: jest.fn(),
}));

jest.mock("@/services/timeEntries", () => ({
  updateTimeEntryRecord: jest.fn(),
  deleteTimeEntryRecord: jest.fn(),
}));

const { getCurrentUserProfile } = jest.requireMock("@/lib/auth") as {
  getCurrentUserProfile: jest.Mock;
};
const services = jest.requireMock("@/services/timeEntries") as {
  updateTimeEntryRecord: jest.Mock;
  deleteTimeEntryRecord: jest.Mock;
};

describe("/api/timeEntries/[entryId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const employee = {
    id: "employee-1",
    displayName: "Employee",
    email: "employee@example.com",
    role: "employee" as const,
    createdAt: new Date().toISOString(),
  };

  describe("PATCH", () => {
    it("updates a pending entry", async () => {
      const updated: TimeEntry = {
        id: "entry-1",
        userId: employee.id,
        date: "2025-03-02",
        startUtc: "2025-03-02T08:00:00.000Z",
        endUtc: "2025-03-02T16:00:00.000Z",
        totalMinutes: 480,
        status: "pending",
        note: undefined,
        reviewNote: undefined,
        submittedAt: new Date().toISOString(),
        approvedBy: undefined,
        approvedAt: undefined,
      };

      getCurrentUserProfile.mockResolvedValue(employee);
      services.updateTimeEntryRecord.mockResolvedValue(updated);

      const payload = { date: "2025-03-02", startTime: "08:00", endTime: "16:00" };
      const request = new Request("http://localhost/api/timeEntries/entry-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = (await PATCH(request, { params: { entryId: "entry-1" } })) as NextResponse<{ entry: TimeEntry }>;
      expect(response.status).toBe(200);
      expect(services.updateTimeEntryRecord).toHaveBeenCalledWith({
        entryId: "entry-1",
        userId: employee.id,
        date: "2025-03-02",
        startUtc: expect.any(String),
        endUtc: expect.any(String),
        note: undefined,
        actingRole: "employee",
      });
      expect((await response.json()).entry.id).toBe("entry-1");
    });

    it("returns 401 when not authenticated", async () => {
      getCurrentUserProfile.mockResolvedValue(null);
      const request = new Request("http://localhost/api/timeEntries/entry-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const response = await PATCH(request, { params: { entryId: "entry-1" } });
      expect(response.status).toBe(401);
      expect(services.updateTimeEntryRecord).not.toHaveBeenCalled();
    });
  });

  describe("DELETE", () => {
    it("removes an entry when authorized", async () => {
      getCurrentUserProfile.mockResolvedValue(employee);

      const response = await DELETE(new Request("http://localhost/api/timeEntries/entry-1", { method: "DELETE" }), {
        params: { entryId: "entry-1" },
      });

      expect(response.status).toBe(200);
      expect(services.deleteTimeEntryRecord).toHaveBeenCalledWith("entry-1", employee.id, "employee");
    });
  });
});
