import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in surfaces and the design-system gallery carry no public value.
      disallow: ["/customer/", "/provider/", "/admin/", "/login", "/register", "/kitchen-sink"],
    },
    sitemap: "https://ghorly.com/sitemap.xml",
  };
}
