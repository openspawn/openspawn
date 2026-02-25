"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodesV2 = exports.createNodes = exports.createDependencies = void 0;
const devkit_1 = require("@nx/devkit");
const calculate_hash_for_create_nodes_1 = require("@nx/devkit/src/utils/calculate-hash-for-create-nodes");
const get_named_inputs_1 = require("@nx/devkit/src/utils/get-named-inputs");
const js_1 = require("@nx/js");
const ts_solution_setup_1 = require("@nx/js/src/utils/typescript/ts-solution-setup");
const fs_1 = require("fs");
const file_hasher_1 = require("nx/src/hasher/file-hasher");
const cache_directory_1 = require("nx/src/utils/cache-directory");
const path_1 = require("path");
const read_webpack_options_1 = require("../utils/webpack/read-webpack-options");
const resolve_user_defined_webpack_config_1 = require("../utils/webpack/resolve-user-defined-webpack-config");
const util_1 = require("@nx/js/src/plugins/typescript/util");
const pmc = (0, devkit_1.getPackageManagerCommand)();
function readTargetsCache(cachePath) {
    return (0, fs_1.existsSync)(cachePath) ? (0, devkit_1.readJsonFile)(cachePath) : {};
}
function writeTargetsToCache(cachePath, results) {
    (0, devkit_1.writeJsonFile)(cachePath, results);
}
/**
 * @deprecated The 'createDependencies' function is now a no-op. This functionality is included in 'createNodesV2'.
 */
