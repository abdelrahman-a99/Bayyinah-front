import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description:
    "سجّل الدخول إلى بَيِّنَة للوصول إلى محادثاتك وطرح أسئلتك حول القرآن الكريم والتفاسير والحديث الشريف.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "تسجيل الدخول | بَيِّنَة",
    description:
      "سجّل الدخول إلى بَيِّنَة للوصول إلى محادثاتك وطرح أسئلتك حول القرآن الكريم والتفاسير والحديث الشريف.",
    url: "/login",
    siteName: "بَيِّنَة",
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "تسجيل الدخول | بَيِّنَة",
    description:
      "سجّل الدخول إلى بَيِّنَة للوصول إلى محادثاتك وطرح أسئلتك حول القرآن الكريم والتفاسير والحديث الشريف.",
  },
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
