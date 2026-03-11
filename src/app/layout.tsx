import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import type { Metadata } from "next";
import { Noto_Kufi_Arabic, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const notoKufi = Noto_Kufi_Arabic({
  variable: "--font-kufi",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const notoNaskh = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bayyinah-alpha.vercel.app/"),
  applicationName: "بَيِّنَة",
  title: {
    default: "بَيِّنَة",
    template: "%s | بَيِّنَة",
  },
  description:
    "بَيِّنَة منصة عربية ذكية للإجابة عن الأسئلة اعتماداً على القرآن الكريم والتفاسير والحديث الشريف والمصادر السردية الموثقة.",
  keywords: [
    "بَيِّنَة",
    "القرآن الكريم",
    "تفسير القرآن",
    "الحديث الشريف",
    "صحيح مسلم",
    "قصص الأنبياء",
    "إسلام",
    "أسئلة دينية",
    "ذكاء اصطناعي إسلامي",
    "Arabic Islamic AI",
    "Quran",
    "Tafsir",
    "Hadith",
  ],
  authors: [{ name: "بَيِّنَة" }],
  creator: "بَيِّنَة",
  publisher: "بَيِّنَة",
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "/",
    siteName: "بَيِّنَة",
    title: "بَيِّنَة",
    description:
      "منصة عربية ذكية للإجابة عن الأسئلة اعتماداً على القرآن الكريم والتفاسير والحديث الشريف والمصادر السردية الموثقة.",
  },
  twitter: {
    card: "summary_large_image",
    title: "بَيِّنَة",
    description:
      "منصة عربية ذكية للإجابة عن الأسئلة اعتماداً على القرآن الكريم والتفاسير والحديث الشريف والمصادر السردية الموثقة.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${notoKufi.variable} ${notoNaskh.variable} antialiased font-kufi text-foreground bg-background selection:bg-primary/30 min-h-screen`}
      >
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Analytics />
            <SpeedInsights />
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
