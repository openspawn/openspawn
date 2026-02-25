import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/apps/platform",
  base: "/",
  server: { port: 4301, host: "0.0.0.0" },
  plugins: [react(), nxViteTsPaths()],
  build: {
    outDir: "../../dist/apps/platform",
    emptyOutDir: true,
    reportCompressedSize: true,
  },
});
