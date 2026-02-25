"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRsbuild = initRsbuild;
exports.setupRsbuildConfiguration = setupRsbuildConfiguration;
const devkit_1 = require("@nx/devkit");
const versions_1 = require("../../../../utils/versions");
const maybe_js_1 = require("../../../../utils/maybe-js");
async function initRsbuild(tree, options, tasks) {
    (0, devkit_1.ensurePackage)('@nx/rsbuild', versions_1.nxVersion);
    const { initGenerator } = await Promise.resolve().then(() => require('@nx/rsbuild/generators'));
    const initTask = await initGenerator(tree, {
        skipPackageJson: options.skipPackageJson,
        addPlugin: true,
        skipFormat: true,
    });
    tasks.push(initTask);
}
async function setupRsbuildConfiguration(tree, options, tasks) {
    (0, devkit_1.ensurePackage)('@nx/rsbuild', versions_1.nxVersion);
    const { configurationGenerator } = await Promise.resolve().then(() => require('@nx/rsbuild/generators'));
    const { addBuildPlugin, addCopyAssets, addHtmlTemplatePath, addExperimentalSwcPlugin, addSourceDefine, versions, } = await Promise.resolve().then(() => require('@nx/rsbuild/config-utils'));
    const rsbuildTask = await configurationGenerator(tree, {
        project: options.projectName,
        entry: (0, maybe_js_1.maybeJs)({
            js: options.js,
            useJsx: true,
        }, `./src/main.tsx`),
        tsConfig: './tsconfig.app.json',
        target: 'web',
        devServerPort: options.devServerPort ?? 4200,
    });
    tasks.push(rsbuildTask);
    const pathToConfigFile = (0, devkit_1.joinPathFragments)(options.appProjectRoot, 'rsbuild.config.ts');
    if (options.inSourceTests && options.unitTestRunner === 'vitest') {
        addSourceDefine(tree, pathToConfigFile, 'import.meta.vitest', 'undefined');
    }
    const deps = { '@rsbuild/plugin-react': versions.rsbuildPluginReactVersion };
    addBuildPlugin(tree, pathToConfigFile, '@rsbuild/plugin-react', 'pluginReact', options.style === '@emotion/styled'
        ? `swcReactOptions: {\n\timportSource: '@emotion/react',\n}`
        : undefined);
    if (options.style === 'scss') {
        addBuildPlugin(tree, pathToConfigFile, '@rsbuild/plugin-sass', 'pluginSass');
        deps['@rsbuild/plugin-sass'] = versions.rsbuildPluginSassVersion;
    }
    else if (options.style === 'less') {
        addBuildPlugin(tree, pathToConfigFile, '@rsbuild/plugin-less', 'pluginLess');
        deps['@rsbuild/plugin-less'] = versions.rsbuildPluginLessVersion;
    }
    else if (options.style === '@emotion/styled') {
        deps['@swc/plugin-emotion'] = versions.rsbuildSwcPluginEmotionVersion;
        addExperimentalSwcPlugin(tree, pathToConfigFile, '@swc/plugin-emotion');
    }
    else if (options.style === 'styled-jsx') {
        deps['@swc/plugin-styled-jsx'] = versions.rsbuildSwcPluginStyledJsxVersion;
        addExperimentalSwcPlugin(tree, pathToConfigFile, '@swc/plugin-styled-jsx');
    }
    else if (options.style === 'styled-components') {
        deps['@rsbuild/plugin-styled-components'] =
            versions.rsbuildPluginStyledComponentsVersion;
        addBuildPlugin(tree, pathToConfigFile, '@rsbuild/plugin-styled-components', 'pluginStyledComponents');
    }
    addHtmlTemplatePath(tree, pathToConfigFile, './src/index.html');
    addCopyAssets(tree, pathToConfigFile, './src/assets');
    addCopyAssets(tree, pathToConfigFile, './src/favicon.ico');
    tasks.push((0, devkit_1.addDependenciesToPackageJson)(tree, {}, deps));
}
