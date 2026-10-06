import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* ===== Left — branding panel (desktop only) ===== */}
      <aside className="hidden lg:flex lg:w-[45%] relative overflow-hidden hero-bg">
        {/* subtle animated wave lines, matching marketing hero */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 800 900"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M-100 300 Q 200 250, 400 300 T 800 300 T 1200 300"
            stroke="rgba(34, 197, 94, 0.4)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M-100 450 Q 250 400, 450 450 T 850 450 T 1250 450"
            stroke="rgba(34, 197, 94, 0.3)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M-100 600 Q 300 550, 500 600 T 900 600 T 1300 600"
            stroke="rgba(34, 197, 94, 0.2)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* glow orb */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FinSight</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Your finances,
              <br />
              <span className="text-gradient">crystal clear.</span>
            </h2>
            <p className="text-green-100/70 text-sm leading-relaxed">
              Upload a bank statement, chat with your money, and discover
              where to save — in seconds.
            </p>

            {/* decorative stat strip */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { label: "Avg. saved", value: "$347/mo" },
                { label: "Parse time", value: "< 3s" },
                { label: "Categories", value: "Auto" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3"
                >
                  <p className="text-xs text-green-100/60 mb-1">{s.label}</p>
                  <p className="text-white font-semibold text-sm">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-green-100/50">
            © 2026 FinSight · Powered by Groq + LLaMA 3
          </p>
        </div>
      </aside>

      {/* ===== Right — form ===== */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-12 relative">
        {/* mobile-only logo */}
        <Link
          href="/"
          className="lg:hidden absolute top-6 left-6 flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">FinSight</span>
        </Link>

        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
