import type { Metadata } from "next";
import "./globals.css";
import "./search-refresh.css";

export const metadata: Metadata = {
  title: "MPlace Search",
  description: "Search the web with MPlace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
