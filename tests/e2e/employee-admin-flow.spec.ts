import { test, expect } from "@playwright/test";

const employeeEmail = process.env.E2E_EMPLOYEE_EMAIL;
const employeePassword = process.env.E2E_EMPLOYEE_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

const shouldRun = Boolean(employeeEmail && employeePassword && adminEmail && adminPassword);

test.describe("Employee to admin approval flow", () => {
  test.skip(!shouldRun, "Set E2E_* environment variables to run this flow");

  test("employee submits, admin approves, employee sees approved", async ({ page }) => {
    const entryDate = new Date().toISOString().slice(0, 10);

    await signIn(page, employeeEmail!, employeePassword!);
    await expect(page).toHaveURL(/dashboard/);

    await page.getByTestId("time-entry-date").fill(entryDate);
    await page.getByTestId("time-entry-start").fill("09:00");
    await page.getByTestId("time-entry-end").fill("17:00");
    await page.getByTestId("time-entry-submit").click();
    await page.getByText("Entry submitted for approval").waitFor();

    await page.getByTestId("sign-out-button").click();

    await signIn(page, adminEmail!, adminPassword!);
    await page.goto("/admin");

    await page.locator('[data-testid^="admin-entry-checkbox-"]').first().check();
    await page.getByPlaceholder("Add a review note (optional)").fill("Approved in e2e test");
    await page.getByRole("button", { name: "Approve" }).click();
    await page.getByText("Entries approved").waitFor();
    await page.getByTestId("sign-out-button").click();

    await signIn(page, employeeEmail!, employeePassword!);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('[data-testid="employee-entry-row"]').first()).toContainText("approved");
  });
});

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByTestId("sign-in-email").fill(email);
  await page.getByTestId("sign-in-password").fill(password);
  await page.getByTestId("sign-in-submit").click();
}
