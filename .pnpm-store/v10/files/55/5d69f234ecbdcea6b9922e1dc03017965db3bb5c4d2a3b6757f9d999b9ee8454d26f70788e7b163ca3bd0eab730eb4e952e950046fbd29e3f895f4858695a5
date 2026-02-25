"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const devkit_1 = require("@nx/devkit");
const executor_options_utils_1 = require("@nx/devkit/src/generators/executor-options-utils");
async function default_1(tree) {
    (0, executor_options_utils_1.forEachExecutorOptions)(tree, '@nx/webpack:webpack', (options, projectName, targetName, configurationName) => {
        // Only handle webpack config for default configuration
        if (configurationName)
            return;
        const projectConfiguration = (0, devkit_1.readProjectConfiguration)(tree, projectName);
        if (!options.webpackConfig) {
            delete options['isolatedConfig'];
            options.webpackConfig = `${projectConfiguration.root}/webpack.config.js`;
            tree.write(options.webpackConfig, options.target === 'web'
                ? `
const { composePlugins, withNx, withWeb } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withWeb(), (config) => {
  // Note: This was added by an Nx migration. Webpack builds are required to have a corresponding Webpack config file.
  // See: https://nx.dev/recipes/webpack/webpack-config-setup
  return config;
});
`
                : `
const { composePlugins, withNx } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), (config) => {
  // Note: This was added by an Nx migration. Webpack builds are required to have a corresponding Webpack config file.
  // See: https://nx.dev/recipes/webpack/webpack-config-setup
  return config;
});
        `);
            projectConfiguration.targets[targetName].options = options;
            (0, devkit_1.updateProjectConfiguration)(tree, projectName, projectConfiguration);
        }
    });
    await (0, devkit_1.formatFiles)(tree);
}
