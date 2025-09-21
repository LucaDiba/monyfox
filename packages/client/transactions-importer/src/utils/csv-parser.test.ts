import { CsvParser } from "./csv-parser";
import { describe, expect, test, vi } from "vitest";
import z from "zod";
import Papa from "papaparse";

describe("CsvParser", () => {
  test("parse a CSV file with headers", async () => {
    const rowSchema = z.object({
      name: z.string(),
      age: z.string(),
    });

    const csvParser = new CsvParser(rowSchema, { header: true });
    const file = new File(["name,age\nJohn,30\nJane,25"], "test.csv", {
      type: "text/csv",
    });

    const result = await csvParser.fromFile(file);
    expect(result).toEqual([
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ]);
  });

  test("reject an invalid CSV file", async () => {
    const rowSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const csvParser = new CsvParser(rowSchema, { header: true });
    const file = new File(["name,age\nJohn,thirty\nJane"], "test.csv", {
      type: "text/csv",
    });

    await expect(csvParser.fromFile(file)).rejects.toThrowError(
      "Row undefined: Unable to auto-detect delimiting character; defaulted to ','; Row 1: Too few fields: expected 2 fields but parsed 1",
    );
  });

  test("reject a CSV file with invalid schema", async () => {
    const rowSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const csvParser = new CsvParser(rowSchema, { header: true });
    const file = new File(["name,age\nJohn,thirty\nJane,25"], "test.csv", {
      type: "text/csv",
    });

    await expect(csvParser.fromFile(file)).rejects.toThrowError(
      "Row 0, field age: Invalid input: expected number, received string; Row 1, field age: Invalid input: expected number, received string",
    );
  });

  test("reject when Papa.parse errors", async () => {
    vi.spyOn(Papa, "parse").mockImplementationOnce(() => {
      throw new Error("Papa.parse error");
    });

    const csvParser = new CsvParser(z.object(), { header: true });
    const file = new File([], "test.csv");

    await expect(csvParser.fromFile(file)).rejects.toThrowError(
      "Papa.parse error",
    );
  });
});
