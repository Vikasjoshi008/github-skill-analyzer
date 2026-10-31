import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitHub Skill Analyzer",
  description:
    "Analyze GitHub profiles using AI to uncover hidden skills and insights.",
  openGraph: {
    title: "GitHub Skill Analyzer",
    description:
      "Analyze GitHub profiles using AI to uncover hidden skills and insights.",
    url: "https://github-skill-analyzer.vercel.app/",
    siteName: "GitHub Skill Analyzer",
    images: [
      {
        url: "https://github-skill-analyzer.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "GitHub Skill Analyzer Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Skill Analyzer",
    description:
      "Analyze GitHub profiles using AI to uncover hidden skills and insights.",
    images: ["https://github-skill-analyzer.vercel.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-black text-white selection:bg-fuchsia-500/30`}
      >
        {/* Professional Top Navigation Bar - Floating */}
        <div className="sticky top-4 z-50 w-full px-4 flex justify-center">
          <header className="border border-white/10 bg-zinc-900/80 backdrop-blur-md rounded-full px-4 sm:px-6 h-16 flex items-center justify-between shadow-lg w-full max-w-5xl">
            {/* Logo Area */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                <Image
                  src="/icon.svg"
                  alt="Skill Analyzer Logo"
                  width={30}
                  height={30}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-base sm:text-lg tracking-tight truncate">
                Skill Analyzer
              </span>
            </div>

            {/* GitHub Repo Link */}
            <a
              href="https://github.com/vikasjoshi008/github-skill-analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors shrink-0"
              title="View Source on GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
          </header>
        </div>

        {/* Main Content Area */}
        <main className="flex-grow w-full relative flex flex-col items-center">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none" />

          {/* Removed max-w-3xl from here so page.tsx can control its own width */}
          <div className="relative z-10 w-full">{children}</div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-500 w-full mt-auto">
          <p>
            © {new Date().getFullYear()} GitHub Skill Analyzer. Built for
            developers.
          </p>
        </footer>
      </body>
    </html>
  );
}
