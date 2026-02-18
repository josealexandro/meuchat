import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "meuchat",
    short_name: "meuchat",
    description: "Chat privado para a família",
    start_url: "/",
    display: "standalone",
    background_color: "#0c4a6e",
    theme_color: "#0c4a6e",
    orientation: "portrait-primary",
    lang: "pt-BR",
    dir: "ltr",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["social", "communication"],
  };
}
