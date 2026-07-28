import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: "tsconfig.json",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ReactQR",
      fileName: "react-quick-response",
    },
    rollupOptions: {
      // quick-response-core stays external: it is a real dependency, so
      // consumers dedupe it instead of inlining a second copy.
      external: ["react", "react/jsx-runtime", "quick-response-core"],
      output: {
        globals: {
          react: "React",
          "react/jsx-runtime": "ReactJsxRuntime",
          "quick-response-core": "QuickResponse",
        },
      },
    },
  },
});
