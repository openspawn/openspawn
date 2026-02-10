/// <reference types='vitest' />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join } from "node:path";

const commitSha = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'unknown'; }
})();
const buildTime = new Date().toISOString();

const isDemo = process.env.VITE_DEMO_MODE === 'true';
const basePath = isDemo ? '/openspawn/demo/' : '/';

// Plugin to fix base href in HTML and create 404.html for SPA routing
function fixBaseHref(): Plugin {
  return {
    name: 'fix-base-href',
    transformIndexHtml(html) {
      return html.replace('<base href="/" />', `<base href="${basePath}" />`);
    },
    closeBundle() {
      // For GitHub Pages: copy index.html to 404.html for SPA routing
      if (isDemo) {
        const outDir = resolve(import.meta.dirname, '../../dist/apps/dashboard');
        const indexPath = join(outDir, 'index.html');
        const notFoundPath = join(outDir, '404.html');
        if (existsSync(indexPath)) {
          copyFileSync(indexPath, notFoundPath);
        }
      }
    },
  };
}

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/apps/dashboard",
  // For GitHub Pages demo deployment, use /openspawn/demo/ base
  base: basePath,
  server: {
    port: 4200,
    host: "0.0.0.0",
  },
  preview: {
    port: 4200,
    host: "0.0.0.0",
  },
  plugins: [
    react({
      plugins: [
        [
          '@swc-contrib/plugin-graphql-codegen-client-preset',
          {
            artifactDirectory: './src/graphql/generated',
            gqlTagName: 'graphql',
          },
        ],
      ],
    }),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(["*.md"]),
    fixBaseHref(),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //   plugins: () => [ nxViteTsPaths() ],
  // },
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  build: {
    outDir: "../../dist/apps/dashboard",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: "dashboard",
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    setupFiles: ["./src/test-setup.ts"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/apps/dashboard",
      provider: "v8" as const,
    },
  },
}));
