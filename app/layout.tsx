import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://worktrackr.app"),
  title: {
    default: "WorkTrackr",
    template: "%s | WorkTrackr",
  },
  description:
    "Modern time-tracking for distributed teams. Employees log hours, admins approve with ease.",
  openGraph: {
    title: "WorkTrackr",
    description:
      "Modern time-tracking for distributed teams. Employees log hours, admins approve with ease.",
    type: "website",
    url: "https://worktrackr.app",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[rgb(var(--color-background))]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
