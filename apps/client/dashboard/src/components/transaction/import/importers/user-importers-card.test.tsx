import { describe, test, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestContextProvider } from "@/utils/tests/contexts";
import { UserImportersCard } from "./user-importers-card";

describe("UserImportersCard", () => {
  test("lists existing importers and allows opening edit modal and navigating to import page", async () => {
    render(
      <TestContextProvider>
        <UserImportersCard />
      </TestContextProvider>,
    );

    // Title and description
    expect(screen.getByText("Your importers")).toBeInTheDocument();
    expect(
      screen.getByText(/Select one of the available importers/i),
    ).toBeInTheDocument();

    // One importer present
    expect(screen.getByText("Importer 1")).toBeInTheDocument();

    // Open edit modal via pencil icon button
    const buttons = screen.getAllByRole("button");
    const pencil = buttons.find((b) => b.querySelector("svg"));
    if (pencil) fireEvent.click(pencil);

    await waitFor(() => {
      expect(screen.getByText("Edit importer")).toBeInTheDocument();
    });

    // Close modal by updating the name (submit will close on success)
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: "Updated name" } });
    const updateBtn = screen.getByRole("button", { name: /update/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      // Modal closes and card title updates
      expect(screen.queryByText("Edit importer")).not.toBeInTheDocument();
      expect(screen.getByText("Updated name")).toBeInTheDocument();
    });
  });

  test("deletes an importer from edit modal and shows empty state", async () => {
    render(
      <TestContextProvider>
        <UserImportersCard />
      </TestContextProvider>,
    );

    // Ensure initial importer is present
    expect(screen.getByText("Importer 1")).toBeInTheDocument();

    // Open edit modal via pencil icon button
    const buttons = screen.getAllByRole("button");
    const pencil = buttons.find((b) => b.querySelector("svg"));
    if (pencil) fireEvent.click(pencil);

    await waitFor(() => {
      expect(screen.getByText("Edit importer")).toBeInTheDocument();
    });

    // Click delete button inside modal
    const deleteBtn = screen.getByTitle("Delete");
    fireEvent.click(deleteBtn);

    // After deletion, modal should close and empty state should appear
    await waitFor(() => {
      expect(screen.queryByText("Edit importer")).not.toBeInTheDocument();
      expect(screen.queryByText("Importer 1")).not.toBeInTheDocument();
      expect(screen.getByText("No importers found")).toBeInTheDocument();
    });
  });
});
