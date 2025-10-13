/** @jest-environment node */

import { POST, GET } from "@/app/api/timeEntries/route";
import type { TimeEntry } from "@/types";
import { type NextResponse } from "next/server";

jest.mock("@/lib/auth", () => ({
  getCurrentUserProfile: jest.fn(),
}));

jest.mock("@/services/timeEntries", () => ({
  createTimeEntryRecord: jest.fn(),
  listEntriesForUser: jest.fn(),
  listEntriesForAdmin: jest.fn(),
}));

const { getCurrentUserProfile } = jest.requireMock("@/lib/auth") as {
  getCurrentUserProfile: jest.Mock;
};
const services = jest.requireMock("@/services/timeEntries") as {
  createTimeEntryRecord: jest.Mock;
  listEntriesForUser: jest.Mock;
  listEntriesForAdmin: jest.Mock;
};

const employee = {
  id: "employee-1",
  displayName: "Employee One",
  email: "employee@example.com",
  role: "employee" as const,
  createdAt: new Date().toISOString(),
};

const admin = {
  ...employee,
  id: "admin-1",
  role: "admin" as const,
};

describe("/api/timeEntries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("creates a time entry for the authenticated user", async () => {
      const created: TimeEntry = {
        id: "entry-1",
        userId: employee.id,
        date: "2025-03-01",
        startUtc: "2025-03-01T09:00:00.000Z",
        endUtc: "2025-03-01T17:00:00.000Z",
        totalMinutes: 480,
        status: "pending",
        note: undefined,
        reviewNote: undefined,
        submittedAt: new Date().toISOString(),
        approvedBy: undefined,
        approvedAt: undefined,
      };

      getCurrentUserProfile.mockResolvedValue(employee);
      services.createTimeEntryRecord.mockResolvedValue(created);

      const payload = {
        date: "2025-03-01",
        startTime: "09:00",
        endTime: "17:00",
      };

      const request = new Request("http://localhost/api/timeEntries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = (await POST(request)) as NextResponse<{ entry: TimeEntry }>;

      expect(response.status).toBe(201);
      expect(services.createTimeEntryRecord).toHaveBeenCalledWith({
        userId: employee.id,
        date: "2025-03-01",
        startUtc: expect.any(String),
        endUtc: expect.any(String),
        note: undefined,
      });

      const body = await response.json();
      expect(body.entry.id).toBe("entry-1");
    });

    it("returns 401 when the user is not authenticated", async () => {
      getCurrentUserProfile.mockResolvedValue(null);

      const request = new Request("http://localhost/api/timeEntries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      expect(services.createTimeEntryRecord).not.toHaveBeenCalled();
    });
  });

  describe("GET", () => {
    it("returns entries for the employee", async () => {
      const entries: TimeEntry[] = [
        {
          id: "entry-1",
          userId: employee.id,
          date: "2025-03-01",
          startUtc: "2025-03-01T09:00:00.000Z",
          endUtc: "2025-03-01T17:00:00.000Z",
          totalMinutes: 480,
          status: "pending",
          note: undefined,
          reviewNote: undefined,
          submittedAt: new Date().toISOString(),
          approvedBy: undefined,
          approvedAt: undefined,
        },
      ];

      getCurrentUserProfile.mockResolvedValue(employee);
      services.listEntriesForUser.mockResolvedValue(entries);

      const request = new Request("http://localhost/api/timeEntries", {
        method: "GET",
      });

      const response = (await GET(request)) as NextResponse<{ entries: TimeEntry[] }>;
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.entries).toHaveLength(1);
      expect(services.listEntriesForUser).toHaveBeenCalledWith(employee.id, {
        status: undefined,
        startDate: undefined,
        endDate: undefined,
        userId: undefined,
      });
    });

    it("returns admin entries when requester is admin", async () => {
      getCurrentUserProfile.mockResolvedValue(admin);
      services.listEntriesForAdmin.mockResolvedValue([]);

      const request = new Request("http://localhost/api/timeEntries?status=approved", {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
      expect(services.listEntriesForAdmin).toHaveBeenCalledWith({
        status: "approved",
        startDate: undefined,
        endDate: undefined,
        userId: undefined,
      });
    });
  });
});

