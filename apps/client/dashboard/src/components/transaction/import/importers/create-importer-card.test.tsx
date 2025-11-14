import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestContextProvider } from "@/utils/tests/contexts";
import { CreateImporterCard } from "./create-importer-card";

describe("CreateImporterCard", () => {
  test("shows Chase importer link and navigates to create page", async () => {
    render(
      <TestContextProvider>
        <CreateImporterCard />
      </TestContextProvider>,
    );

    // The card title and description
    expect(screen.getByText("Create new importer")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Select one of the available importers to create a new importer/i,
      ),
    ).toBeInTheDocument();

    // The Chase tile and plus button
    expect(screen.getByText("Chase")).toBeInTheDocument();
    screen.getByTitle("Create Chase importer");
  });
});
