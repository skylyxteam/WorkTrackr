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

const openEntry: TimeEntry = {
  ...baseEntry,
  id: "open",
  endUtc: null,
  totalMinutes: null,
  note: undefined,
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
    const noteInput = screen.getByTestId("time-entry-edit-note") as HTMLTextAreaElement;

    expect(dateInput.value).toBe("2025-01-15");
    expect(startInput.value).toBe(isoToLocalTimeInput(baseEntry.startUtc));
    expect(endInput.value).toBe(isoToLocalTimeInput(baseEntry.endUtc!));
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

  it("shows clock in controls and calls handlers", async () => {
    const user = userEvent.setup();
    const onClockIn = jest.fn().mockResolvedValue(openEntry);
    const onClockOut = jest.fn();

    render(<TimeEntryForm activeEntry={null} onClockIn={onClockIn} onClockOut={onClockOut} />);

    const clockInButton = screen.getByTestId("clock-in-button");
    await user.click(clockInButton);

    await waitFor(() => {
      expect(onClockIn).toHaveBeenCalledTimes(1);
    });

    expect(onClockOut).not.toHaveBeenCalled();
  });

  it("allows clocking out with a note", async () => {
    const user = userEvent.setup();
    const completedEntry: TimeEntry = {
      ...baseEntry,
      note: "Completed tasks",
    };
    const onClockOut = jest.fn().mockResolvedValue(completedEntry);

    render(<TimeEntryForm activeEntry={openEntry} onClockIn={jest.fn()} onClockOut={onClockOut} />);

    const noteField = screen.getByTestId("time-entry-note") as HTMLTextAreaElement;
    await user.type(noteField, "  Completed tasks ");
    await user.click(screen.getByTestId("clock-out-button"));

    await waitFor(() => {
      expect(onClockOut).toHaveBeenCalledWith("Completed tasks");
    });
  });

  it("surfaces errors from clock out handler", async () => {
    const user = userEvent.setup();
    jest.spyOn(console, "error").mockImplementation(() => {});
    const onClockOut = jest.fn().mockRejectedValue(new Error("No active entry"));

    render(<TimeEntryForm activeEntry={openEntry} onClockIn={jest.fn()} onClockOut={onClockOut} />);

    await user.click(screen.getByTestId("clock-out-button"));

    await screen.findByTestId("time-entry-error");
    expect(onClockOut).toHaveBeenCalledTimes(1);
  });
});
