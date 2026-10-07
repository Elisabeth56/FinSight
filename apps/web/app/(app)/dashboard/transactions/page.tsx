import type { Metadata } from "next";
import { Suspense } from "react";

import { TransactionsScreen } from "@/components/app/transactions/transactions-screen";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  // filters live in the URL, which needs a Suspense boundary for static rendering
  return (
    <Suspense>
      <TransactionsScreen />
    </Suspense>
  );
}
