"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDependencies = ensureDependencies;
const devkit_1 = require("@nx/devkit");
const versions_1 = require("./versions");
function ensureDependencies(host, schema) {
    const devDependencies = {};
    if (schema.testEnvironment === 'jsdom') {
        devDependencies['jsdom'] = versions_1.jsdomVersion;
    }
    else if (schema.testEnvironment === 'happy-dom') {
        devDependencies['happy-dom'] = versions_1.happyDomVersion;
    }
    else if (schema.testEnvironment === 'edge-runtime') {
        devDependencies['@edge-runtime/vm'] = versions_1.edgeRuntimeVmVersion;
    }
    else if (schema.testEnvironment !== 'node' && schema.testEnvironment) {
        devkit_1.logger.info(`A custom environment was provided: ${schema.testEnvironment}. You need to install it manually.`);
    }
    if (schema.uiFramework === 'angular') {
        devDependencies['@analogjs/vitest-angular'] = versions_1.analogVitestAngular;
        devDependencies['@analogjs/vite-plugin-angular'] = versions_1.analogVitestAngular;
    }
    if (schema.uiFramework === 'react') {
        if (schema.compiler === 'swc') {
            devDependencies['@vitejs/plugin-react-swc'] = versions_1.vitePluginReactSwcVersion;
        }
        else {
            devDependencies['@vitejs/plugin-react'] = versions_1.vitePluginReactVersion;
        }
    }
    if (schema.includeLib) {
        devDependencies['vite-plugin-dts'] = versions_1.vitePluginDtsVersion;
        if ((0, devkit_1.detectPackageManager)() !== 'pnpm') {
            devDependencies['ajv'] = versions_1.ajvVersion;
        }
    }
    return (0, devkit_1.addDependenciesToPackageJson)(host, {}, devDependencies);
}
