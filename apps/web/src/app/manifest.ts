import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Bull & Cow",
    short_name: "Bull & Cow",
    description: "Бики та корови — гра для двох / Bulls and cows for two",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf8fd",
    theme_color: "#faf8fd",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
