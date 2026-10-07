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
- **Phones first.** Most people would open this on a phone, often on a slow connection.

## Approach

**The model never adds anything up.** The old chat sent rows to the model and let it total them. It was wrong often enough that I stopped trusting it. Now a small model (Llama 3.1 8B) turns the question into filters: a date range, a category, a merchant keyword. SQL computes the totals and fetches the matching rows, and the answer model gets those numbers with an instruction not to compute. The stream ends with the row count, date range and categories, which the UI shows as chips that open the transactions behind the answer. The savings report works the same way: the model chooses what to cut and by what share, and code works out the naira.

**Deduplicate before categorizing.** Nigerian statements repeat themselves. In the demo March there are 14 Bolt rides, 12 food purchases and a handful of airtime top-ups. Normalizing narrations (dropping reference numbers and channel prefixes) and sending only the unique ones cuts LLM calls by roughly two thirds, and keeps a long statement inside the free limit. Results are validated with Pydantic, retried once, and fall back to Other rather than failing the upload.

**Integer kobo and totals per currency.** The original schema stored amounts as text and happily added naira to dollars on the dashboard. Every amount is now a signed `bigint` in minor units, and every summary groups by currency.

**One-time passes instead of subscriptions.** Recurring billing brought webhooks from a Paystack account shared with another app, and a `plan = 'pro'` flag that nothing ever reset. Pro is now a one-time pass that extends `profiles.pro_until`. Paystack sends people back to the billing page, which verifies the payment and any other checkout left pending. Verifying the same reference twice does nothing.

**Design.** I explored three directions on a design canvas and picked "Ledger": warm paper, an ink-green brand and a marigold highlighter that swipes across the line that matters. On the overview it marks the charge that's out of pattern.

## Results

- Parsing: all three fixture statements (a GTBank-style CSV, an Access-style CSV and an OPay-style PDF with wrapped narrations) come out with the exact row count and total, to the kobo. CI checks this on every pull request.
- Categorization: 102 of 102 labelled narrations right on Gemini, up from 98 on the first run once the prompt said plainly that streaming subscriptions are bills. On Groq's gpt-oss-120b, now the primary model, it's 94 of 102: incoming transfers from people still land in Transfers instead of Income.
- Chat: 29 of 30 questions answered with the SQL-computed figure on both providers, including 5 it should decline.
- Chat latency for the full streamed answer: 1.7 s at p50 and 2.4 s at p95 on Groq, against 2.2 s and 3.4 s on Gemini 3.5 Flash-Lite.
- The first eval run caught a bug no test had: the data ended on 28 March, and the intent model decided "March" meant March of last year, so every question about the current month came back empty. One reworded rule fixed it.
- Testing uploads end to end showed CSVs with bare amounts were stored as US dollars. They now default to naira.

## What I learned

Moving the arithmetic out of the model turned a vague quality problem into two checkable ones: did the model pick the right filters, and did it repeat the numbers it was given? The eval can test both, which a prompt tweak never could.

A fallback chain can hide an outage. Groq retired both Llama models the app was configured for, and every request quietly moved to Gemini. Nothing on screen looked wrong. Rerunning the eval with Groq alone showed it at once: every AI call failed. Moving to gpt-oss surfaced a second issue. It reasons before it answers, so a 200-token budget that suited Llama cut its JSON off halfway. I now log which provider answered each request, and I run the eval with the fallback off before trusting a provider change.

Building the eval set before tuning prompts also changed what I worked on. Labelling a hundred real-looking narrations by hand forced me to decide edge cases I had been vague about, such as whether Spotify is entertainment or a bill. The prompt and the labels now agree.

Next, I'd add reading scanned PDFs and catch slow spending creep, which a per-category z-score misses.
