import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimeEntryForm } from "@/components/dashboard/time-entry-form";
import type { TimeEntry } from "@/types";
import { isoToLocalTimeInput } from "@/utils/date";

const baseEntry: TimeEntry = {
  id: "abc",
  userId: "user-1",
  date: "2025-01-15",
  startUtc: "2025-01-15T09:00:00.000Z",
  endUtc: "2025-01-15T17:00:00.000Z",
  totalMinutes: 480,
  status: "pending",
  note: "Daily sync",
  reviewNote: undefined,
  submittedAt: "2025-01-15T08:00:00.000Z",
  approvedBy: undefined,
  approvedAt: undefined,
};

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("TimeEntryForm", () => {
  it("prefills values when editing and submits updated payload", async () => {
    const user = userEvent.setup();
    jest.spyOn(console, "error").mockImplementation(() => {});

    const submitRequest = jest.fn().mockResolvedValue(baseEntry);
    const onSubmitSuccess = jest.fn();

    render(
      <TimeEntryForm
        initialEntry={baseEntry}
        submitRequest={submitRequest}
        onSubmitSuccess={onSubmitSuccess}
      />,
    );

    const dateInput = screen.getByTestId("time-entry-date") as HTMLInputElement;
    const startInput = screen.getByTestId("time-entry-start") as HTMLInputElement;
    const endInput = screen.getByTestId("time-entry-end") as HTMLInputElement;
    const noteInput = screen.getByTestId("time-entry-note") as HTMLTextAreaElement;

    expect(dateInput.value).toBe("2025-01-15");
    expect(startInput.value).toBe(isoToLocalTimeInput(baseEntry.startUtc));
    expect(endInput.value).toBe(isoToLocalTimeInput(baseEntry.endUtc));
    expect(noteInput.value).toBe("Daily sync");

    await user.clear(startInput);
    await user.type(startInput, "08:45");
    await user.clear(endInput);
    await user.type(endInput, "16:30");
    await user.clear(noteInput);
    await user.type(noteInput, "Updated note");

    await user.click(screen.getByTestId("time-entry-submit"));

    await waitFor(() => {
      expect(submitRequest).toHaveBeenCalledWith({
        date: "2025-01-15",
        startTime: "08:45",
        endTime: "16:30",
        note: "Updated note",
      });
    });

    expect(onSubmitSuccess).toHaveBeenCalled();
  });

  it("surfaces validation errors from submitRequest", async () => {
    const user = userEvent.setup();
    jest.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Exit time must be after start");
    const submitRequest = jest.fn().mockRejectedValue(error);

    render(<TimeEntryForm submitRequest={submitRequest} />);

    await user.click(screen.getByTestId("time-entry-submit"));

    await screen.findByText("Exit time must be after start");
  });
});

