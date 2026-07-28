import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Point the package names at the workspace sources so the example runs
    // against the current code without a build step.
    alias: {
      "react-quick-response": resolve(__dirname, "../../packages/react/src"),
      "quick-response-core": resolve(__dirname, "../../packages/core/src"),
    },
    dedupe: ["react", "react-dom"],
  },
  plugins: [tailwindcss(), reactRouter(), svgr()],
});
