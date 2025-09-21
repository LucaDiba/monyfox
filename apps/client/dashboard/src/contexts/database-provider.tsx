import {ReactNode} from "react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {Spinner} from "@/components/ui/spinner";
import {type Profile} from "@monyfox/common-data";
import {toast} from "sonner";
import {DatabaseIDBImpl} from "@/database/database-idb";
import {type ExchangeRateDb, type Database} from "@/database/database";
import {ErrorPage} from "@/components/error-page";
import {DatabaseContext} from "./database-context";
import {notEmpty} from "@/utils/array";
import {Duration} from "@js-joda/core";

const EXCHANGE_RATE_TTL_MS = Duration.ofDays(28).toMillis();
const isExchangeRateExpired = (v: ExchangeRateDb) =>
  Date.now() - Date.parse(v.updatedAt) > EXCHANGE_RATE_TTL_MS;

export const DatabaseProvider = ({children}: { children: ReactNode }) => {
  const dbQuery = useQuery({queryKey: ["database"], queryFn: getDatabase});

  if (dbQuery.isPending) {
    return <LoadingPage/>;
  }

  if (dbQuery.isError) {
    console.error(dbQuery.error);
    return <ErrorPage title="Database error" message={dbQuery.error.message}/>;
  }

  return (
    <DatabaseDataProvider db={dbQuery.data}>{children}</DatabaseDataProvider>
  );
};

function DatabaseDataProvider({
  db,
  children,
}: {
  db: Database;
  children: ReactNode;
}) {
  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: () => db.profiles.getAll(),
  });

  const saveProfileMutation = useMutation({
    mutationFn: (profile: Profile) => db.profiles.upsert(profile),
    onSuccess: () => {
      profilesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => db.profiles.delete(id),
    onSuccess: () => {
      profilesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const exchangeRatesQuery = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: async () => {
      const all = await db.exchangeRates.getAll();
      const expiredIds = all.filter(isExchangeRateExpired).map(({id}) => id);
      await Promise.all(expiredIds.map((id) => db.exchangeRates.delete(id)));
      return all.filter(({id}) => !expiredIds.includes(id));
    },
  });

  const saveExchangeRatesAsync = async (exchangeRate: ExchangeRateDb) => {
    await db.exchangeRates.upsert(exchangeRate);
  };

  if (profilesQuery.isPending || exchangeRatesQuery.isPending) {
    return <LoadingPage/>;
  }

  if (profilesQuery.isError || exchangeRatesQuery.isError) {
    const errorMessages = [
      profilesQuery.error?.message,
      exchangeRatesQuery.error?.message,
    ].filter(notEmpty);
    return (
      <ErrorPage title="Database error" message={errorMessages.join("\n")}/>
    );
  }

  return (
    <DatabaseContext.Provider
      value={{
        profiles: profilesQuery.data,
        saveProfile: saveProfileMutation,
        deleteProfile: deleteProfileMutation,
        exchangeRates: exchangeRatesQuery.data,
        saveExchangeRatesAsync,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

function LoadingPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm" title="Loading...">
        <Spinner/>
      </div>
    </div>
  );
}

async function getDatabase() {
  const db = new DatabaseIDBImpl();
  await db.init();
  return db;
}
