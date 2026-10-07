# FinSight: reading Nigerian bank statements properly

*Draft. Numbers marked pending fill in once the AI evals have run against a live key.*

## Context

FinSight takes the PDF or CSV statement a Nigerian bank or OPay wallet already gives you and turns it into sorted spending, highlighted charges and a chat that answers with exact figures. I built the first version quickly, then rebuilt it this autumn as a portfolio piece I'd be happy to have an engineer read.

## The problem and constraints

Budgeting apps in other markets connect to banks through services like Plaid. Almost nothing like that works in Nigeria, so those apps never reach the people who'd use them. Everyone does have a statement export, but its lines read like `TRF/NIP/FBN/OKONKWO C/09203941` and `WEB/BOLT.EU/O/2603020812`.

The constraints shaped every decision:

- **Free tiers only.** The first version lived on a Supabase free project that paused and was then deleted, taking the schema with it. Whatever replaced it had to survive weeks of no traffic.
- **The LLM is the bottleneck.** Groq's free tier gives a fixed number of tokens a minute. A 600-row statement sent row by row would hit it on a single upload.
- **Money has to be exact.** A chat answer that's off by ₦2,000 is worse than no answer.
- **Phones first.** Most people would open this on a phone, often on a slow connection.

## Approach

**The model never adds anything up.** The old chat sent rows to the model and let it total them. It was wrong often enough that I stopped trusting it. Now a small model (Llama 3.1 8B) turns the question into filters: a date range, a category, a merchant keyword. SQL computes the totals and fetches the matching rows, and the answer model gets those numbers with an instruction not to compute. The stream ends with the row count, date range and categories, which the UI shows as chips that open the transactions behind the answer. The savings report works the same way: the model chooses what to cut and by what share, and code works out the naira.

**Deduplicate before categorizing.** Nigerian statements repeat themselves. In the demo March there are 14 Bolt rides, 12 food purchases and a handful of airtime top-ups. Normalizing narrations (dropping reference numbers and channel prefixes) and sending only the unique ones cuts LLM calls by roughly two thirds, and keeps a long statement inside the free limit. Results are validated with Pydantic, retried once, and fall back to Other rather than failing the upload.

**Integer kobo and totals per currency.** The original schema stored amounts as text and happily added naira to dollars on the dashboard. Every amount is now a signed `bigint` in minor units, and every summary groups by currency.

**One-time passes instead of subscriptions.** Recurring billing brought webhooks from a Paystack account shared with another app, and a `plan = 'pro'` flag that nothing ever reset. Pro is now a one-time pass that extends `profiles.pro_until`. Paystack sends people back to the billing page, which verifies the payment and any other checkout left pending. Verifying the same reference twice does nothing.

**Design.** I explored three directions on a design canvas and picked "Ledger": warm paper, an ink-green brand and a marigold highlighter that swipes across the line that matters. On the overview it marks the charge that's out of pattern; on the landing page it underlines the headline. Everything else stays quiet.

## Results

- Parsing: all three fixture statements (a GTBank-style CSV, an Access-style CSV and an OPay-style PDF with wrapped narrations) come out with the exact row count and total, to the kobo. CI checks this on every pull request.
- Categorization accuracy on 102 labelled narrations: pending.
- Chat: share of 30 questions answered with the SQL-computed figure, including 5 it should decline: pending.
- Chat latency p50 and p95: pending.
- Testing the upload flow end to end turned up a real bug: CSVs that print bare amounts with no currency mark were stored as US dollars. They now default to naira, with a test.

## What I learned

Moving the arithmetic out of the model turned a vague quality problem into two checkable ones: did the model pick the right filters, and did it repeat the numbers it was given? The eval can test both, which a prompt tweak never could.

Building the eval set before tuning prompts also changed what I worked on. Labelling a hundred real-looking narrations by hand forced me to decide edge cases I had been vague about, such as whether Spotify is entertainment or a bill. The prompt and the labels now agree.

Next, I'd add reading scanned PDFs and catch slow spending creep, which a per-category z-score misses.
