import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntriesList } from "@/components/dashboard/entries-list";
import type { TimeEntry } from "@/types";

const stubEntries: TimeEntry[] = [
  {
    id: "e1",
    userId: "u1",
    date: "2025-02-10",
    startUtc: "2025-02-10T08:00:00.000Z",
    endUtc: "2025-02-10T16:00:00.000Z",
    totalMinutes: 480,
    status: "pending",
    note: "Planning",
    reviewNote: undefined,
    submittedAt: "2025-02-10T07:00:00.000Z",
    approvedBy: undefined,
    approvedAt: undefined,
  },
  {
    id: "e2",
    userId: "u1",
    date: "2025-02-09",
    startUtc: "2025-02-09T09:00:00.000Z",
    endUtc: "2025-02-09T17:00:00.000Z",
    totalMinutes: 480,
    status: "approved",
    note: undefined,
    reviewNote: "Approved",
    submittedAt: "2025-02-09T07:00:00.000Z",
    approvedBy: "admin-1",
    approvedAt: "2025-02-09T18:00:00.000Z",
  },
];

describe("EntriesList", () => {
  it("renders rows and triggers actions", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(<EntriesList entries={stubEntries} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getAllByTestId("employee-entry-row")).toHaveLength(2);

    await user.click(screen.getByTestId("edit-entry-e1"));
    expect(onEdit).toHaveBeenCalledWith(stubEntries[0]);

    await user.click(screen.getByTestId("delete-entry-e1"));
    expect(onDelete).toHaveBeenCalledWith(stubEntries[0]);
  });
});
