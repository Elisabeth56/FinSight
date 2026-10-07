import { Arrow, LinkButton } from "@/components/ui/button";
import { links } from "@/lib/site";

const steps = [
  ["01", "Export your statement", "From your bank app or email, as a PDF or CSV. Up to 4 MB."],
  [
    "02",
    "Every line gets sorted",
    "POS, transfers, airtime and bills land in twelve categories. Charges far above your usual get highlighted.",
  ],
  ["03", "Ask anything", "“How much went on Bolt last month?” Tap any answer to see the rows behind it."],
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 pt-32 pb-28">
      <h2 className="max-w-[620px] text-[clamp(36px,4.4vw,52px)] leading-[1.02] font-medium tracking-[-0.03em]">
        From statement to answers in about a minute.
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
        {steps.map(([n, title, body]) => (
          <div key={n} className="group flex flex-col gap-3.5 rounded-3xl bg-surface px-7 py-8">
            <span className="swipe self-start font-figure text-[64px] leading-none text-brand group-hover:[&::after]:[transform:scaleX(1)]">
              {n}
            </span>
            <span className="text-xl font-semibold tracking-[-0.01em]">{title}</span>
            <span className="text-[15px] leading-relaxed text-ink-2">{body}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const promises = [
  ["No bank login, ever", "FinSight only reads the file you give it. It can't move money or see your account."],
  ["The file isn't kept", "We read the rows out of your PDF or CSV, then discard the file itself."],
  ["Delete means delete", "Remove a statement and every row from it goes too."],
  ["Only you can see it", "Every query is scoped to your account, and the demo account holds made-up data."],
];

export function Privacy() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-title"
      className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-12 px-6 pb-32"
    >
      <div className="flex flex-[1_1_320px] flex-col gap-4">
        <span className="text-[13px] tracking-[0.02em] text-brand">Your data</span>
        <h2 id="privacy-title" className="text-[clamp(32px,3.8vw,44px)] leading-[1.05] font-medium tracking-[-0.03em]">
          Your statement stays yours.
        </h2>
      </div>
      <div className="grid flex-[2_1_560px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-8">
        {promises.map(([title, body]) => (
          <div key={title} className="flex flex-col gap-1.5 border-t border-line py-5.5">
            <span className="font-semibold">{title}</span>
            <span className="text-[15px] leading-relaxed text-ink-2">{body}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Closing() {
  return (
    <section className="relative mx-auto mb-6 flex max-w-[1152px] flex-col items-start gap-7 overflow-hidden rounded-[40px] bg-[#ffcf4a] px-[clamp(24px,6vw,80px)] py-[clamp(40px,7vw,96px)] text-[#292826] max-[1200px]:mx-6">
      <span
        aria-hidden
        className="absolute -right-15 -bottom-28 font-figure text-[420px] leading-none text-[#292826]/7 select-none"
      >
        ₦
      </span>
      <h2 className="relative max-w-[760px] text-[clamp(44px,6vw,80px)] leading-[0.98] font-medium tracking-[-0.035em]">
        See where March went, <span className="font-figure font-normal italic">before April does.</span>
      </h2>
      <p className="relative max-w-[480px] text-lg leading-relaxed text-[#3d3a33]">
        Open the demo account in one click, or drop in your own statement. No card needed.
      </p>
      <div className="relative flex flex-wrap gap-3">
        <LinkButton href={links.demo} size="lg" className="!bg-[#1f5a43] !text-[#faf9f7]">
          Try the demo <Arrow />
        </LinkButton>
        <LinkButton href={links.signUp} size="lg" variant="secondary" className="!bg-white/70 !text-[#292826]">
          Upload a statement
        </LinkButton>
      </div>
    </section>
  );
}
