import { config } from "dotenv";
config();

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async () => {
  const cartographerPlugins =
    process.env.NODE_ENV !== "production" && process.env.REPL_ID
      ? [(await import("@replit/vite-plugin-cartographer")).cartographer()]
      : [];

  return {
    plugins: [react(), runtimeErrorOverlay(), ...cartographerPlugins],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    envPrefix: "VITE_",
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
