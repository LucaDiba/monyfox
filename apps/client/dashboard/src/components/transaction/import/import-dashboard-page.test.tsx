import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestContextProvider } from "@/utils/tests/contexts";
import { ImportDashboardPage } from "./import-dashboard-page";

describe("ImportDashboardPage", () => {
  test("renders help alert and sections", () => {
    render(
      <TestContextProvider>
        <ImportDashboardPage />
      </TestContextProvider>,
    );

    // Help alert
    expect(
      screen.getByText(
        /What are importers and why should I use them\?/i,
      ),
    ).toBeInTheDocument();

    // User importers section
    expect(screen.getByText("Your importers")).toBeInTheDocument();
    // Create new importer section
    expect(screen.getByText("Create new importer")).toBeInTheDocument();

    // The default TestContextProvider provides one importer
    expect(screen.getByText("Importer 1")).toBeInTheDocument();
  });
});
