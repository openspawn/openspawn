"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodesV2 = exports.createNodes = exports.createDependencies = void 0;
const devkit_1 = require("@nx/devkit");
const calculate_hash_for_create_nodes_1 = require("@nx/devkit/src/utils/calculate-hash-for-create-nodes");
const get_named_inputs_1 = require("@nx/devkit/src/utils/get-named-inputs");
const js_1 = require("@nx/js");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const file_hasher_1 = require("nx/src/hasher/file-hasher");
const cache_directory_1 = require("nx/src/utils/cache-directory");
const plugins_1 = require("nx/src/utils/plugins");
const executor_utils_1 = require("../utils/executor-utils");
const pmc = (0, devkit_1.getPackageManagerCommand)();
function readTargetsCache(cachePath) {
    return process.env.NX_CACHE_PROJECT_GRAPH !== 'false' && (0, node_fs_1.existsSync)(cachePath)
        ? (0, devkit_1.readJsonFile)(cachePath)
        : {};
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
const vitestConfigGlob = '**/{vite,vitest}.config.{js,ts,mjs,mts,cjs,cts}';
exports.createNodes = [
    vitestConfigGlob,
    async (configFilePaths, options, context) => {
        const optionsHash = (0, file_hasher_1.hashObject)(options);
        const normalizedOptions = normalizeOptions(options);
        const cachePath = (0, node_path_1.join)(cache_directory_1.workspaceDataDirectory, `vitest-${optionsHash}.hash`);
        const targetsCache = readTargetsCache(cachePath);
        const { roots: projectRoots, configFiles: validConfigFiles } = configFilePaths.reduce((acc, configFile) => {
            const potentialRoot = (0, node_path_1.dirname)(configFile);
            if (checkIfConfigFileShouldBeProject(potentialRoot, context)) {
                acc.roots.push(potentialRoot);
                acc.configFiles.push(configFile);
            }
            return acc;
        }, {
            roots: [],
            configFiles: [],
        });
        const lockfile = (0, js_1.getLockFileName)((0, devkit_1.detectPackageManager)(context.workspaceRoot));
        const hashes = await (0, calculate_hash_for_create_nodes_1.calculateHashesForCreateNodes)(projectRoots, normalizedOptions, context, projectRoots.map((r) => [lockfile]));
        try {
            return await (0, devkit_1.createNodesFromFiles)(async (configFile, _, context, idx) => {
                const projectRoot = (0, node_path_1.dirname)(configFile);
                // results from vitest.config.js will be different from results of vite.config.js
                // but the hash will be the same because it is based on the files under the project root.
                // Adding the config file path to the hash ensures that the final hash value is different
                // for different config files.
                const hash = hashes[idx] + configFile;
                const { projectType, metadata, targets } = (targetsCache[hash] ??=
                    await buildVitestTargets(configFile, projectRoot, normalizedOptions, context));
                const project = {
                    root: projectRoot,
                    targets,
                    metadata,
                    projectType,
                };
                return {
                    projects: {
                        [projectRoot]: project,
                    },
                };
            }, validConfigFiles, options, context);
        }
        finally {
            writeTargetsToCache(cachePath, targetsCache);
        }
    },
];
exports.createNodesV2 = exports.createNodes;
async function buildVitestTargets(configFilePath, projectRoot, options, context) {
    const absoluteConfigFilePath = (0, devkit_1.joinPathFragments)(context.workspaceRoot, configFilePath);
    // Workaround for the `build$3 is not a function` error that we sometimes see in agents.
    // This should be removed later once we address the issue properly
    try {
        const importEsbuild = () => new Function('return import("esbuild")')();
        await importEsbuild();
    }
    catch {
        // do nothing
    }
    // Workaround for race condition with ESM-only Vite plugins (e.g. @vitejs/plugin-vue@6+)
    // If vite.config.ts is compiled as CJS, then when both require('@vitejs/plugin-vue') and import('@vitejs/plugin-vue')
    // are pending in the same process, Node will throw an error:
    // Error [ERR_INTERNAL_ASSERTION]: Cannot require() ES Module @vitejs/plugin-vue/dist/index.js because it is not yet fully loaded.
    // This may be caused by a race condition if the module is simultaneously dynamically import()-ed via Promise.all().
    try {
        const importVuePlugin = () => new Function('return import("@vitejs/plugin-vue")')();
        await importVuePlugin();
    }
    catch {
        // Plugin not installed or not needed, ignore
    }
    // Workaround for race condition with vitest/node on Node 24+
    // When multiple vitest.config files are processed in parallel, Node can throw:
    // Error [ERR_INTERNAL_ASSERTION]: Cannot require() ES Module vitest/dist/node.js
    // because it is not yet fully loaded.
    // See: https://github.com/nrwl/nx/issues/34028
    try {
        const importVitestNode = () => new Function('return import("vitest/node")')();
        await importVitestNode();
    }
    catch {
        // vitest/node not available or not needed, ignore
    }
    const { resolveConfig } = await (0, executor_utils_1.loadViteDynamicImport)();
    const viteBuildConfig = await resolveConfig({
        configFile: absoluteConfigFilePath,
        mode: 'development',
    }, 'build');
    // If this is a root workspace config file with projects property, don't infer targets.
    // The root config is just an orchestrator - the actual tests live in the individual project configs.
    const isWorkspaceRoot = projectRoot === '.';
    const hasProjectsProperty = Array.isArray(viteBuildConfig?.test?.projects);
    if (isWorkspaceRoot && hasProjectsProperty) {
        return { targets: {}, metadata: {}, projectType: 'library' };
    }
    let metadata = {};
    const { testOutputs, hasTest } = getOutputs(viteBuildConfig, projectRoot, context.workspaceRoot);
    const namedInputs = (0, get_named_inputs_1.getNamedInputs)(projectRoot, context);
    const targets = {};
    // if file is vitest.config or vite.config has definition for test, create targets for test and/or atomized tests
    if (configFilePath.includes('vitest.config') || hasTest) {
        targets[options.testTargetName] = await testTarget(namedInputs, testOutputs, projectRoot, options.testMode);
        if (options.ciTargetName) {
            const groupName = options.ciGroupName ?? (0, plugins_1.deriveGroupNameFromTarget)(options.ciTargetName);
            const targetGroup = [];
            const dependsOn = [];
            metadata = {
                targetGroups: {
                    [groupName]: targetGroup,
                },
            };
            const projectRootRelativeTestPaths = await getTestPathsRelativeToProjectRoot(projectRoot, context.workspaceRoot);
            for (const relativePath of projectRootRelativeTestPaths) {
                if (relativePath.includes('../')) {
                    throw new Error('@nx/vitest attempted to run tests outside of the project root. This is not supported and should not happen. Please open an issue at https://github.com/nrwl/nx/issues/new/choose with the following information:\n\n' +
                        `\n\n${JSON.stringify({
                            projectRoot,
                            relativePath,
                            projectRootRelativeTestPaths,
                            context,
                        }, null, 2)}`);
                }
                const targetName = `${options.ciTargetName}--${relativePath}`;
                dependsOn.push(targetName);
                targets[targetName] = {
                    // It does not make sense to run atomized tests in watch mode as they are intended to be run in CI
                    command: `vitest run ${relativePath}`,
                    cache: targets[options.testTargetName].cache,
                    inputs: targets[options.testTargetName].inputs,
                    outputs: targets[options.testTargetName].outputs,
                    options: {
                        cwd: projectRoot,
                        env: targets[options.testTargetName].options.env,
                    },
                    metadata: {
                        technologies: ['vitest'],
                        description: `Run Vitest Tests in ${relativePath}`,
                        help: {
                            command: `${pmc.exec} vitest --help`,
                            example: {
                                options: {
                                    coverage: true,
                                },
                            },
                        },
                    },
                };
                targetGroup.push(targetName);
            }
            if (targetGroup.length > 0) {
                targets[options.ciTargetName] = {
                    executor: 'nx:noop',
                    cache: true,
                    inputs: targets[options.testTargetName].inputs,
                    outputs: targets[options.testTargetName].outputs,
                    dependsOn,
                    metadata: {
                        technologies: ['vitest'],
                        description: 'Run Vitest Tests in CI',
                        nonAtomizedTarget: options.testTargetName,
                        help: {
                            command: `${pmc.exec} vitest --help`,
                            example: {
                                options: {
                                    coverage: true,
                                },
                            },
                        },
                    },
                };
                targetGroup.unshift(options.ciTargetName);
            }
        }
    }
    return { targets, metadata, projectType: 'library' };
}
async function testTarget(namedInputs, outputs, projectRoot, testMode = 'watch') {
    const command = testMode === 'run' ? 'vitest run' : 'vitest';
    return {
        command,
        options: { cwd: (0, devkit_1.joinPathFragments)(projectRoot) },
        cache: true,
        inputs: [
            ...('production' in namedInputs
                ? ['default', '^production']
                : ['default', '^default']),
            {
                externalDependencies: ['vitest'],
            },
            { env: 'CI' },
        ],
        outputs,
        metadata: {
            technologies: ['vitest'],
            description: `Run Vitest tests`,
            help: {
                command: `${pmc.exec} vitest --help`,
                example: {
                    options: {
                        bail: 1,
                        coverage: true,
                    },
                },
            },
        },
    };
}
function getOutputs(viteBuildConfig, projectRoot, workspaceRoot) {
    const { test } = viteBuildConfig;
    const reportsDirectoryPath = normalizeOutputPath(test?.coverage?.reportsDirectory, projectRoot, workspaceRoot, 'coverage');
    return {
        testOutputs: [reportsDirectoryPath],
        hasTest: !!test,
    };
}
function normalizeOutputPath(outputPath, projectRoot, workspaceRoot, path) {
    if (!outputPath) {
        if (projectRoot === '.') {
            return `{projectRoot}/${path}`;
        }
        else {
            return `{workspaceRoot}/${path}/{projectRoot}`;
        }
    }
    else {
        if ((0, node_path_1.isAbsolute)(outputPath)) {
            return `{workspaceRoot}/${(0, node_path_1.relative)(workspaceRoot, outputPath)}`;
        }
        else {
            if (outputPath.startsWith('..')) {
                return (0, node_path_1.join)('{workspaceRoot}', (0, node_path_1.join)(projectRoot, outputPath));
            }
            else {
                return (0, node_path_1.join)('{projectRoot}', outputPath);
            }
        }
    }
}
function normalizeOptions(options) {
    options ??= {};
    options.testTargetName ??= 'test';
    options.testMode ??= 'watch';
    return options;
}
function checkIfConfigFileShouldBeProject(projectRoot, context) {
    // Do not create a project if package.json and project.json isn't there.
    const siblingFiles = (0, node_fs_1.readdirSync)((0, node_path_1.join)(context.workspaceRoot, projectRoot));
    if (!siblingFiles.includes('package.json') &&
        !siblingFiles.includes('project.json')) {
        return false;
    }
    return true;
}
async function getTestPathsRelativeToProjectRoot(projectRoot, workspaceRoot) {
    const fullProjectRoot = (0, node_path_1.join)(workspaceRoot, projectRoot);
    const { createVitest } = await Promise.resolve().then(() => require('vitest/node'));
    const vitest = await createVitest('test', {
        root: fullProjectRoot,
        dir: fullProjectRoot,
        filesOnly: true,
        watch: false,
    });
    const relevantTestSpecifications = await vitest.getRelevantTestSpecifications();
    return relevantTestSpecifications
        .filter((ts) => fullProjectRoot === '.' ? true : ts.moduleId.startsWith(fullProjectRoot))
        .map((ts) => (0, node_path_1.relative)(projectRoot, ts.moduleId));
}
