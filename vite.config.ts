import { config } from "dotenv";
config();

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
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
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
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
