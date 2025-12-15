import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // This proxy will forward everything cleanly and follow redirects
      "/proxy-api": {
        target: "https://bb-booking-sys-production.up.railway.app/",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy-api/, ""),
        followRedirects: true,
      },
      "/login": {
        target: "https://bb-booking-sys-production.up.railway.app/",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});