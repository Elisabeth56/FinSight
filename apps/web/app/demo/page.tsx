import { redirect } from "next/navigation";

// Signs straight into the seeded demo account once Neon Auth is wired (#6).
export default function Demo() {
  redirect("/login?demo=1");
}
