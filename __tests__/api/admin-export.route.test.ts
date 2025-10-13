/** @jest-environment node */

import { GET } from "@/app/api/admin/export/route";

jest.mock("@/lib/auth", () => ({
  getCurrentUserProfile: jest.fn(),
  assertAdmin: jest.fn(),
}));

jest.mock("@/services/timeEntries", () => ({
  exportEntries: jest.fn(),
}));

jest.mock("@/utils/csv", () => ({
  timeEntriesToCsv: jest.fn().mockReturnValue("date,minutes\n"),
}));

const { getCurrentUserProfile, assertAdmin } = jest.requireMock("@/lib/auth") as {
  getCurrentUserProfile: jest.Mock;
  assertAdmin: jest.Mock;
};
const { exportEntries } = jest.requireMock("@/services/timeEntries") as {
  exportEntries: jest.Mock;
};

describe("/api/admin/export", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("streams csv for admins", async () => {
    const admin = {
      id: "admin-1",
      displayName: "Admin",
      email: "admin@example.com",
      role: "admin" as const,
      createdAt: new Date().toISOString(),
    };
    getCurrentUserProfile.mockResolvedValue(admin);
    assertAdmin.mockImplementation(() => {});
    exportEntries.mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/admin/export?status=pending"));
    expect(response.status).toBe(200);
    expect(exportEntries).toHaveBeenCalledWith({
      status: "pending",
      userId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });
});
