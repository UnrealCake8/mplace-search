import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./search-refresh.css";

export const metadata: Metadata = {
  title: "MPlace Search",
  description: "MPlace Search is the safety-first search engine in the MPlace family, with no AI summaries and no adult-mode switch.",
  applicationName: "MPlace Search",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const mAdsSiteId = process.env.NEXT_PUBLIC_MADS_SITE_ID;

  return (
    <html lang="en">
      <body>
        {children}
        {mAdsSiteId ? (
          <Script
            src="https://ads.mplace.cc/sdk.js"
            data-site={mAdsSiteId}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
