"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NxTsconfigPathsWebpackPlugin = void 0;
const path = require("path");
const tsconfig_paths_webpack_plugin_1 = require("tsconfig-paths-webpack-plugin");
const devkit_1 = require("@nx/devkit");
const buildable_libs_utils_1 = require("@nx/js/src/utils/buildable-libs-utils");
const webpack_nx_build_coordination_plugin_1 = require("../webpack-nx-build-coordination-plugin");
class NxTsconfigPathsWebpackPlugin {
    constructor(options) {
        this.options = options;
        if (!this.options.tsConfig)
            throw new Error(`Missing "tsConfig" option. Set this option in your Nx webpack plugin.`);
    }
    apply(compiler) {
        // If we are not building libs from source, we need to remap paths so tsconfig may be updated.
        this.handleBuildLibsFromSource(compiler.options, this.options);
        const extensions = new Set([
            ...['.ts', '.tsx', '.mjs', '.js', '.jsx'],
            ...(compiler.options?.resolve?.extensions ?? []),
        ]);
        compiler.options.resolve = {
            ...compiler.options.resolve,
            plugins: compiler.options.resolve?.plugins ?? [],
        };
        compiler.options.resolve.plugins.push(new tsconfig_paths_webpack_plugin_1.TsconfigPathsPlugin({
            configFile: !path.isAbsolute(this.options.tsConfig)
                ? path.join(devkit_1.workspaceRoot, this.options.tsConfig)
                : this.options.tsConfig,
            extensions: Array.from(extensions),
            mainFields: ['module', 'main'],
        }));
    }
    handleBuildLibsFromSource(config, options) {
        if (!options.buildLibsFromSource && options.targetName) {
            const remappedTarget = options.targetName === 'serve' ? 'build' : options.targetName;
            const { target, dependencies } = (0, buildable_libs_utils_1.calculateProjectBuildableDependencies)(undefined, options.projectGraph, options.root, options.projectName, remappedTarget, options.configurationName);
            options.tsConfig = (0, buildable_libs_utils_1.createTmpTsConfig)(options.tsConfig, options.root, target.data.root, dependencies);
            if (options.targetName === 'serve') {
                const buildableDependencies = dependencies
                    .filter((dependency) => dependency.node.type === 'lib')
                    .map((dependency) => dependency.node.name)
                    .join(',');
                const buildCommand = `nx run-many --target=build --projects=${buildableDependencies}`;
                config.plugins.push(new webpack_nx_build_coordination_plugin_1.WebpackNxBuildCoordinationPlugin(buildCommand, {
                    skipWatchingDeps: options.watchDependencies === false,
                }));
            }
        }
    }
}
exports.NxTsconfigPathsWebpackPlugin = NxTsconfigPathsWebpackPlugin;
