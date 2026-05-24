import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    fs: {
      allow: ["."],
      deny: ["**/src-tauri/target/**"],
    },
  },
  optimizeDeps: {
    exclude: ["src-tauri"],
    entries: ["./src-web/main.tsx"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "react";
          if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) return "i18n";
          if (id.includes("node_modules/zustand") || id.includes("node_modules/@tauri-apps")) return "vendor";
        },
      },
    },
  },
});
