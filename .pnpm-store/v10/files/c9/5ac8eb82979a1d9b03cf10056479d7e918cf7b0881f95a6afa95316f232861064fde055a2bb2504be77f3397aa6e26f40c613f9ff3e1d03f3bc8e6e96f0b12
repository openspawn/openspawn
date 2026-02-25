"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockViteReactAppGenerator = mockViteReactAppGenerator;
exports.mockReactAppGenerator = mockReactAppGenerator;
exports.mockReactMixedAppGenerator = mockReactMixedAppGenerator;
exports.mockWebAppGenerator = mockWebAppGenerator;
exports.mockAngularAppGenerator = mockAngularAppGenerator;
exports.mockUnknownAppGenerator = mockUnknownAppGenerator;
exports.mockReactLibNonBuildableJestTestRunnerGenerator = mockReactLibNonBuildableJestTestRunnerGenerator;
exports.mockReactLibNonBuildableVitestRunnerGenerator = mockReactLibNonBuildableVitestRunnerGenerator;
const devkit_1 = require("@nx/devkit");
const reactViteConfig = require("./test-files/react-vite-project.config.json");
const angularAppConfig = require("./test-files/angular-project.config.json");
const randomAppConfig = require("./test-files/unknown-project.config.json");
const mixedAppConfig = require("./test-files/react-mixed-project.config.json");
const reactLibNBJest = require("./test-files/react-lib-non-buildable-jest.json");
const reactLibNBVitest = require("./test-files/react-lib-non-buildable-vitest.json");
function mockViteReactAppGenerator(tree) {
    const appName = 'my-test-react-vite-app';
    tree.write(`apps/${appName}/src/main.tsx`, `import ReactDOM from 'react-dom';\n`);
    tree.write(`apps/${appName}/tsconfig.json`, `{
      "compilerOptions": {
        "jsx": "react-jsx",
        "allowJs": false,
        "esModuleInterop": false,
        "allowSyntheticDefaultImports": true,
        "strict": true,
        "types": ["vite/client"]
      },
      "files": [],
      "include": [],
      "references": [
        {
          "path": "./tsconfig.app.json"
        },
        {
          "path": "./tsconfig.spec.json"
        }
      ],
      "extends": "../../tsconfig.base.json"
      }
      `);
    tree.write(`apps/${appName}/tsconfig.app.json`, `{
      "extends": "./tsconfig.json",
      "compilerOptions": {
        "outDir": "../../dist/out-tsc",
        "types": ["node"]
      },
      "files": [
        "../../node_modules/@nx/react/typings/cssmodule.d.ts",
        "../../node_modules/@nx/react/typings/image.d.ts"
      ],
      "exclude": [
        "src/**/*.spec.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.tsx",
        "src/**/*.test.tsx",
        "src/**/*.spec.js",
        "src/**/*.test.js",
        "src/**/*.spec.jsx",
        "src/**/*.test.jsx"
      ],
      "include": ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx"]
    }   
      `);
    tree.write(`apps/${appName}/index.html`, `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Rv1</title>
        <base href="/" />
    
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="stylesheet" href="/src/styles.css" />
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>`);
    tree.write(`apps/${appName}/vite.config.ts`, `    /// <reference types="vitest" />
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import tsconfigPaths from 'vite-tsconfig-paths';
    
    export default defineConfig({

      cacheDir: '../../node_modules/.vitest',
      server: {
        port: 4200,
        host: 'localhost',
      },
      plugins: [
        react(),
        tsconfigPaths({
          root: '../../',
          projects: ['tsconfig.base.json'],
        }),
      ],
    
      test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      },
    });
    `);
    (0, devkit_1.writeJson)(tree, 'workspace.json', {
        projects: {
            'my-test-react-vite-app': {
                ...reactViteConfig,
                root: `apps/${appName}`,
                projectType: 'application',
            },
        },
    });
    (0, devkit_1.writeJson)(tree, `apps/${appName}/project.json`, {
        ...reactViteConfig,
        root: `apps/${appName}`,
        projectType: 'application',
    });
    return tree;
}
function mockReactAppGenerator(tree, userAppName) {
    const appName = userAppName ?? 'my-test-react-app';
    tree.write(`apps/${appName}/src/main.tsx`, `import ReactDOM from 'react-dom';\n`);
    tree.write(`apps/${appName}/webpack.config.ts`, ``);
    tree.write(`apps/${appName}/tsconfig.json`, `{
        "extends": "../../tsconfig.base.json",
        "compilerOptions": {
          "jsx": "react-jsx",
          "allowJs": true,
          "esModuleInterop": true,
          "allowSyntheticDefaultImports": true,
          "forceConsistentCasingInFileNames": true,
          "strict": true,
          "noImplicitOverride": true,
          "noPropertyAccessFromIndexSignature": true,
          "noImplicitReturns": true,
          "noFallthroughCasesInSwitch": true
        },
        "files": [],
        "include": [],
        "references": [
          {
            "path": "./tsconfig.app.json"
          },
          {
            "path": "./tsconfig.spec.json"
          }
        ]
      }
      `);
    tree.write(`apps/${appName}/tsconfig.app.json`, `{
      "extends": "./tsconfig.json",
      "compilerOptions": {
        "outDir": "../../dist/out-tsc"
      },
      "files": [
        "../../node_modules/@nx/react/typings/cssmodule.d.ts",
        "../../node_modules/@nx/react/typings/image.d.ts"
      ],
      "exclude": [
        "jest.config.cts",
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/*.spec.tsx",
        "**/*.test.tsx",
        "**/*.spec.js",
        "**/*.test.js",
        "**/*.spec.jsx",
        "**/*.test.jsx"
      ],
      "include": ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"]
    }   
      `);
    tree.write(`apps/${appName}/src/index.html`, `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>My Test React App</title>
        <base href="/" />
    
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="favicon.ico" />
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>`);
    (0, devkit_1.writeJson)(tree, `apps/${appName}/project.json`, {
        root: `apps/${appName}`,
        projectType: 'application',
    });
    return tree;
}
function mockReactMixedAppGenerator(tree) {
    const appName = 'my-test-mixed-react-app';
    tree.write(`apps/${appName}/src/main.tsx`, `import ReactDOM from 'react-dom';\n`);
    tree.write(`apps/${appName}/tsconfig.json`, `{
        "extends": "../../tsconfig.base.json",
        "compilerOptions": {
          "jsx": "react-jsx",
          "allowJs": true,
          "esModuleInterop": true,
          "allowSyntheticDefaultImports": true,
          "forceConsistentCasingInFileNames": true,
          "strict": true,
          "noImplicitOverride": true,
          "noPropertyAccessFromIndexSignature": true,
          "noImplicitReturns": true,
          "noFallthroughCasesInSwitch": true
        },
        "files": [],
        "include": [],
        "references": [
          {
            "path": "./tsconfig.app.json"
          },
          {
            "path": "./tsconfig.spec.json"
          }
        ]
      }
      `);
    tree.write(`apps/${appName}/tsconfig.app.json`, `{
      "extends": "./tsconfig.json",
      "compilerOptions": {
        "outDir": "../../dist/out-tsc"
      },
      "files": [
        "../../node_modules/@nx/react/typings/cssmodule.d.ts",
        "../../node_modules/@nx/react/typings/image.d.ts"
      ],
      "exclude": [
        "jest.config.cts",
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/*.spec.tsx",
        "**/*.test.tsx",
        "**/*.spec.js",
        "**/*.test.js",
        "**/*.spec.jsx",
        "**/*.test.jsx"
      ],
      "include": ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"]
    }   
      `);
    tree.write(`apps/${appName}/src/index.html`, `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>My Test React App</title>
        <base href="/" />
    
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="favicon.ico" />
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>`);
    (0, devkit_1.writeJson)(tree, 'workspace.json', {
        projects: {
            'my-test-mixed-react-app': {
                ...mixedAppConfig,
                root: `apps/${appName}`,
                projectType: 'application',
            },
        },
    });
    (0, devkit_1.writeJson)(tree, `apps/${appName}/project.json`, {
        ...mixedAppConfig,
        root: `apps/${appName}`,
        projectType: 'application',
    });
    return tree;
}
function mockWebAppGenerator(tree) {
    const appName = 'my-test-web-app';
    tree.write(`apps/${appName}/src/main.ts`, `import './app/app.element.ts';`);
    tree.write(`apps/${appName}/tsconfig.json`, `{
        "extends": "../../tsconfig.base.json",
        "files": [],
        "include": [],
        "references": [
          {
            "path": "./tsconfig.app.json"
          },
          {
            "path": "./tsconfig.spec.json"
          }
        ]
      }      
        `);
    tree.write(`apps/${appName}/webpack.config.ts`, ``);
    tree.write(`apps/${appName}/src/index.html`, `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>WebappPure</title>
        <base href="/" />
    
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="favicon.ico" />
      </head>
      <body>
        <workspace-root></workspace-root>
      </body>
    </html>
    `);
    (0, devkit_1.writeJson)(tree, 'workspace.json', {
        projects: {
            'my-test-web-app': {
                root: `apps/${appName}`,
                projectType: 'application',
            },
        },
    });
    (0, devkit_1.writeJson)(tree, `apps/${appName}/project.json`, {
        root: `apps/${appName}`,
        projectType: 'application',
    });
    return tree;
}
function mockAngularAppGenerator(tree) {
    const appName = 'my-test-angular-app';
    (0, devkit_1.writeJson)(tree, 'workspace.json', {
        projects: {
            'my-test-angular-app': {
                ...angularAppConfig,
                root: `apps/${appName}`,
                projectType: 'application',
            },
        },
    });
    (0, devkit_1.writeJson)(tree, `apps/${appName}/project.json`, {
        ...angularAppConfig,
        root: `apps/${appName}`,
        projectType: 'application',
    });
    (0, devkit_1.writeJson)(tree, `apps/${appName}/tsconfig.json`, {
        compilerOptions: {
            target: 'es2022',
            esModuleInterop: true,
            forceConsistentCasingInFileNames: true,
            strict: true,
            noImplicitOverride: true,
            noPropertyAccessFromIndexSignature: true,
            noImplicitReturns: true,
            noFallthroughCasesInSwitch: true,
        },
        files: [],
        include: [],
        references: [
            {
                path: './tsconfig.editor.json',
            },
            {
                path: './tsconfig.app.json',
            },
            {
                path: './tsconfig.spec.json',
            },
        ],
        extends: '../../tsconfig.base.json',
        angularCompilerOptions: {
            enableI18nLegacyMessageIdFormat: false,
            strictInjectionParameters: true,
            strictInputAccessModifiers: true,
            strictTemplates: true,
        },
    });
    (0, devkit_1.writeJson)(tree, `apps/${appName}/tsconfig.app.json`, {
        extends: './tsconfig.json',
        compilerOptions: {
            outDir: '../../dist/out-tsc',
            types: [],
        },
        files: ['src/main.ts'],
        include: ['src/**/*.d.ts'],
        exclude: ['jest.config.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    });
    (0, devkit_1.writeJson)(tree, `apps/${appName}/tsconfig.spec.json`, {
        extends: './tsconfig.json',
        compilerOptions: {
            outDir: '../../dist/out-tsc',
            module: 'commonjs',
            target: 'es2016',
            types: ['jest', 'node'],
        },
        files: ['src/test-setup.ts'],
        include: [
            'jest.config.ts',
            'src/**/*.test.ts',
            'src/**/*.spec.ts',
            'src/**/*.d.ts',
        ],
    });
    return tree;
}
function mockUnknownAppGenerator(tree) {
    const appName = 'my-test-random-app';
    (0, devkit_1.writeJson)(tree, 'workspace.json', {
        projects: {
            'my-test-random-app': {
                ...randomAppConfig,
                root: `apps/${appName}`,
                projectType: 'application',
            },
        },
    });
    (0, devkit_1.writeJson)(tree, `apps/${appName}/project.json`, {
        ...randomAppConfig,
        root: `apps/${appName}`,
        projectType: 'application',
    });
    return tree;
}
function mockReactLibNonBuildableJestTestRunnerGenerator(tree) {
    const libName = 'react-lib-nonb-jest';
    tree.write(`libs/${libName}/src/index.ts`, ``);
    tree.write(`libs/${libName}/tsconfig.json`, `{
      "compilerOptions": {
        "jsx": "react-jsx",
        "allowJs": false,
        "esModuleInterop": false,
        "allowSyntheticDefaultImports": true,
        "strict": true
      },
      "files": [],
      "include": [],
      "references": [
        {
          "path": "./tsconfig.lib.json"
        },
        {
          "path": "./tsconfig.spec.json"
        }
      ],
      "extends": "../../tsconfig.base.json"
    }`);
    tree.write(`libs/${libName}/tsconfig.lib.json`, `{
      "extends": "./tsconfig.json",
      "compilerOptions": {
        "outDir": "../../dist/out-tsc",
        "types": ["node"]
      },
      "files": [
        "../../node_modules/@nx/react/typings/cssmodule.d.ts",
        "../../node_modules/@nx/react/typings/image.d.ts"
      ],
      "exclude": [
        "jest.config.cts",
        "src/**/*.spec.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.tsx",
        "src/**/*.test.tsx",
        "src/**/*.spec.js",
        "src/**/*.test.js",
        "src/**/*.spec.jsx",
        "src/**/*.test.jsx"
      ],
      "include": ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx"]
    }`);
    (0, devkit_1.writeJson)(tree, 'workspace.json', {
        projects: {
            [`${libName}`]: {
                ...reactLibNBJest,
                root: `libs/${libName}`,
                projectType: 'library',
            },
        },
    });
    (0, devkit_1.writeJson)(tree, `libs/${libName}/project.json`, {
        ...reactLibNBJest,
        root: `libs/${libName}`,
        projectType: 'library',
    });
    return tree;
}
function mockReactLibNonBuildableVitestRunnerGenerator(tree) {
    const libName = 'react-lib-nonb-vitest';
    tree.write(`libs/${libName}/src/index.ts`, ``);
    tree.write(`libs/${libName}/vite.config.ts`, `/// <reference types="vitest" />
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

    export default defineConfig({

      cacheDir: '../../node_modules/.vitest',
      plugins: [
        nxViteTsPaths(),
        react(),
      ],

      test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      },
    });
  `);
    tree.write(`libs/${libName}/tsconfig.json`, `{
      "compilerOptions": {
        "jsx": "react-jsx",
        "allowJs": false,
        "esModuleInterop": false,
        "allowSyntheticDefaultImports": true,
        "strict": true
      },
      "files": [],
      "include": [],
      "references": [
        {
          "path": "./tsconfig.lib.json"
        },
        {
          "path": "./tsconfig.spec.json"
        }
      ],
      "extends": "../../tsconfig.base.json"
    }`);
    tree.write(`libs/${libName}/tsconfig.lib.json`, `{
      "extends": "./tsconfig.json",
      "compilerOptions": {
        "outDir": "../../dist/out-tsc",
        "types": ["node"]
      },
      "files": [
        "../../node_modules/@nx/react/typings/cssmodule.d.ts",
        "../../node_modules/@nx/react/typings/image.d.ts"
      ],
      "exclude": [
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/*.spec.tsx",
        "**/*.test.tsx",
        "**/*.spec.js",
        "**/*.test.js",
        "**/*.spec.jsx",
        "**/*.test.jsx"
      ],
      "include": ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"]
    }`);
    (0, devkit_1.writeJson)(tree, 'workspace.json', {
        projects: {
            [`${libName}`]: {
                ...reactLibNBVitest,
                root: `libs/${libName}`,
                projectType: 'library',
            },
        },
    });
    (0, devkit_1.writeJson)(tree, `libs/${libName}/project.json`, {
        ...reactLibNBVitest,
        root: `libs/${libName}`,
        projectType: 'library',
    });
    return tree;
}
