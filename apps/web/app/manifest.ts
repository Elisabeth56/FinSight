import type { MetadataRoute } from "next";

// Lets Chrome install FinSight with its own square icon. Without a manifest it falls back
// to the favicon and draws it inside a white circle.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinSight",
    short_name: "FinSight",
    description: "Your bank statement, read properly.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f0eeeb",
    theme_color: "#1f5a43",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // full-bleed square; the OS cuts its own shape, so the logo stays inside the safe zone
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
