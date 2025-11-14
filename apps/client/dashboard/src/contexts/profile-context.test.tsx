import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import { TestContextProvider } from "@/utils/tests/contexts";
import { useProfile } from "@/hooks/use-profile";
import { ulid } from "ulid";

describe("ProfileProvider", () => {
  test("existing profile", async () => {
    const result = render(
      <TestContextProvider>
        <ProfileDataForTest />
      </TestContextProvider>,
    );

    expect(result.getByText("Accounts:Account 1,Account 2.")).toBeDefined();
    expect(
      result.getByText("Transactions:Income,Expense,Income USD."),
    ).toBeDefined();
  });

  test("optioanl field has default data", async () => {
    const result = render(
      <TestContextProvider withOptionalField={true}>
        <ProfileDataForTest />
      </TestContextProvider>,
    );

    expect(result.getByText("Accounts:Account 1,Account 2.")).toBeDefined();
    expect(result.getByText("Transactions importers:.")).toBeDefined();
  });

  test("undefined profile", async () => {
    const result = render(
      <TestContextProvider profileId="NON_EXISTING_PROFILE_ID">
        <span>My test text</span>
      </TestContextProvider>,
    );

    expect(result.queryByText("My test text")).toBeNull();
    expect(
      result.getByText("The profile you are trying to access does not exist."),
    ).toBeDefined();
  });

  test("encrypted profile", async () => {
    const result = render(
      <TestContextProvider withEncryptedData={true}>
        <ProfileDataForTest />
      </TestContextProvider>,
    );

    expect(
      result.getByText(
        "The profile you are trying to access is encrypted. Encrypted profiles are currently not supported.",
      ),
    ).toBeInTheDocument();
  });

  test("invalid schema", async () => {
    const result = render(
      <TestContextProvider withInvalidSchema={true}>
        <ProfileDataForTest />
      </TestContextProvider>,
    );

    expect(
      result.getByText(
        "The profile you are trying to access has invalid data. Please check the console logs in your browser for more details.",
      ),
    ).toBeInTheDocument();
  });

  test("invalid data", async () => {
    const result = render(
      <TestContextProvider withInvalidData={true}>
        <ProfileDataForTest />
      </TestContextProvider>,
    );

    expect(result.getByText("Invalid profile data")).toBeDefined();
    expect(
      result.getByText("There are cycles in the transaction categories."),
    ).toBeDefined();
  });
});

function ProfileDataForTest() {
  const {
    data: { accounts, transactions, transactionsImporters },
    createAccount,
  } = useProfile();
  return (
    <div>
      <p>Accounts:{accounts.map((a) => a.name).join(",")}.</p>
      <p>Transactions:{transactions.map((t) => t.description).join(",")}.</p>
      <p>
        Transactions importers:
        {transactionsImporters.map((t) => t.id).join(",")}.
      </p>
      <button
        onClick={() =>
          createAccount.mutateAsync({
            id: ulid(),
            name: "NewTestAccount",
            isPersonalAsset: true,
          })
        }
      >
        Create account
      </button>
    </div>
  );
}
