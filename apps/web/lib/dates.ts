// Display helpers for the API's dates: months as "YYYY-MM", days as "YYYY-MM-DD".

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const monthIndex = (month: string) => Number(month.slice(5, 7)) - 1;

/** "2026-03" → "March 2026" */
export function monthTitle(month: string): string {
  return `${LONG[monthIndex(month)]} ${month.slice(0, 4)}`;
}

/** "2026-03" → "March" */
export function monthName(month: string): string {
  return LONG[monthIndex(month)];
}

/** "2026-03" → "Mar" */
export function monthShort(month: string): string {
  return MONTHS[monthIndex(month)];
}

/** "2026-03-28" → "28 Mar" */
export function dayShort(day: string): string {
  return `${Number(day.slice(8, 10))} ${MONTHS[monthIndex(day)]}`;
}

/** "Good morning" / "Good afternoon" / "Good evening" for the visitor's local time. */
export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
