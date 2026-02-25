"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devServerExecutor = devServerExecutor;
const webpack = require("webpack");
const devkit_1 = require("@nx/devkit");
const rxjs_for_await_1 = require("@nx/devkit/src/utils/rxjs-for-await");
const operators_1 = require("rxjs/operators");
const WebpackDevServer = require("webpack-dev-server");
const get_dev_server_config_1 = require("./lib/get-dev-server-config");
const buildable_libs_utils_1 = require("@nx/js/src/utils/buildable-libs-utils");
const run_webpack_1 = require("../../utils/run-webpack");
const resolve_user_defined_webpack_config_1 = require("../../utils/webpack/resolve-user-defined-webpack-config");
const normalize_options_1 = require("../webpack/lib/normalize-options");
const config_1 = require("../../utils/config");
const js_1 = require("@nx/js");
async function* devServerExecutor(serveOptions, context) {
    // Default to dev mode so builds are faster and HMR mode works better.
    process.env.NODE_ENV ??= 'development';
    const { root: projectRoot, sourceRoot } = context.projectsConfigurations.projects[context.projectName];
    const buildOptions = (0, normalize_options_1.normalizeOptions)(getBuildOptions(serveOptions, context), context.root, projectRoot, sourceRoot);
    process.env.NX_BUILD_LIBS_FROM_SOURCE = `${buildOptions.buildLibsFromSource}`;
    process.env.NX_BUILD_TARGET = serveOptions.buildTarget;
    // TODO(jack): Figure out a way to port this into NxWebpackPlugin
    if (!buildOptions.buildLibsFromSource) {
        if (!buildOptions.tsConfig) {
            throw new Error(`Cannot find "tsConfig" to remap paths for. Set this option in project.json.`);
        }
        const { target, dependencies } = (0, buildable_libs_utils_1.calculateProjectBuildableDependencies)(context.taskGraph, context.projectGraph, context.root, context.projectName, 'build', // should be generalized
        context.configurationName);
        buildOptions.tsConfig = (0, buildable_libs_utils_1.createTmpTsConfig)(buildOptions.tsConfig, context.root, target.data.root, dependencies);
        process.env.NX_TSCONFIG_PATH = buildOptions.tsConfig;
    }
    let config;
    const devServer = (0, get_dev_server_config_1.getDevServerOptions)(context.root, serveOptions, buildOptions);
    if (buildOptions.webpackConfig) {
        let userDefinedWebpackConfig = (0, resolve_user_defined_webpack_config_1.resolveUserDefinedWebpackConfig)(buildOptions.webpackConfig, (0, js_1.getRootTsConfigPath)());
        if (typeof userDefinedWebpackConfig.then === 'function') {
            userDefinedWebpackConfig = await userDefinedWebpackConfig;
        }
        // Only add the dev server option if user is composable plugin.
        // Otherwise, user should define `devServer` option directly in their webpack config.
        if (typeof userDefinedWebpackConfig === 'function' &&
            ((0, config_1.isNxWebpackComposablePlugin)(userDefinedWebpackConfig) ||
                !buildOptions.standardWebpackConfigFunction)) {
            config = await userDefinedWebpackConfig({ devServer }, {
                options: buildOptions,
                context,
                configuration: serveOptions.buildTarget.split(':')[2],
            });
        }
        else if (userDefinedWebpackConfig) {
            // New behavior, we want the webpack config to export object
            // If the config is a function, we assume it's a standard webpack config function and it's async
            if (typeof userDefinedWebpackConfig === 'function') {
                config = await userDefinedWebpackConfig(process.env.NODE_ENV, {});
            }
            else {
                config = userDefinedWebpackConfig;
            }
            config.devServer ??= devServer;
        }
    }
    return yield* (0, rxjs_for_await_1.eachValueFrom)((0, run_webpack_1.runWebpackDevServer)(config, webpack, WebpackDevServer).pipe((0, operators_1.tap)(({ stats }) => {
        console.info(stats.toString(config.stats));
    }), (0, operators_1.map)(({ baseUrl, stats }) => {
        return {
            baseUrl,
            success: !stats.hasErrors(),
        };
    })));
}
function getBuildOptions(options, context) {
    const target = (0, devkit_1.parseTargetString)(options.buildTarget, context);
    const overrides = {
        watch: false,
    };
    if (options.memoryLimit) {
        overrides.memoryLimit = options.memoryLimit;
    }
    if (options.baseHref) {
        overrides.baseHref = options.baseHref;
    }
    const buildOptions = (0, devkit_1.readTargetOptions)(target, context);
    return {
        ...buildOptions,
        ...overrides,
    };
}
exports.default = devServerExecutor;
