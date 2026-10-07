# FinSight: reading Nigerian bank statements properly

*Draft.*

## Context

FinSight takes the PDF or CSV statement a Nigerian bank or OPay wallet already gives you and turns it into sorted spending, highlighted charges and a chat that answers with exact figures.

## The problem and constraints

Budgeting apps in other markets connect to banks through services like Plaid. Almost nothing like that works in Nigeria, so those apps never reach the people who'd use them. Everyone does have a statement export, but its lines read like `TRF/NIP/FBN/OKONKWO C/09203941` and `WEB/BOLT.EU/O/2603020812`.

The constraints shaped every decision:

- **Free tiers only.** The first version lived on a Supabase free project that paused and was then deleted, taking the schema with it. Whatever replaced it had to survive weeks of no traffic.
- **The LLM is the bottleneck.** Groq's free tier gives a fixed number of tokens a minute. A 600-row statement sent row by row would hit it on a single upload.
- **Money has to be exact.** A chat answer that's off by ₦2,000 is worse than no answer.

## Approach

**The model never adds anything up.** The old chat sent rows to the model and let it total them. It was wrong often enough that I stopped trusting it. Now a small model (gpt-oss-20b on Groq) turns the question into filters: a date range, a category, a merchant keyword. SQL computes the totals and fetches the matching rows, and the answer model gets those numbers with an instruction not to compute. The answer ends with chips that open the rows behind it. The savings report works the same way: the model chooses what to cut and by what share, and code works out the naira.

**Deduplicate before categorizing.** Nigerian statements repeat themselves. In the demo March there are 14 Bolt rides, 12 food purchases and a handful of airtime top-ups. Normalizing narrations (dropping reference numbers and channel prefixes) and sending only the unique ones cuts LLM calls by roughly two thirds, and keeps a long statement inside the free limit. Results are validated with Pydantic, retried once, and fall back to Other rather than failing the upload.

**Integer kobo and totals per currency.** The original schema stored amounts as text and added naira to dollars. Amounts are now signed `bigint` minor units, and summaries group by currency.

**One-time passes instead of subscriptions.** Recurring billing meant webhooks from a Paystack account shared with another app, and a `plan = 'pro'` flag nothing reset. Pro is now a one-time pass that extends `profiles.pro_until`, verified when Paystack sends people back. Verifying a reference twice does nothing.

**Design.** Of three directions I picked "Ledger": warm paper, ink green, and a marigold highlighter that marks the charge that's out of pattern.

## Results

- Parsing: all three fixture statements (a GTBank-style CSV, an Access-style CSV and an OPay-style PDF with wrapped narrations) come out with the exact row count and total, to the kobo. CI checks this on every pull request.
- Categorization: 102 of 102 labelled narrations right on Gemini, up from 98 on the first run once the prompt said plainly that streaming subscriptions are bills. On Groq's gpt-oss-120b, now the primary model, it's 94 of 102: incoming transfers from people still land in Transfers instead of Income.
- Chat: 29 of 30 questions answered with the SQL-computed figure on both providers, including 5 it should decline.
- Chat latency for the full streamed answer: 1.7 s at p50 and 2.4 s at p95 on Groq, against 2.2 s and 3.4 s on Gemini 3.5 Flash-Lite.
- The first eval run caught a bug no test had: the data ended on 28 March, and the intent model decided "March" meant March of last year, so every question about the current month came back empty. One reworded rule fixed it.

## What I learned

Moving the arithmetic out of the model turned a vague quality problem into two checkable ones: did the model pick the right filters, and did it repeat the numbers it was given? The eval can test both, which a prompt tweak never could.

A fallback chain can hide an outage. Groq retired both Llama models the app used, and every request quietly moved to Gemini while the screen looked fine. Running the eval with Groq alone showed it at once. The replacement, gpt-oss, reasons before answering, so a 200-token budget sized for Llama cut its JSON off halfway. Provider changes now get an eval run with the fallback switched off.

Labelling a hundred narrations by hand before tuning prompts forced decisions I had been vague about, such as whether Spotify is entertainment or a bill.

Next, I'd add reading scanned PDFs and catch slow spending creep, which a per-category z-score misses.
