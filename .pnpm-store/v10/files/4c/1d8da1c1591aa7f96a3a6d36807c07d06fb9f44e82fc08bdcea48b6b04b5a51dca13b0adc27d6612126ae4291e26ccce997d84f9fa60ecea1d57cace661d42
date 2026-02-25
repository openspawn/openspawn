"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nxWebpackComposablePlugin = void 0;
exports.isNxWebpackComposablePlugin = isNxWebpackComposablePlugin;
exports.composePlugins = composePlugins;
exports.composePluginsSync = composePluginsSync;
const devkit_1 = require("@nx/devkit");
const ts_solution_setup_1 = require("@nx/js/src/utils/typescript/ts-solution-setup");
const configuration_1 = require("nx/src/config/configuration");
exports.nxWebpackComposablePlugin = 'nxWebpackComposablePlugin';
function isNxWebpackComposablePlugin(a) {
    return a?.[exports.nxWebpackComposablePlugin] === true;
}
function composePlugins(...plugins) {
    return Object.assign(async function combined(config, ctx) {
        // Webpack may be calling us as a standard config function.
        // Build up Nx context from environment variables.
        // This is to enable `@nx/webpack/plugin` to work with existing projects.
        if (ctx['env']) {
            ensureNxWebpackExecutionContext(ctx);
            // Build this from scratch since what webpack passes us is the env, not config,
            // and `withNX()` creates a new config object anyway.
            config = {};
        }
        for (const plugin of plugins) {
            const fn = await plugin;
            config = await fn(config, ctx);
        }
        return config;
    }, {
        [exports.nxWebpackComposablePlugin]: true,
    });
}
function composePluginsSync(...plugins) {
    return Object.assign(function combined(config, ctx) {
        for (const plugin of plugins) {
            config = plugin(config, ctx);
        }
        return config;
    }, {
        [exports.nxWebpackComposablePlugin]: true,
    });
}
function ensureNxWebpackExecutionContext(ctx) {
    const projectName = process.env.NX_TASK_TARGET_PROJECT;
    const targetName = process.env.NX_TASK_TARGET_TARGET;
    const configurationName = process.env.NX_TASK_TARGET_CONFIGURATION;
    const projectGraph = (0, devkit_1.readCachedProjectGraph)();
    const projectNode = projectGraph.nodes[projectName];
    ctx.options ??= {
        root: devkit_1.workspaceRoot,
        projectRoot: projectNode.data.root,
        sourceRoot: (0, ts_solution_setup_1.getProjectSourceRoot)(projectNode.data),
        // These aren't actually needed since NxWebpackPlugin and withNx both support them being undefined.
        assets: undefined,
        outputPath: undefined,
        tsConfig: undefined,
        outputFileName: undefined,
        useTsconfigPaths: undefined,
    };
    ctx.context ??= {
        projectName,
        targetName,
        configurationName,
        projectsConfigurations: (0, devkit_1.readProjectsConfigurationFromProjectGraph)(projectGraph),
        nxJsonConfiguration: (0, configuration_1.readNxJson)(devkit_1.workspaceRoot),
        cwd: process.cwd(),
        root: devkit_1.workspaceRoot,
        isVerbose: process.env['NX_VERBOSE_LOGGING'] === 'true',
        projectGraph,
    };
}
