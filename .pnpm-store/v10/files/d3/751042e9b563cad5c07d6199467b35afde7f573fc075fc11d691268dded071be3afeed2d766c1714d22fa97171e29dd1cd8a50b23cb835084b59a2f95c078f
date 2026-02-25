"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertConfigToWebpackPluginGenerator = convertConfigToWebpackPluginGenerator;
const devkit_1 = require("@nx/devkit");
const executor_options_utils_1 = require("@nx/devkit/src/generators/executor-options-utils");
const extract_webpack_options_1 = require("./lib/extract-webpack-options");
const normalize_path_options_1 = require("./lib/normalize-path-options");
const path_1 = require("path");
const validate_project_1 = require("./lib/validate-project");
// Make text JSON compatible
const preprocessText = (text) => {
    return text
        .replace(/(\w+):/g, '"$1":') // Quote property names
        .replace(/'/g, '"') // Convert single quotes to double quotes
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/(\r\n|\n|\r|\t)/gm, ''); // Remove newlines and tabs
};
async function convertConfigToWebpackPluginGenerator(tree, options) {
    let migrated = 0;
    const projects = (0, devkit_1.getProjects)(tree);
    (0, executor_options_utils_1.forEachExecutorOptions)(tree, '@nx/webpack:webpack', (currentTargetOptions, projectName, targetName, configurationName) => {
        if (options.project && projectName !== options.project) {
            return;
        }
        if (!configurationName) {
            const project = projects.get(projectName);
            const target = project.targets[targetName];
            const hasError = (0, validate_project_1.validateProject)(tree, project);
            if (hasError) {
                throw new Error(hasError);
            }
            const webpackConfigPath = currentTargetOptions?.webpackConfig || '';
            if (webpackConfigPath && tree.exists(webpackConfigPath)) {
                let { withNxConfig: webpackOptions, withReactConfig } = (0, extract_webpack_options_1.extractWebpackOptions)(tree, webpackConfigPath);
                // if webpackOptions === undefined
                // withNx was not found in the webpack.config.js file so we should skip this project
                if (webpackOptions !== undefined) {
                    let parsedOptions = {};
                    if (webpackOptions) {
                        parsedOptions = JSON.parse(preprocessText(webpackOptions.getText()));
                        parsedOptions = (0, normalize_path_options_1.normalizePathOptions)(project.root, parsedOptions);
                    }
                    target.options.standardWebpackConfigFunction = true;
                    (0, devkit_1.updateProjectConfiguration)(tree, projectName, project);
                    const { dir, name, ext } = (0, path_1.parse)(webpackConfigPath);
                    tree.rename(webpackConfigPath, `${(0, devkit_1.joinPathFragments)(dir, `${name}.old${ext}`)}`);
                    tree.write(webpackConfigPath, (0, devkit_1.stripIndents) `
            const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
            const { NxReactWebpackPlugin } = require('@nx/react/webpack-plugin');
            const { useLegacyNxPlugin } = require('@nx/webpack');
            
            // This file was migrated using @nx/webpack:convert-config-to-webpack-plugin from your './webpack.config.old.js'
            // Please check that the options here are correct as they were moved from the old webpack.config.js to this file.
            const options = ${webpackOptions ? JSON.stringify(parsedOptions, null, 2) : '{}'};

            /**
              * @type{import('webpack').WebpackOptionsNormalized}
            */
            module.exports = async () => ({
              plugins: [
                ${webpackOptions
                        ? 'new NxAppWebpackPlugin(options)'
                        : 'new NxAppWebpackPlugin()'},
                ${withReactConfig
                        ? `new NxReactWebpackPlugin(${withReactConfig.getText()})`
                        : `new NxReactWebpackPlugin({
                  // Uncomment this line if you don't want to use SVGR
                  // See: https://react-svgr.com/
                  // svgr: false
                  })`},
                // NOTE: useLegacyNxPlugin ensures that the non-standard Webpack configuration file previously used still works.
                // To remove its usage, move options such as "plugins" into this file as standard Webpack configuration options.
                // To enhance configurations after Nx plugins have applied, you can add a new plugin with the \`apply\` method.
                // e.g. \`{ apply: (compiler) => { /* modify compiler.options */ }\`
                // eslint-disable-next-line react-hooks/rules-of-hooks
                await useLegacyNxPlugin(require('./webpack.config.old'), options),
              ],
              });
          `);
                    migrated++;
                }
            }
        }
    });
    if (migrated === 0) {
        throw new Error('Could not find any projects to migrate.');
    }
    if (!options.skipFormat) {
        await (0, devkit_1.formatFiles)(tree);
    }
}
exports.default = convertConfigToWebpackPluginGenerator;
