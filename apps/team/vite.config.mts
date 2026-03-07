/// <reference types='vitest' />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import { execSync } from "node:child_process";

const commitSha = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
})();
const buildTime = new Date().toISOString();

const basePath = process.env.VITE_BASE_PATH || "/app/";

function fixBaseHref(): Plugin {
  return {
    name: "fix-base-href",
    transformIndexHtml(html) {
      return html.replace('<base href="/" />', `<base href="${basePath}" />`);
    },
  };
}

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/apps/team",
  base: basePath,
  server: {
    port: 4200,
    host: "0.0.0.0",
  },
  preview: {
    port: 4200,
    host: "0.0.0.0",
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(["*.md"]), fixBaseHref()],
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  build: {
    outDir: "../../dist/apps/team",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
