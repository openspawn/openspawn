"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptions = normalizeOptions;
exports.normalizePluginPath = normalizePluginPath;
const path_1 = require("path");
const normalize_options_1 = require("../../../plugins/nx-webpack-plugin/lib/normalize-options");
const ts_solution_setup_1 = require("@nx/js/src/utils/typescript/ts-solution-setup");
function normalizeOptions(options, root, projectRoot, sourceRoot) {
    const normalizedOptions = {
        ...options,
        useTsconfigPaths: !(0, ts_solution_setup_1.isUsingTsSolutionSetup)(),
        root,
        projectRoot,
        sourceRoot,
        target: options.target ?? 'web',
        outputFileName: options.outputFileName ?? 'main.js',
        webpackConfig: normalizePluginPath(options.webpackConfig, root),
        fileReplacements: (0, normalize_options_1.normalizeFileReplacements)(root, options.fileReplacements ?? []),
        optimization: typeof options.optimization !== 'object'
            ? {
                scripts: options.optimization,
                styles: options.optimization,
            }
            : options.optimization,
    };
    if (options.assets) {
        normalizedOptions.assets = (0, normalize_options_1.normalizeAssets)(options.assets, root, sourceRoot, projectRoot, false // executor assets are relative to workspace root for consistency
        );
    }
    return normalizedOptions;
}
function normalizePluginPath(pluginPath, root) {
    if (!pluginPath) {
        return '';
    }
    try {
        return require.resolve(pluginPath);
    }
    catch {
        return (0, path_1.resolve)(root, pluginPath);
    }
}
