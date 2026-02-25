"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLegacyNxPlugin = useLegacyNxPlugin;
const devkit_1 = require("@nx/devkit");
const normalize_options_1 = require("../nx-webpack-plugin/lib/normalize-options");
const configuration_1 = require("nx/src/config/configuration");
/**
 * This function is used to wrap the legacy plugin function to be used with the `composePlugins` function.
 * Initially the webpack config would be passed to the legacy plugin function and the options would be passed as a second argument.
 * example:
 * module.exports = composePlugins(
      withNx(),
      (config) => {
        return config;
      }
  );

Since composePlugins is async, this function is used to wrap the legacy plugin function to be async.
Using the nxUseLegacyPlugin function, the first argument is the legacy plugin function and the second argument is the options.
The context options are created and passed to the legacy plugin function.

module.exports = async () => ({
  plugins: [
  ...otherPlugins,
    await nxUseLegacyPlugin(require({path}), options),
  ],
});
 * @param fn The legacy plugin function usually from `combinedPlugins`
 * @param executorOptions The options passed usually inside the executor or the config file
 * @returns Webpack configuration
 */
async function useLegacyNxPlugin(fn, executorOptions) {
    if (global.NX_GRAPH_CREATION) {
        return;
    }
    const options = (0, normalize_options_1.normalizeOptions)(executorOptions);
    const projectGraph = (0, devkit_1.readCachedProjectGraph)();
    const projectName = process.env.NX_TASK_TARGET_PROJECT;
    const project = projectGraph.nodes[projectName];
    const targetName = process.env.NX_TASK_TARGET_TARGET;
    const context = {
        cwd: process.cwd(),
        isVerbose: process.env.NX_VERBOSE_LOGGING === 'true',
        root: devkit_1.workspaceRoot,
        projectGraph,
        projectsConfigurations: (0, devkit_1.readProjectsConfigurationFromProjectGraph)(projectGraph),
        nxJsonConfiguration: (0, configuration_1.readNxJson)(devkit_1.workspaceRoot),
        target: project.data.targets[targetName],
        targetName: targetName,
        projectName: projectName,
    };
    const configuration = process.env.NX_TASK_TARGET_CONFIGURATION;
    const ctx = {
        context,
        options: options,
        configuration,
    };
    return {
        apply(compiler) {
            compiler.hooks.beforeCompile.tapPromise('NxLegacyAsyncPlugin', () => {
                return new Promise((resolve) => {
                    fn(compiler.options, ctx).then((updated) => {
                        // Merge options back shallowly since it's a fully functional configuration.
                        // Most likely, the user modified the config in place, but this guarantees that updates are applied if users did something like:
                        // `return { ...config, plugins: [...config.plugins, new MyPlugin()] }`
                        Object.assign(compiler.options, updated);
                        resolve();
                    });
                });
            });
        },
    };
}
