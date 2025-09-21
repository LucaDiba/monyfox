import { TestContextProvider } from "@/utils/tests/contexts";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ChartsPage } from "./charts-page";
import { fireEvent, render } from "@testing-library/react";

const originalLanguageDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "language",
);

beforeEach(() => {
  Object.defineProperty(navigator, "language", {
    value: "it-IT",
    configurable: true,
  });
});

afterEach(() => {
  if (originalLanguageDescriptor) {
    Object.defineProperty(navigator, "language", originalLanguageDescriptor);
  }
});

describe("ChartsPage", () => {
  test("renders Flow tab by default", async () => {
    const r = render(
      <TestContextProvider>
        <ChartsPage />
      </TestContextProvider>,
    );

    expect(r.getByText("Flow")).toBeInTheDocument();
    expect(r.getByText("Net worth")).toBeInTheDocument();

    expect(r.getByTestId("flow-chart")).toBeInTheDocument();
    expect(r.queryByTestId("net-worth-chart")).not.toBeInTheDocument();
  });

  test("renders Net worth tab content when selected", async () => {
    const r = render(
      <TestContextProvider>
        <ChartsPage />
      </TestContextProvider>,
    );

    expect(r.getByTestId("flow-chart")).toBeInTheDocument();
    expect(r.queryByTestId("net-worth-chart")).not.toBeInTheDocument();

    fireEvent.mouseDown(r.getByText("Net worth"));

    expect(r.queryByTestId("flow-chart")).not.toBeInTheDocument();
    expect(r.getByTestId("net-worth-chart")).toBeInTheDocument();
  });
});
