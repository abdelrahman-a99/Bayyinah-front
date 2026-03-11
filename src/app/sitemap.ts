import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://bayyinah-alpha.vercel.app/";
  const now = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}