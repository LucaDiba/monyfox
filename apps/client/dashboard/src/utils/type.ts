export function assertNever(value: never): never {
  throw new Error(
    `Unexpected value: ${value}. This should never happen. Please report this issue.`,
  );
}
