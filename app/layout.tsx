import type { Metadata } from "next";
import "./globals.css";
import "./modern.css";

export const metadata: Metadata = {
  title: "System Snacks — Small bites. Big systems.",
  description: "Learn system design with two-minute lessons, tiny diagrams, and practice that sticks.",
  icons: {
    icon: process.env.NODE_ENV === "production" ? "/system-snacks/favicon.svg" : "/favicon.svg",
    shortcut: process.env.NODE_ENV === "production" ? "/system-snacks/favicon.svg" : "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
