"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webpackExecutor = webpackExecutor;
const devkit_1 = require("@nx/devkit");
const rxjs_for_await_1 = require("@nx/devkit/src/utils/rxjs-for-await");
const js_1 = require("@nx/js");
const ts_solution_setup_1 = require("@nx/js/src/utils/typescript/ts-solution-setup");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const config_1 = require("../../utils/config");
const resolve_user_defined_webpack_config_1 = require("../../utils/webpack/resolve-user-defined-webpack-config");
const normalize_options_1 = require("./lib/normalize-options");
const run_webpack_1 = require("./lib/run-webpack");
async function getWebpackConfigs(options, context) {
    let userDefinedWebpackConfig = null;
    if (options.webpackConfig) {
        userDefinedWebpackConfig = (0, resolve_user_defined_webpack_config_1.resolveUserDefinedWebpackConfig)(options.webpackConfig, (0, js_1.getRootTsConfigPath)());
        if (typeof userDefinedWebpackConfig.then === 'function') {
            userDefinedWebpackConfig = await userDefinedWebpackConfig;
        }
    }
    const config = {};
    if (typeof userDefinedWebpackConfig === 'function' &&
        ((0, config_1.isNxWebpackComposablePlugin)(userDefinedWebpackConfig) ||
            !options.standardWebpackConfigFunction)) {
        // Old behavior, call the Nx-specific webpack config function that user exports
        return await userDefinedWebpackConfig(config, {
            options,
            context,
            configuration: context.configurationName, // backwards compat
        });
    }
    else if (userDefinedWebpackConfig) {
        if (typeof userDefinedWebpackConfig === 'function') {
            // assume it's an async standard webpack config function
            // https://webpack.js.org/configuration/configuration-types/#exporting-a-promise
            return await userDefinedWebpackConfig(process.env.NODE_ENV, {});
        }
        // New behavior, we want the webpack config to export object
        return userDefinedWebpackConfig;
    }
    else {
        // Fallback case, if we cannot find a webpack config path
        return config;
    }
}
async function* webpackExecutor(_options, context) {
    // Default to production build.
    process.env['NODE_ENV'] ||= 'production';
    const metadata = context.projectsConfigurations.projects[context.projectName];
    const sourceRoot = (0, ts_solution_setup_1.getProjectSourceRoot)(metadata);
    const options = (0, normalize_options_1.normalizeOptions)(_options, context.root, metadata.root, sourceRoot);
    const isScriptOptimizeOn = typeof options.optimization === 'boolean'
        ? options.optimization
        : options.optimization && options.optimization.scripts
            ? options.optimization.scripts
            : false;
    process.env.NODE_ENV ||= isScriptOptimizeOn
        ? 'production'
        : 'development';
    process.env.NX_BUILD_LIBS_FROM_SOURCE = `${options.buildLibsFromSource}`;
    process.env.NX_BUILD_TARGET = (0, devkit_1.targetToTargetString)({
        project: context.projectName,
        target: context.targetName,
        configuration: context.configurationName,
    });
    if (options.compiler === 'swc') {
        try {
            require.resolve('swc-loader');
            require.resolve('@swc/core');
        }
        catch {
            devkit_1.logger.error(`Missing SWC dependencies: @swc/core, swc-loader. Make sure you install them first.`);
            return {
                success: false,
                options,
            };
        }
    }
    if (options.generatePackageJson && metadata.projectType !== 'application') {
        devkit_1.logger.warn((0, devkit_1.stripIndents) `The project ${context.projectName} is using the 'generatePackageJson' option which is deprecated for library projects. It should only be used for applications.
        For libraries, configure the project to use the '@nx/dependency-checks' ESLint rule instead (https://nx.dev/nx-api/eslint-plugin/documents/dependency-checks).`);
    }
    const configs = await getWebpackConfigs(options, context);
    return yield* (0, rxjs_for_await_1.eachValueFrom)((0, rxjs_1.of)(configs).pipe((0, operators_1.mergeMap)((config) => (Array.isArray(config) ? (0, rxjs_1.from)(config) : (0, rxjs_1.of)(config))), 
    // Run build sequentially and bail when first one fails.
    (0, operators_1.mergeScan)((acc, config) => {
        if (!acc.hasErrors()) {
            return (0, run_webpack_1.runWebpack)(config).pipe((0, operators_1.tap)((stats) => {
                console.info(stats.toString(config.stats));
            }));
        }
        else {
            return (0, rxjs_1.of)();
        }
    }, { hasErrors: () => false }, 1), 
    // Collect build results as an array.
    (0, operators_1.bufferCount)(Array.isArray(configs) ? configs.length : 1), (0, operators_1.switchMap)(async (results) => {
        const success = results.every((result) => Boolean(result) && !result.hasErrors());
        // TODO(jack): This should read output from webpack config if provided.
        // The outfile is only used by NestJS, where `@nx/js:node` executor requires it to run the file.
        return {
            success,
            outfile: (0, path_1.resolve)(context.root, options.outputPath, options.outputFileName),
            options,
        };
    })));
}
exports.default = webpackExecutor;
