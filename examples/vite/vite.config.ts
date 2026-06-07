import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  // The example imports the library source (../../../src), which resolves
  // `react` from the repo-root node_modules. Dedupe to a single copy so
  // hooks share one dispatcher (otherwise: "Cannot read 'useRef' of null").
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