const createDependencies = () => {
    return [];
};
exports.createDependencies = createDependencies;
const webpackConfigGlob = '**/webpack.config.{js,ts,mjs,cjs}';
exports.createNodes = [
    webpackConfigGlob,
    async (configFilePaths, options, context) => {
        const optionsHash = (0, file_hasher_1.hashObject)(options);
        const cachePath = (0, path_1.join)(cache_directory_1.workspaceDataDirectory, `webpack-${optionsHash}.hash`);
        const targetsCache = readTargetsCache(cachePath);
        const normalizedOptions = normalizeOptions(options);
        const isTsSolutionSetup = (0, ts_solution_setup_1.isUsingTsSolutionSetup)();
        try {
            return await (0, devkit_1.createNodesFromFiles)((configFile, options, context) => createNodesInternal(configFile, options, context, targetsCache, isTsSolutionSetup), configFilePaths, normalizedOptions, context);
        }
        finally {
            writeTargetsToCache(cachePath, targetsCache);
        }
    },
];
exports.createNodesV2 = exports.createNodes;
async function createNodesInternal(configFilePath, options, context, targetsCache, isTsSolutionSetup) {
    const projectRoot = (0, path_1.dirname)(configFilePath);
    // Do not create a project if package.json and project.json isn't there.
    const siblingFiles = (0, fs_1.readdirSync)((0, path_1.join)(context.workspaceRoot, projectRoot));
    if (!siblingFiles.includes('package.json') &&
        !siblingFiles.includes('project.json')) {
        return {};
    }
    const hash = await (0, calculate_hash_for_create_nodes_1.calculateHashForCreateNodes)(projectRoot, options, context, [(0, js_1.getLockFileName)((0, devkit_1.detectPackageManager)(context.workspaceRoot))]);
    targetsCache[hash] ??= await createWebpackTargets(configFilePath, projectRoot, options, context, isTsSolutionSetup);
    const { targets, metadata } = targetsCache[hash];
    return {
        projects: {
            [projectRoot]: {
                projectType: 'application',
                targets,
                metadata,
            },
        },
    };
}
async function createWebpackTargets(configFilePath, projectRoot, options, context, isTsSolutionSetup) {
    const namedInputs = (0, get_named_inputs_1.getNamedInputs)(projectRoot, context);
    const webpackConfig = (0, resolve_user_defined_webpack_config_1.resolveUserDefinedWebpackConfig)((0, path_1.join)(context.workspaceRoot, configFilePath), (0, js_1.getRootTsConfigPath)(), true);
    const webpackOptions = await (0, read_webpack_options_1.readWebpackOptions)(webpackConfig);
    const outputs = [];
    for (const config of webpackOptions) {
        if (config.output?.path) {
            outputs.push(normalizeOutputPath(config.output.path, projectRoot));
        }
    }
    const targets = {};
    targets[options.buildTargetName] = {
        command: `webpack-cli build`,
        options: { cwd: projectRoot, args: ['--node-env=production'] },
        cache: true,
        dependsOn: [`^${options.buildTargetName}`],
        inputs: 'production' in namedInputs
            ? [
                'production',
                '^production',
                {
                    externalDependencies: ['webpack-cli'],
                },
            ]
            : [
                'default',
                '^default',
                {
                    externalDependencies: ['webpack-cli'],
                },
            ],
        outputs,
        metadata: {
            technologies: ['webpack'],
            description: 'Runs Webpack build',
            help: {
                command: `${pmc.exec} webpack-cli build --help`,
                example: {
                    options: {
                        json: 'stats.json',
                    },
                    args: ['--profile'],
                },
            },
        },
    };
    targets[options.serveTargetName] = {
        continuous: true,
        command: `webpack-cli serve`,
        options: {
            cwd: projectRoot,
            args: ['--node-env=development'],
        },
        metadata: {
            technologies: ['webpack'],
            description: 'Starts Webpack dev server',
            help: {
                command: `${pmc.exec} webpack-cli serve --help`,
                example: {
                    options: {
                        args: ['--client-progress', '--history-api-fallback '],
                    },
                },
            },
        },
    };
    targets[options.previewTargetName] = {
        continuous: true,
        command: `webpack-cli serve`,
        options: {
            cwd: projectRoot,
            args: ['--node-env=production'],
        },
        metadata: {
            technologies: ['webpack'],
            description: 'Starts Webpack dev server in production mode',
            help: {
                command: `${pmc.exec} webpack-cli serve --help`,
                example: {
                    options: {
                        args: ['--client-progress', '--history-api-fallback '],
                    },
                },
            },
        },
    };
    targets[options.serveStaticTargetName] = {
        continuous: true,
        dependsOn: [options.buildTargetName],
        executor: '@nx/web:file-server',
        options: {
            buildTarget: options.buildTargetName,
            spa: true,
        },
    };
    // for `convert-to-inferred` we need to leave the port undefined or the options will not match
    if (webpackConfig.devServer?.port && webpackConfig.devServer?.port !== 4200) {
        targets[options.serveStaticTargetName].options.port =
            webpackConfig.devServer.port;
    }
    if (isTsSolutionSetup) {
        targets[options.buildTargetName].syncGenerators = [
            '@nx/js:typescript-sync',
        ];
        targets[options.serveTargetName].syncGenerators = [
            '@nx/js:typescript-sync',
        ];
        targets[options.previewTargetName].syncGenerators = [
            '@nx/js:typescript-sync',
        ];
        targets[options.serveStaticTargetName].syncGenerators = [
            '@nx/js:typescript-sync',
        ];
    }
    (0, util_1.addBuildAndWatchDepsTargets)(context.workspaceRoot, projectRoot, targets, options, pmc);
    return { targets, metadata: {} };
}
function normalizeOutputPath(outputPath, projectRoot) {
    if (!outputPath) {
        // If outputPath is undefined, use webpack's default `dist` directory.
        if (projectRoot === '.') {
            return `{projectRoot}/dist`;
        }
        else {
            return `{workspaceRoot}/dist/{projectRoot}`;
        }
    }
    else {
        if ((0, path_1.isAbsolute)(outputPath)) {
            /**
             * If outputPath is absolute, we need to resolve it relative to the workspaceRoot first.
             * After that, we can use the relative path to the workspaceRoot token {workspaceRoot} to generate the output path.
             */
            return `{workspaceRoot}/${(0, path_1.relative)(devkit_1.workspaceRoot, (0, path_1.resolve)(devkit_1.workspaceRoot, outputPath))}`;
        }
        else {
            if (outputPath.startsWith('..')) {
                return (0, path_1.join)('{workspaceRoot}', (0, path_1.join)(projectRoot, outputPath));
            }
            else {
                return (0, path_1.join)('{projectRoot}', outputPath);
            }
        }
    }
}
function normalizeOptions(options) {
    return {
        buildTargetName: options?.buildTargetName ?? 'build',
        serveTargetName: options?.serveTargetName ?? 'serve',
        serveStaticTargetName: options?.serveStaticTargetName ?? 'serve-static',
        previewTargetName: options?.previewTargetName ?? 'preview',
        buildDepsTargetName: 'build-deps',
        watchDepsTargetName: 'watch-deps',
    };
}
