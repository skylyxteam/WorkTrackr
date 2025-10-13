/** @jest-environment node */

import { POST } from "@/app/api/admin/approve/route";

jest.mock("@/lib/auth", () => ({
  getCurrentUserProfile: jest.fn(),
  assertAdmin: jest.fn(),
}));

jest.mock("@/services/timeEntries", () => ({
  setEntryStatus: jest.fn(),
}));

const { getCurrentUserProfile, assertAdmin } = jest.requireMock("@/lib/auth") as {
  getCurrentUserProfile: jest.Mock;
  assertAdmin: jest.Mock;
};
const { setEntryStatus } = jest.requireMock("@/services/timeEntries") as {
  setEntryStatus: jest.Mock;
};

describe("/api/admin/approve", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const admin = {
    id: "admin-1",
    displayName: "Admin",
    email: "admin@example.com",
    role: "admin" as const,
    createdAt: new Date().toISOString(),
  };

  it("applies bulk status updates", async () => {
    getCurrentUserProfile.mockResolvedValue(admin);
    assertAdmin.mockImplementation(() => {});

    const payload = { entryIds: ["a", "b"], status: "approved", reviewNote: "Looks good" };
    const request = new Request("http://localhost/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(setEntryStatus).toHaveBeenCalledWith(["a", "b"], "approved", {
      reviewerId: admin.id,
      reviewNote: "Looks good",
    });
  });

  it("returns 401 for unauthenticated requests", async () => {
    getCurrentUserProfile.mockResolvedValue(null);

    const request = new Request("http://localhost/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryIds: [], status: "approved" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(setEntryStatus).not.toHaveBeenCalled();
  });
});
