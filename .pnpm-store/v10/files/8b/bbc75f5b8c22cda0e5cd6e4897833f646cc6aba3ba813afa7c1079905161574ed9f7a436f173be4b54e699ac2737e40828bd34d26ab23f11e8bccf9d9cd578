"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebpack = initWebpack;
const devkit_1 = require("@nx/devkit");
const versions_1 = require("../../../../utils/versions");
async function initWebpack(tree, options, tasks) {
    const { webpackInitGenerator } = (0, devkit_1.ensurePackage)('@nx/webpack', versions_1.nxVersion);
    const webpackInitTask = await webpackInitGenerator(tree, {
        skipPackageJson: options.skipPackageJson,
        skipFormat: true,
        addPlugin: options.addPlugin,
    });
    tasks.push(webpackInitTask);
    if (!options.skipPackageJson) {
        const { ensureDependencies } = await Promise.resolve().then(() => require('@nx/webpack/src/utils/ensure-dependencies'));
        tasks.push(ensureDependencies(tree, { uiFramework: 'react' }));
    }
}
