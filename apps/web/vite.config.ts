import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Mirrors the production rewrite in render.yaml, so dev exercises the same
    // same-origin path as prod. Only used when VITE_API_URL is relative
    // ("/api/v1"); an absolute VITE_API_URL bypasses this entirely.
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY_TARGET ?? "http://localhost:3001",
      },
    },
  },
});
