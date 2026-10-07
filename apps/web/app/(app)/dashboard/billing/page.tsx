import type { Metadata } from "next";
import { Suspense } from "react";

import { BillingScreen } from "@/components/app/billing/billing-screen";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  // reads ?reference= from Paystack's return, which needs a Suspense boundary
  return (
    <Suspense>
      <BillingScreen />
    </Suspense>
  );
}
