"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupViteConfiguration = setupViteConfiguration;
exports.setupVitestConfiguration = setupVitestConfiguration;
const devkit_1 = require("@nx/devkit");
const versions_1 = require("../../../../utils/versions");
async function setupViteConfiguration(tree, options, tasks) {
    const { createOrEditViteConfig, viteConfigurationGenerator } = (0, devkit_1.ensurePackage)('@nx/vite', versions_1.nxVersion);
    // We recommend users use `import.meta.env.MODE` and other variables in their code to differentiate between production and development.
    // See: https://vite.dev/guide/env-and-mode.html
    if (tree.exists((0, devkit_1.joinPathFragments)(options.appProjectRoot, 'src/environments'))) {
        tree.delete((0, devkit_1.joinPathFragments)(options.appProjectRoot, 'src/environments'));
    }
    const reactRouterFrameworkConfig = {
        imports: [`import { reactRouter } from '@react-router/dev/vite'`],
        plugins: ['!process.env.VITEST && reactRouter()'],
    };
    const baseReactConfig = {
        imports: [
            options.compiler === 'swc'
                ? `import react from '@vitejs/plugin-react-swc'`
                : `import react from '@vitejs/plugin-react'`,
        ],
        plugins: ['react()'],
    };
    const viteTask = await viteConfigurationGenerator(tree, {
        uiFramework: 'react',
        project: options.projectName,
        newProject: true,
        includeVitest: options.unitTestRunner === 'vitest',
        inSourceTests: options.inSourceTests,
        compiler: options.compiler,
        skipFormat: true,
        addPlugin: options.addPlugin,
        projectType: 'application',
        port: options.port,
    });
    tasks.push(viteTask);
    createOrEditViteConfig(tree, {
        project: options.projectName,
        includeLib: false,
        includeVitest: options.unitTestRunner === 'vitest',
        inSourceTests: options.inSourceTests,
        rollupOptionsExternal: ["'react'", "'react-dom'", "'react/jsx-runtime'"],
        port: options.port,
        previewPort: options.port,
        useEsmExtension: true,
        ...(options.useReactRouter
            ? reactRouterFrameworkConfig
            : baseReactConfig),
    }, false);
}
async function setupVitestConfiguration(tree, options, tasks) {
    const { createOrEditViteConfig } = (0, devkit_1.ensurePackage)('@nx/vite', versions_1.nxVersion);
    (0, devkit_1.ensurePackage)('@nx/vitest', versions_1.nxVersion);
    const { configurationGenerator } = await Promise.resolve().then(() => require('@nx/vitest/generators'));
    const vitestTask = await configurationGenerator(tree, {
        uiFramework: 'react',
        coverageProvider: 'v8',
        project: options.projectName,
        inSourceTests: options.inSourceTests,
        skipFormat: true,
        addPlugin: options.addPlugin,
    });
    tasks.push(vitestTask);
    createOrEditViteConfig(tree, {
        project: options.projectName,
        includeLib: false,
        includeVitest: true,
        inSourceTests: options.inSourceTests,
        rollupOptionsExternal: ["'react'", "'react-dom'", "'react/jsx-runtime'"],
        imports: [
            options.compiler === 'swc'
                ? `import react from '@vitejs/plugin-react-swc'`
                : `import react from '@vitejs/plugin-react'`,
        ],
        plugins: ['react()'],
        useEsmExtension: true,
    }, true);
    if (options.bundler === 'rsbuild') {
        tree.rename((0, devkit_1.joinPathFragments)(options.appProjectRoot, 'vite.config.mts'), (0, devkit_1.joinPathFragments)(options.appProjectRoot, 'vitest.config.mts'));
    }
}
