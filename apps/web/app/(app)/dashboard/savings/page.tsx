import type { Metadata } from "next";

import { SavingsScreen } from "@/components/app/savings/savings-screen";

export const metadata: Metadata = { title: "Savings" };

export default function SavingsPage() {
  return <SavingsScreen />;
}
