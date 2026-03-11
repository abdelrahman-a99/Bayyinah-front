import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://bayyinah-alpha.vercel.app/";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
