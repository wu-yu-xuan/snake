import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "fs-extra",
        replacement: "src/utils/fs-extra.vite.ts",
      },
    ],
  },
});
