import Papa, { type ParseLocalConfig } from "papaparse";
import z from "zod";

type AcceptedParseLocalConfig = { header: ParseLocalConfig["header"] };

export class CsvParser<Row> {
  private rowSchema: z.ZodType<Row>;
  private config?: AcceptedParseLocalConfig;

  constructor(rowSchema: z.ZodType<Row>, config?: AcceptedParseLocalConfig) {
    this.rowSchema = rowSchema;
    this.config = config;
  }

  async fromFile(file: File) {
    return new Promise<Row[]>(async (resolve, reject) => {
      try {
        Papa.parse(file, {
          header: this.config?.header,
          skipEmptyLines: true,
          complete: (result) => {
            if (result.errors.length > 0) {
              reject(
                new Error(
                  result.errors
                    .map((e) => `Row ${e.row}: ${e.message}`)
                    .join("; "),
                ),
              );
              return;
            }

            const { success, data, error } = z
              .array(this.rowSchema)
              .safeParse(result.data);
            if (success) {
              resolve(data);
            } else {
              const message = error.issues
                .map((issue) => {
                  const [row, field] = issue.path;
                  return `Row ${row.toString()}, field ${field.toString()}: ${issue.message}`;
                })
                .join("; ");
              reject(new Error(message));
            }
          },
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
