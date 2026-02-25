"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDependencies = ensureDependencies;
const devkit_1 = require("@nx/devkit");
const add_swc_dependencies_1 = require("@nx/js/src/utils/swc/add-swc-dependencies");
const versions_1 = require("./versions");
function ensureDependencies(tree, options) {
    const tasks = [];
    const devDependencies = {};
    if (options.compiler === 'swc') {
        devDependencies['swc-loader'] = versions_1.swcLoaderVersion;
        const addSwcTask = (0, add_swc_dependencies_1.addSwcDependencies)(tree);
        tasks.push(addSwcTask);
    }
    if (options.compiler === 'tsc') {
        devDependencies['tslib'] = versions_1.tsLibVersion;
    }
    if (options.uiFramework === 'react') {
        devDependencies['@pmmmwh/react-refresh-webpack-plugin'] =
            versions_1.reactRefreshWebpackPluginVersion;
        devDependencies['@svgr/webpack'] = versions_1.svgrWebpackVersion;
        devDependencies['react-refresh'] = versions_1.reactRefreshVersion;
    }
    tasks.push((0, devkit_1.addDependenciesToPackageJson)(tree, {}, devDependencies));
    return (0, devkit_1.runTasksInSerial)(...tasks);
}
