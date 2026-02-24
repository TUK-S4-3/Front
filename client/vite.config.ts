
// // https://vite.dev/config/



import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";



export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["tuk-capstone.duckdns.org"],
    proxy: {
      "/api": "http://127.0.0.1:3000",
    },
  },
  resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    },
  },


});
