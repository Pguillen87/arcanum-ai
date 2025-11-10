import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      isDevelopment && componentTagger(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icon-192.png", "icon-512.png", "offline.html", "offline.css"],
        devOptions: {
          // Em desenvolvimento desabilitamos o Service Worker para evitar fallback offline indevido
          enabled: false,
        },
        manifest: {
          name: "Arcanum.AI - Portal de Transmutação Criativa",
          short_name: "Arcanum.AI",
          description: "Transforme sua criatividade através da alquimia da IA",
          theme_color: "#8b5cf6",
          background_color: "#1a0d2e",
          display: "standalone",
          orientation: "portrait-primary",
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          navigateFallback: "/offline.html",
          navigateFallbackAllowlist: [/\/$/],
          runtimeCaching: [
            // Cache de assets estáticos
            {
              urlPattern: /\/(assets|icon-\d+\.png|manifest\.json).*/,
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Rotas de auth/dados – não cachear
            {
              urlPattern: /\/(auth|api)\/.*/,
              handler: "NetworkOnly",
              options: {
                cacheName: "no-cache-auth-api"
              }
            }
          ]
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
