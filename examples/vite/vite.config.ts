import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    // Point the package names at the workspace sources so the playground gets
    // HMR without a build step.
    alias: {
      "react-quick-response": resolve(__dirname, "../../packages/react/src"),
      "quick-response-core": resolve(__dirname, "../../packages/core/src"),
    },
    // The library source resolves `react` from its own node_modules. Dedupe to
    // a single copy so hooks share one dispatcher (otherwise: "Cannot read
    // 'useRef' of null").
    dedupe: ["react", "react-dom"],
  },
});
