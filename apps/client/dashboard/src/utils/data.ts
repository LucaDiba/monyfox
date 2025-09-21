import {
  type Transaction,
  type Account,
  type AssetSymbol,
  type Profile,
  type AssetSymbolExchange,
  type TransactionCategory,
  Data,
} from "@monyfox/common-data";
import { ulid } from "ulid";
import { DayOfWeek, LocalDate, Month } from "@js-joda/core";
import { isCycleInTransactionCategories } from "./transaction-category";

export function generateTestProfile(): Profile {
  const bankAccount: Account = {
    id: ulid(),
    name: "Bank Account",
    isPersonalAsset: true,
  };

  const savingsAccount: Account = {
    id: ulid(),
    name: "Savings Account",
    isPersonalAsset: true,
  };

  const investmentAccount: Account = {
    id: ulid(),
    name: "Investment Account",
    isPersonalAsset: true,
  };

  const creditCardAccount: Account = {
    id: ulid(),
    name: "Credit Card",
    isPersonalAsset: true,
  };

  const assetEur: AssetSymbol = {
    id: ulid(),
    type: "fiat",
    code: "EUR",
    displayName: "EUR",
  };

  const assetUsd: AssetSymbol = {
    id: ulid(),
    type: "fiat",
    code: "USD",
    displayName: "USD",
  };

  const assetIbm: AssetSymbol = {
    id: ulid(),
    type: "stock",
    code: "IBM",
    displayName: "International Business Machines Corporation",
  };

  const exchangeEurUsd: AssetSymbolExchange = {
    id: ulid(),
    fromAssetSymbolId: assetEur.id,
    toAssetSymbolId: assetUsd.id,
    exchanger: { type: "frankfurter", base: "EUR", target: "USD" },
  };

  const exchangeEurIbm: AssetSymbolExchange = {
    id: ulid(),
    fromAssetSymbolId: assetIbm.id,
    toAssetSymbolId: assetEur.id,
    exchanger: {
      type: "alphavantage-stock",
      symbol: "IBM",
    },
  };

  const categoryFood: TransactionCategory = {
    id: ulid(),
    name: "Food",
    parentTransactionCategoryId: null,
  };

  const categoryWork: TransactionCategory = {
    id: ulid(),
    name: "Work",
    parentTransactionCategoryId: null,
  };

  const categorySalary: TransactionCategory = {
    id: ulid(),
    name: "Salary",
    parentTransactionCategoryId: categoryWork.id,
  };

  const categoryEntertainment: TransactionCategory = {
    id: ulid(),
    name: "Entertainment",
    parentTransactionCategoryId: null,
  };

  const categoryConcert: TransactionCategory = {
    id: ulid(),
    name: "Concert",
    parentTransactionCategoryId: categoryEntertainment.id,
  };

  const categoryHouse: TransactionCategory = {
    id: ulid(),
    name: "House",
    parentTransactionCategoryId: null,
  };

  const categoryRent: TransactionCategory = {
    id: ulid(),
    name: "Rent",
    parentTransactionCategoryId: categoryHouse.id,
  };

  const transactionCategories = [
    categoryFood,
    categoryWork,
    categorySalary,
    categoryEntertainment,
    categoryConcert,
    categoryHouse,
    categoryRent,
  ];

  const yearsToGenerate = 2;
  const transactions: Transaction[] = [];
  let creditCardBalance = 0;
  for (
    let currentDate = LocalDate.now().minusYears(yearsToGenerate);
    currentDate.isBefore(LocalDate.now());
    currentDate = currentDate.plusDays(1)
  ) {
    if (currentDate.dayOfMonth() === 1) {
      // Income - salary 1st job
      const salaryEurAmount = Math.round(randomFloat(0.9, 1.1) * 5000); // Variance for salary
      transactions.push({
        id: ulid(),
        description: "Salary Company 1",
        transactionDate: currentDate.toString(),
        accountingDate: currentDate.toString(),
        transactionCategoryId: categorySalary.id,
        from: {
          amount: salaryEurAmount,
          symbolId: assetEur.id,
          account: { name: "My Company 1" },
        },
        to: {
          amount: salaryEurAmount,
          symbolId: assetEur.id,
          account: { id: bankAccount.id },
        },
      });

      // Income - salary 2nd job
      const salaryUsdAmount = Math.round(randomFloat(0.9, 1.1) * 5000); // Variance for salary
      transactions.push({
        id: ulid(),
        description: "Salary Company 2",
        transactionDate: currentDate.toString(),
        accountingDate: currentDate.toString(),
        transactionCategoryId: categorySalary.id,
        from: {
          amount: salaryUsdAmount,
          symbolId: assetUsd.id,
          account: { name: "My Company 2" },
        },
        to: {
          amount: salaryUsdAmount,
          symbolId: assetUsd.id,
          account: { id: bankAccount.id },
        },
      });

      // Income - stock
      const stockAmount = Math.round(randomFloat(0.9, 1.1) * 10); // Variance for stock
      transactions.push({
        id: ulid(),
        description: "Vested Stock",
        transactionDate: currentDate.toString(),
        accountingDate: currentDate.toString(),
        transactionCategoryId: null,
        from: {
          amount: stockAmount,
          symbolId: assetIbm.id,
          account: { name: "My Company" },
        },
        to: {
          amount: stockAmount,
          symbolId: assetIbm.id,
          account: { id: investmentAccount.id },
        },
      });

      // Expense - rent
      const rentAmount = Math.round(randomFloat(0.9, 1.1) * 1000); // Variance for bills
      transactions.push({
        id: ulid(),
        description: "Rent",
        transactionDate: currentDate.toString(),
        accountingDate: currentDate.toString(),
        transactionCategoryId: categoryRent.id,
        from: {
          amount: rentAmount,
          symbolId: assetEur.id,
          account: { id: bankAccount.id },
        },
        to: {
          amount: rentAmount,
          symbolId: assetEur.id,
          account: { name: "My Landlord" },
        },
      });

      // Transfer - savings
      transactions.push({
        id: ulid(),
        description: "Savings",
        transactionDate: currentDate.toString(),
        accountingDate: currentDate.toString(),
        transactionCategoryId: null,
        from: {
          amount: 3000,
          symbolId: assetEur.id,
          account: { id: bankAccount.id },
        },
        to: {
          amount: 3000,
          symbolId: assetEur.id,
          account: { id: savingsAccount.id },
        },
      });

      // Transfer - credit card payment
      const creditCardPaymentAmount = creditCardBalance;
      transactions.push({
        id: ulid(),
        description: "Credit Card Payment",
        transactionDate: currentDate.toString(),
        accountingDate: currentDate.toString(),
        transactionCategoryId: null,
        from: {
          amount: creditCardPaymentAmount,
          symbolId: assetEur.id,
          account: { id: bankAccount.id },
        },
        to: {
          amount: creditCardPaymentAmount,
          symbolId: assetEur.id,
          account: { id: creditCardAccount.id },
        },
      });
      creditCardBalance = 0;
    }

    if (
      currentDate.month() === Month.DECEMBER &&
      currentDate.dayOfMonth() === 15
    ) {
      // Income - bonus
      const bonusAmount = Math.round(randomFloat(0.8, 2.0) * 10000);
      transactions.push({
        id: ulid(),
        description: "Bonus",
        transactionDate: currentDate.toString(),
        accountingDate: currentDate.toString(),
        transactionCategoryId: categorySalary.id,
        from: {
          amount: bonusAmount,
          symbolId: assetEur.id,
          account: { name: "My Company" },
        },
        to: {
          amount: bonusAmount,
          symbolId: assetEur.id,
          account: { id: bankAccount.id },
        },
      });
    }

    if (
      (currentDate.dayOfWeek() === DayOfWeek.SATURDAY ||
        currentDate.dayOfWeek() === DayOfWeek.SUNDAY) &&
      Math.random() > 0.5
    ) {
      // Expense - entertainment
      const entertainmentAmount = Math.round(randomFloat(0.1, 3) * 100);
      creditCardBalance += entertainmentAmount;
      transactions.push({
        id: ulid(),
        description: "Concert",
        transactionDate: currentDate.toString(),
        accountingDate: currentDate.toString(),
        transactionCategoryId: categoryConcert.id,
        from: {
          amount: entertainmentAmount,
          symbolId: assetEur.id,
          account: { id: creditCardAccount.id },
        },
        to: {
          amount: entertainmentAmount,
          symbolId: assetEur.id,
          account: { name: "Concert Shop" },
        },
      });
    }

    // Expense - coffee
    const coffeeAmount = 2;
    creditCardBalance += coffeeAmount;
    transactions.push({
      id: ulid(),
      description: "Coffee",
      transactionDate: currentDate.toString(),
      accountingDate: currentDate.toString(),
      transactionCategoryId: categoryFood.id,
      from: {
        amount: coffeeAmount,
        symbolId: assetEur.id,
        account: { id: creditCardAccount.id },
      },
      to: {
        amount: coffeeAmount,
        symbolId: assetEur.id,
        account: { name: "Coffee Shop" },
      },
    });
  }

  return {
    id: ulid(),
    user: "Test Profile",
    schemaVersion: "1",
    data: {
      encrypted: false,
      data: {
        accounts: [
          bankAccount,
          creditCardAccount,
          savingsAccount,
          investmentAccount,
        ],
        transactions,
        transactionCategories,
        transactionsImporters: [],
        importedTransactions: [],
        assetSymbols: [assetEur, assetUsd, assetIbm],
        assetSymbolExchanges: [exchangeEurUsd, exchangeEurIbm],
        assetSymbolExchangersMetadata: { alphavantage: { apiKey: "demo" } },
        lastUpdated: new Date().toISOString(),
      },
    },
  };
}

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function getDataValidationErrors(data: Data): string[] {
  const errors: string[] = [];

  // Transaction categories
  if (isCycleInTransactionCategories(data.transactionCategories)) {
    errors.push("There are cycles in the transaction categories");
  }

  const existingTransactionCategoryIds = new Set(
    data.transactionCategories.map((category) => category.id),
  );
  for (const category of data.transactionCategories) {
    if (
      category.parentTransactionCategoryId !== null &&
      !existingTransactionCategoryIds.has(category.parentTransactionCategoryId)
    ) {
      errors.push(
        `Transaction category ${category.name} has a non-existing parent category`,
      );
    }
  }

  // Transactions
  const existingAccountIds = new Set(
    data.accounts.map((account) => account.id),
  );
  for (const transaction of data.transactions) {
    if (
      ("id" in transaction.from.account &&
        !existingAccountIds.has(transaction.from.account.id)) ||
      ("id" in transaction.to.account &&
        !existingAccountIds.has(transaction.to.account.id))
    ) {
      errors.push("Transaction has a non-existing account");
      break;
    }

    if (
      transaction.transactionCategoryId !== null &&
      !existingTransactionCategoryIds.has(transaction.transactionCategoryId)
    ) {
      errors.push("Transaction has a non-existing category");
      break;
    }
  }

  return errors;
}
