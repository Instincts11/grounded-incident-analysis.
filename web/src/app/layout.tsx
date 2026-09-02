import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Nav } from "@/components/site/Nav";
import { NavHistory } from "@/components/site/NavHistory";
import { Cursor } from "@/components/site/Cursor";
import { ThemeProvider } from "@/components/site/Theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

export const metadata: Metadata = {
  title: "Grounded Incident Analysis",
  description:
    "Detectors first, optional Groq rewrite, closed-book Q&A. Logs and metrics in; a ranked origin and a report you can defend out.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`,
          }}
        />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)]">
        <ThemeProvider>
          <div className="noise" />
          <Cursor />
          <NavHistory />
          <Nav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
