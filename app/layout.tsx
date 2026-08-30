import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionProvider } from "@/lib/permissions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://poultry.trueops.app"
  ),

  title: {
    default:
      "PoultryOps — Poultry Farm Management & Intelligence Platform",
    template:
      "%s | PoultryOps",
  },

  description:
    "PoultryOps helps poultry farmers manage flocks, feed, feed inventory, egg production, mortality, health, sales and expenses — while turning farm records into practical intelligence for better performance and profitability.",

  applicationName:
    "PoultryOps",

  keywords: [
    "PoultryOps",
    "poultry farm management",
    "poultry farm software",
    "poultry management software",
    "poultry farm management system",
    "poultry farming",
    "flock management",
    "feed management",
    "feed inventory",
    "egg production",
    "poultry mortality",
    "poultry farm analytics",
    "poultry farm intelligence",
    "poultry FCR",
    "poultry farm profitability",
  ],

  authors: [
    {
      name: "PoultryOps",
      url: "https://poultry.trueops.app",
    },
  ],

  creator:
    "PoultryOps",

  publisher:
    "PoultryOps",

  category:
    "Agriculture",

  alternates: {
    canonical:
      "https://poultry.trueops.app",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",

    url:
      "https://poultry.trueops.app",

    siteName:
      "PoultryOps",

    title:
      "PoultryOps — Smarter Poultry Farm Management",

    description:
      "Manage flocks, understand feed and production, track farm performance, and turn poultry farm records into practical intelligence.",

    locale:
      "en_IE",
  },

  twitter: {
    card:
      "summary",

    title:
      "PoultryOps — Smarter Poultry Farm Management",

    description:
      "Manage flocks, feed, production, health, sales and expenses — and turn farm data into practical farm intelligence.",
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">

        <Script
          src="https://checkout.flutterwave.com/v3.js"
          strategy="afterInteractive"
        />

        <AuthProvider>
          <PermissionProvider>
            {children}
          </PermissionProvider>
        </AuthProvider>

      </body>
    </html>
  );
}