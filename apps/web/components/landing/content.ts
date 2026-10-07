// Copy and sample data for the landing page. Figures match the seeded demo account.

export const heroRows = [
  { date: "14 Mar", desc: "POS PURCHASE SHOPRITE LEKKI", cat: "Groceries", amt: "−₦12,450" },
  { date: "14 Mar", desc: "AIRTIME MTN 0803", cat: "Bills", amt: "−₦2,000" },
  { date: "15 Mar", desc: "TRANSFER FROM ADAEZE O.", cat: "Income", amt: "+₦45,000" },
  { date: "16 Mar", desc: "BOLT RIDE LAGOS", cat: "Transport", amt: "−₦3,800" },
  { date: "28 Mar", desc: "JUMIA ONLINE PAYMENT", cat: "Shopping", amt: "−₦45,000", flag: true },
];

export const statementLines = [
  { raw: "TRF/NIP/FBN/OKONKWO C/09203941", name: "Transfer to Chidi Okonkwo", sub: "8 Mar · First Bank", chip: "Transfers", rawAmt: "-20,000.00", amt: "−₦20,000" },
  { raw: "POS/SPAR LEKKI PH1/LA/2341887", name: "Spar, Lekki Phase 1", sub: "12 Mar · Card at POS", chip: "Groceries", rawAmt: "-17,950.00", amt: "−₦17,950" },
  { raw: "WEB/JMIA*ORDER 88213/NG", name: "Jumia order", sub: "28 Mar · 3× your usual", chip: "Unusual", rawAmt: "-45,000.00", amt: "−₦45,000", flag: true },
  { raw: "USSD/AIRTIME/MTN/0803XXX1123", name: "MTN airtime", sub: "3 Mar · USSD", chip: "Bills", rawAmt: "-2,000.00", amt: "−₦2,000" },
  { raw: "SAL/MAR26/TECHNEST LTD/PAY", name: "Salary from Technest", sub: "26 Mar · Monthly", chip: "Income", rawAmt: "350,000.00", amt: "+₦350,000" },
];

export const ticker = [
  ["TRF/NIP/GTB/ADEYEMI T/0049", false],
  ["Transfer to Tunde Adeyemi", true],
  ["POS/SHOPRITE IKEJA CITY MALL", false],
  ["Shoprite, Ikeja · Groceries", true],
  ["WEB/BOLT.EU/O/2603141822", false],
  ["Bolt ride · Transport", true],
  ["USSD/DATA/GLO/0805XXX", false],
  ["Glo data · Bills", true],
  ["CHG/SMS ALERT/Q1 2026", false],
  ["SMS alert fees · Other", true],
  ["POS/CHICKEN REP/LEKKI", false],
  ["Chicken Republic · Food", true],
] as const;

export const features = [
  { title: "Every line, sorted", body: "Twelve plain categories, from Food to Transfers, picked line by line from your narrations." },
  { title: "The odd one, highlighted", body: "A charge far above your usual for that category gets marked the moment it lands." },
  { title: "Months side by side", body: "Six months of spending at a glance, with this month picked out." },
  { title: "A savings report you can act on", body: "Specific cuts tied to your own rows, with the naira worked out for you." },
];

export const categories = [
  { name: "Food & Dining", pct: 100, amt: "₦92,300", color: "var(--series-1)" },
  { name: "Transport", pct: 53, amt: "₦48,600", color: "var(--series-2)" },
  { name: "Bills", pct: 41, amt: "₦37,900", color: "var(--series-3)" },
  { name: "Groceries", pct: 33, amt: "₦30,400", color: "var(--series-4)" },
  { name: "Other", pct: 82, amt: "₦75,300", color: "var(--ink-4)" },
];

export const months: [string, number][] = [
  ["Oct", 74],
  ["Nov", 82],
  ["Dec", 100],
  ["Jan", 70],
  ["Feb", 86],
  ["Mar", 78],
];

export const questions = [
  { ask: "How much did I spend on Bolt last month?", lead: "You took 14 Bolt rides in March for", figure: "₦48,600", tail: ", your second-biggest category.", sources: ["14 transactions", "1–31 Mar 2026"] },
  { ask: "What subscriptions am I paying for?", lead: "Three repeat monthly: DStv, Spotify and iCloud, together", figure: "₦17,350", tail: "a month.", sources: ["9 transactions", "Jan–Mar 2026"] },
  { ask: "Did I spend less than February?", lead: "Yes. March was", figure: "₦31,200 lower", tail: ", mostly from fewer food orders.", sources: ["2 months compared", "Feb–Mar 2026"] },
];

export const faqs = [
  { q: "Which banks work?", a: "Any bank or wallet that lets you export a PDF or CSV statement. OPay statements get special handling because their PDFs wrap descriptions across lines." },
  { q: "Do you need my bank login?", a: "No. FinSight never connects to your bank. It only reads the file you upload, so it can see your transactions but can never move money." },
  { q: "How accurate is the sorting?", a: "We measure it against a set of labelled Nigerian transactions on every change and publish the result. Totals are added up by the database, so figures always match your statement." },
  { q: "What happens to my file?", a: "The rows are read out and the file itself is discarded. You can delete any statement, and every row from it goes too." },
  { q: "Can I try it without uploading anything?", a: "Yes. The demo account holds three months of made-up but realistic Lagos spending. Everything works there, including chat." },
];
