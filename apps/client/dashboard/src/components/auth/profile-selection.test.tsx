import { describe, expect, test } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { ProfileSelection } from "./profile-selection";
import {
  TestDatabaseProvider,
  TestQueryClientProvider,
} from "@/utils/tests/contexts";
import { RouterProvider } from "@tanstack/react-router";
import { getTestRouter } from "@/utils/tests/router";
import type { ReactNode } from "react";

export function ProfileSelectionTestContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = getTestRouter(() => (
    <TestQueryClientProvider>
      <TestDatabaseProvider>{children}</TestDatabaseProvider>
    </TestQueryClientProvider>
  ));

  return <RouterProvider router={router} />;
}

describe("ProfileSelection", () => {
  test("renders", async () => {
    const { getByText } = render(
      <ProfileSelectionTestContextProvider>
        <ProfileSelection />
      </ProfileSelectionTestContextProvider>,
    );

    expect(getByText("MonyFox")).toBeDefined();
    expect(getByText("TEST_USER")).toBeDefined();
  });

  test("create profile", async () => {
    const { getByText, queryByText, findByText, findByLabelText } = render(
      <ProfileSelectionTestContextProvider>
        <ProfileSelection />
      </ProfileSelectionTestContextProvider>,
    );

    // Check if profile is not created
    expect(queryByText("New Test Profile")).toBeNull();

    // Open modal
    fireEvent.click(getByText("Create profile"));

    // Fill form
    const input = await findByLabelText("Profile Name");
    fireEvent.change(input, {
      target: { value: "New Test Profile" },
    });

    // Submit form
    fireEvent.click(getByText("Create"));

    // Check if profile is created
    await findByText("New Test Profile");
  });

  test("delete profile", async () => {
    const { findAllByText, getByTitle, findByText, getByText } = render(
      <ProfileSelectionTestContextProvider>
        <ProfileSelection />
      </ProfileSelectionTestContextProvider>,
    );

    const result = await findAllByText("TEST_USER");
    expect(result.length).toBe(1);

    fireEvent.click(getByTitle("Delete Profile"));
    await findByText("Are you sure you want to delete this profile?");
    fireEvent.click(getByText("Delete"));

    waitFor(() => expect(result.length).toBe(0));
  });

  test("create test profile", async () => {
    const { getByText, queryByText, findByText } = render(
      <ProfileSelectionTestContextProvider>
        <ProfileSelection />
      </ProfileSelectionTestContextProvider>,
    );

    expect(queryByText("Test Profile")).toBeNull();
    fireEvent.click(getByText("Create a test profile"));
    await findByText("Test Profile");
  });

  test("import profile", async () => {
    const { getByText, queryByText } = render(
      <ProfileSelectionTestContextProvider>
        <ProfileSelection />
      </ProfileSelectionTestContextProvider>,
    );

    expect(queryByText("Import a backup file")).toBeNull();

    // Open modal
    fireEvent.click(getByText("Import"));

    await waitFor(() =>
      expect(queryByText("Import a backup file")).not.toBeNull(),
    );
  });
});
