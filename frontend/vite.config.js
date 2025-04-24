import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        ws: false,
        onError(err, req, res) {
          // Silence parse errors from prefixed backend logs
          if (err.message.includes("Parse Error")) {
            res.end();
          } else {
            console.error("Proxy error:", err);
          }
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.js"],
  },
});
