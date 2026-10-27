/** Canonical site origin used by metadata, robots.txt and sitemap.xml. */
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
