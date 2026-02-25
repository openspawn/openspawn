"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationGenerator = configurationGenerator;
exports.configurationGeneratorInternal = configurationGeneratorInternal;
const devkit_1 = require("@nx/devkit");
const init_1 = require("../init/init");
const has_plugin_1 = require("../../utils/has-plugin");
const target_defaults_utils_1 = require("@nx/devkit/src/generators/target-defaults-utils");
const ensure_dependencies_1 = require("../../utils/ensure-dependencies");
function configurationGenerator(tree, options) {
    return configurationGeneratorInternal(tree, { addPlugin: false, ...options });
}
async function configurationGeneratorInternal(tree, options) {
    const tasks = [];
    const nxJson = (0, devkit_1.readNxJson)(tree);
    const addPluginDefault = process.env.NX_ADD_PLUGINS !== 'false' &&
        nxJson.useInferencePlugins !== false;
    options.addPlugin ??= addPluginDefault;
    const initTask = await (0, init_1.webpackInitGenerator)(tree, {
        ...options,
        skipFormat: true,
    });
    tasks.push(initTask);
    const depsTask = (0, ensure_dependencies_1.ensureDependencies)(tree, {
        compiler: options.compiler === 'babel' ? undefined : options.compiler,
    });
    tasks.push(depsTask);
    checkForTargetConflicts(tree, options);
    if (!(0, has_plugin_1.hasPlugin)(tree)) {
        addBuildTarget(tree, options);
        if (options.devServer) {
            addServeTarget(tree, options);
        }
    }
    createWebpackConfig(tree, options);
    if (!options.skipFormat) {
        await (0, devkit_1.formatFiles)(tree);
    }
    return (0, devkit_1.runTasksInSerial)(...tasks);
}
function checkForTargetConflicts(tree, options) {
    if (options.skipValidation)
        return;
    const project = (0, devkit_1.readProjectConfiguration)(tree, options.project);
    if (project.targets?.build) {
        throw new Error(`Project "${project.name}" already has a build target. Pass --skipValidation to ignore this error.`);
    }
    if (options.devServer && project.targets?.serve) {
        throw new Error(`Project "${project.name}" already has a serve target. Pass --skipValidation to ignore this error.`);
    }
}
function createWebpackConfig(tree, options) {
    const project = (0, devkit_1.readProjectConfiguration)(tree, options.project);
    const buildOptions = {
        target: options.target,
        outputPath: (0, devkit_1.joinPathFragments)('dist', project.root),
        compiler: options.compiler ?? 'swc',
        main: options.main ?? (0, devkit_1.joinPathFragments)(project.root, 'src/main.ts'),
        tsConfig: options.tsConfig ?? (0, devkit_1.joinPathFragments)(project.root, 'tsconfig.app.json'),
        webpackConfig: (0, devkit_1.joinPathFragments)(project.root, 'webpack.config.js'),
    };
    if (options.target === 'web') {
        tree.write((0, devkit_1.joinPathFragments)(project.root, 'webpack.config.js'), (0, has_plugin_1.hasPlugin)(tree)
            ? `
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '${(0, devkit_1.offsetFromRoot)(project.root)}${buildOptions.outputPath}'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: '${buildOptions.target}',
      tsConfig: '${buildOptions.tsConfig}',
      compiler: '${buildOptions.compiler}',
      main: '${buildOptions.main}',
      outputHashing: '${buildOptions.target !== 'web' ? 'none' : 'all'}',
    })
  ],
}
`
            : `
const { composePlugins, withNx, withWeb } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withWeb(), (config) => {
  // Update the webpack config as needed here.
  // e.g. \`config.plugins.push(new MyPlugin())\`
  config.output.clean = true;
  return config;
});
`);
    }
    else {
        tree.write((0, devkit_1.joinPathFragments)(project.root, 'webpack.config.js'), (0, has_plugin_1.hasPlugin)(tree)
            ? `
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '${(0, devkit_1.offsetFromRoot)(project.root)}${buildOptions.outputPath}'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: '${buildOptions.target}',
      tsConfig: '${buildOptions.tsConfig}',
      compiler: '${buildOptions.compiler}',
      main: '${buildOptions.main}',
      outputHashing: '${buildOptions.target !== 'web' ? 'none' : 'all'}',
    })
  ],
}
`
            : `
const { composePlugins, withNx } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), (config) => {
  // Update the webpack config as needed here.
  // e.g. \`config.plugins.push(new MyPlugin())\`
  config.output.clean = true;
  return config;
});
`);
    }
}
function addBuildTarget(tree, options) {
    (0, target_defaults_utils_1.addBuildTargetDefaults)(tree, '@nx/webpack:webpack');
    const project = (0, devkit_1.readProjectConfiguration)(tree, options.project);
    const buildOptions = {
        target: options.target,
        outputPath: (0, devkit_1.joinPathFragments)('dist', project.root),
        compiler: options.compiler ?? 'swc',
        main: options.main ?? (0, devkit_1.joinPathFragments)(project.root, 'src/main.ts'),
        tsConfig: options.tsConfig ?? (0, devkit_1.joinPathFragments)(project.root, 'tsconfig.app.json'),
        webpackConfig: (0, devkit_1.joinPathFragments)(project.root, 'webpack.config.js'),
    };
    if (options.webpackConfig) {
        buildOptions.webpackConfig = options.webpackConfig;
    }
    if (options.babelConfig) {
        buildOptions.babelConfig = options.babelConfig;
    }
    else if (options.compiler === 'babel') {
        // If no babel config file is provided then write a default one, otherwise build will fail.
        (0, devkit_1.writeJson)(tree, (0, devkit_1.joinPathFragments)(project.root, '.babelrc'), {
            presets: ['@nx/js/babel'],
        });
    }
    (0, devkit_1.updateProjectConfiguration)(tree, options.project, {
        ...project,
        targets: {
            ...project.targets,
            build: {
                executor: '@nx/webpack:webpack',
                outputs: ['{options.outputPath}'],
                defaultConfiguration: 'production',
                options: buildOptions,
                configurations: {
                    production: {
                        optimization: true,
                        outputHashing: options.target === 'web' ? 'all' : 'none',
                        sourceMap: false,
                        namedChunks: false,
                        extractLicenses: true,
                        vendorChunk: false,
                    },
                },
            },
        },
    });
}
function addServeTarget(tree, options) {
    const project = (0, devkit_1.readProjectConfiguration)(tree, options.project);
    (0, devkit_1.updateProjectConfiguration)(tree, options.project, {
        ...project,
        targets: {
            ...project.targets,
            serve: {
                executor: '@nx/webpack:dev-server',
                options: {
                    buildTarget: `${options.project}:build`,
                },
                configurations: {
                    production: {
                        buildTarget: `${options.project}:build:production`,
                    },
                },
            },
        },
    });
}
exports.default = configurationGenerator;
