import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinSight - AI-Powered Personal Finance Intelligence",
  description: "Transform your bank statements into actionable insights. Automatic spend categorization, trend analysis, and AI-powered chat to understand your finances.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
