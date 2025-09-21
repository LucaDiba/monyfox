import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { DatabaseIDBImpl } from "./database-idb";
import { type Profile } from "@monyfox/common-data";

const testProfile: Profile = {
  id: "1",
  user: "Test User",
  data: {
    encrypted: false,
    data: {
      accounts: [],
      transactions: [],
      transactionCategories: [],
      transactionsImporters: [],
      importedTransactions: [],
      assetSymbols: [],
      assetSymbolExchanges: [],
      assetSymbolExchangersMetadata: { alphavantage: null },
      lastUpdated: "",
    },
  },
  schemaVersion: "1",
};

describe("initialized", () => {
  const client = new DatabaseIDBImpl();
  const dbName = "test-db";

  beforeEach(async () => {
    await client.init(dbName);
  });

  afterEach(async () => {
    indexedDB.deleteDatabase(dbName);
  });

  test("should initialize the database", async () => {
    expect(client).toBeDefined();
  });

  describe("profiles", () => {
    test("should get profiles", async () => {
      const profiles = await client.profiles.getAll();
      expect(profiles).toEqual([]);
    });

    test("should add a profile", async () => {
      await client.profiles.upsert(testProfile);
      const profiles = await client.profiles.getAll();
      expect(profiles).toEqual([testProfile]);
    });

    test("should update a profile", async () => {
      await client.profiles.upsert(testProfile);
      const updatedProfile: Profile = {
        ...testProfile,
        user: "Updated User",
      };
      await client.profiles.upsert(updatedProfile);
      const profiles = await client.profiles.getAll();
      expect(profiles).toEqual([updatedProfile]);
    });

    test("should delete a profile", async () => {
      await client.profiles.upsert(testProfile);

      let profiles = await client.profiles.getAll();
      expect(profiles).toEqual([testProfile]);

      await client.profiles.delete(testProfile.id);

      profiles = await client.profiles.getAll();
      expect(profiles).toEqual([]);
    });
  });
});

describe("uninitialized", () => {
  const client = new DatabaseIDBImpl();

  test("should throw an error when getting profiles", async () => {
    await expect(client.profiles.getAll()).rejects.toThrow(
      "Database not initialized",
    );
  });

  test("should throw an error when saving a profile", async () => {
    await expect(client.profiles.upsert(testProfile)).rejects.toThrow(
      "Database not initialized",
    );
  });

  test("should throw an error when deleting a profile", async () => {
    await expect(client.profiles.delete(testProfile.id)).rejects.toThrow(
      "Database not initialized",
    );
  });
});
