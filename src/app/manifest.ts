import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "بَيِّنَة",
    short_name: "بَيِّنَة",
    description:
      "منصة عربية ذكية للإجابة عن الأسئلة اعتماداً على القرآن الكريم والتفاسير والحديث الشريف والمصادر السردية الموثقة.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    lang: "ar",
    dir: "rtl",
  };
}