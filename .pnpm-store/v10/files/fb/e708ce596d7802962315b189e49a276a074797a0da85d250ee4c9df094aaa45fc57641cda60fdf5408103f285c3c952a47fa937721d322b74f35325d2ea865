"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodesV2 = exports.createNodes = void 0;
const devkit_1 = require("@nx/devkit");
const calculate_hash_for_create_nodes_1 = require("@nx/devkit/src/utils/calculate-hash-for-create-nodes");
const config_utils_1 = require("@nx/devkit/src/utils/config-utils");
const get_named_inputs_1 = require("@nx/devkit/src/utils/get-named-inputs");
const minimatch_1 = require("minimatch");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const devkit_internals_1 = require("nx/src/devkit-internals");
const package_json_1 = require("nx/src/plugins/package-json");
const cache_directory_1 = require("nx/src/utils/cache-directory");
const globs_1 = require("nx/src/utils/globs");
const installation_directory_1 = require("nx/src/utils/installation-directory");
const plugins_1 = require("nx/src/utils/plugins");
const workspace_context_1 = require("nx/src/utils/workspace-context");
const versions_1 = require("../utils/versions");
const pmc = (0, devkit_1.getPackageManagerCommand)();
function readTargetsCache(cachePath) {
    return process.env.NX_CACHE_PROJECT_GRAPH !== 'false' && (0, node_fs_1.existsSync)(cachePath)
        ? (0, devkit_1.readJsonFile)(cachePath)
        : {};
}
function writeTargetsToCache(cachePath, results) {
    (0, devkit_1.writeJsonFile)(cachePath, results);
}
const jestConfigGlob = '**/jest.config.{cjs,mjs,js,cts,mts,ts}';
exports.createNodes = [
    jestConfigGlob,
    async (configFiles, options, context) => {
        const optionsHash = (0, devkit_internals_1.hashObject)(options);
        const cachePath = (0, node_path_1.join)(cache_directory_1.workspaceDataDirectory, `jest-${optionsHash}.hash`);
        const targetsCache = readTargetsCache(cachePath);
        // Cache jest preset(s) to avoid penalties of module load times. Most of jest configs will use the same preset.
        const presetCache = {};
        const isInPackageManagerWorkspaces = buildPackageJsonWorkspacesMatcher(context.workspaceRoot);
        options = normalizeOptions(options);
        const { roots: projectRoots, configFiles: validConfigFiles } = configFiles.reduce((acc, configFile) => {
            const potentialRoot = (0, node_path_1.dirname)(configFile);
            if (checkIfConfigFileShouldBeProject(configFile, potentialRoot, isInPackageManagerWorkspaces, context)) {
                acc.roots.push(potentialRoot);
                acc.configFiles.push(configFile);
            }
            return acc;
        }, {
            roots: [],
            configFiles: [],
        });
        const hashes = await (0, calculate_hash_for_create_nodes_1.calculateHashesForCreateNodes)(projectRoots, options, context);
        try {
            return await (0, devkit_1.createNodesFromFiles)(async (configFilePath, options, context, idx) => {
                const projectRoot = projectRoots[idx];
                const hash = hashes[idx];
                targetsCache[hash] ??= await buildJestTargets(configFilePath, projectRoot, options, context, presetCache);
                const { targets, metadata } = targetsCache[hash];
                return {
                    projects: {
                        [projectRoot]: {
                            root: projectRoot,
                            targets,
                            metadata,
                        },
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
function buildPackageJsonWorkspacesMatcher(workspaceRoot) {
    if (process.env.NX_INFER_ALL_PACKAGE_JSONS === 'true') {
        return () => true;
    }
    const packageManagerWorkspacesGlob = (0, globs_1.combineGlobPatterns)((0, package_json_1.getGlobPatternsFromPackageManagerWorkspaces)(workspaceRoot));
    return (path) => (0, minimatch_1.minimatch)(path, packageManagerWorkspacesGlob);
}
function checkIfConfigFileShouldBeProject(configFilePath, projectRoot, isInPackageManagerWorkspaces, context) {
    // Do not create a project if package.json and project.json isn't there.
    const siblingFiles = (0, node_fs_1.readdirSync)((0, node_path_1.join)(context.workspaceRoot, projectRoot));
    if (!siblingFiles.includes('package.json') &&
        !siblingFiles.includes('project.json')) {
        return false;
    }
    else if (!siblingFiles.includes('project.json') &&
        siblingFiles.includes('package.json')) {
        const path = (0, devkit_1.joinPathFragments)(projectRoot, 'package.json');
        const isPackageJsonProject = isInPackageManagerWorkspaces(path);
        if (!isPackageJsonProject) {
            return false;
        }
    }
    const jestConfigContent = (0, node_fs_1.readFileSync)((0, node_path_1.resolve)(context.workspaceRoot, configFilePath), 'utf-8');
    if (jestConfigContent.includes('getJestProjectsAsync()')) {
        // The `getJestProjectsAsync` function uses the project graph, which leads to a
        // circular dependency. We can skip this since it's no intended to be used for
        // an Nx project.
        return false;
    }
    return true;
}
async function buildJestTargets(configFilePath, projectRoot, options, context, presetCache) {
    const absConfigFilePath = (0, node_path_1.resolve)(context.workspaceRoot, configFilePath);
    if (require.cache[absConfigFilePath])
        (0, config_utils_1.clearRequireCache)();
    const rawConfig = await (0, config_utils_1.loadConfigFile)(absConfigFilePath, 
    // lookup for the same files we look for in the resolver and fall back to tsconfig.json
    [
        'tsconfig.spec.json',
        'tsconfig.test.json',
        'tsconfig.jest.json',
        'tsconfig.json',
    ]);
    const targets = {};
    const namedInputs = (0, get_named_inputs_1.getNamedInputs)(projectRoot, context);
    const tsNodeCompilerOptions = JSON.stringify({
        moduleResolution: 'node10',
        module: 'commonjs',
        customConditions: null,
    });
    const env = {
        TS_NODE_COMPILER_OPTIONS: tsNodeCompilerOptions,
    };
    const target = (targets[options.targetName] = {
        command: 'jest',
        options: {
            cwd: projectRoot,
            // Jest registers ts-node with module CJS https://github.com/SimenB/jest/blob/v29.6.4/packages/jest-config/src/readConfigFileAndSetRootDir.ts#L117-L119
            // We want to support of ESM via 'module':'nodenext', we need to override the resolution until Jest supports it.
            env,
        },
        metadata: {
            technologies: ['jest'],
            description: 'Run Jest Tests',
            help: {
                command: `${pmc.exec} jest --help`,
                example: {
                    options: {
                        coverage: true,
                    },
                },
            },
        },
    });
    // Not normalizing it here since also affects options for convert-to-inferred.
    const disableJestRuntime = options.disableJestRuntime !== false;
    const cache = (target.cache = true);
    const inputs = (target.inputs = getInputs(namedInputs, rawConfig.preset, projectRoot, context.workspaceRoot, disableJestRuntime));
    let metadata;
    const groupName = options?.ciGroupName ?? (0, plugins_1.deriveGroupNameFromTarget)(options?.ciTargetName);
    if (disableJestRuntime) {
        const outputs = (target.outputs = getOutputs(projectRoot, rawConfig.coverageDirectory
            ? (0, node_path_1.join)(context.workspaceRoot, projectRoot, rawConfig.coverageDirectory)
            : undefined, undefined, context));
        if (options?.ciTargetName) {
            const { specs, testMatch } = await getTestPaths(projectRoot, rawConfig, absConfigFilePath, context, presetCache);
            const targetGroup = [];
            const dependsOn = [];
            metadata = {
                targetGroups: {
                    [groupName]: targetGroup,
                },
            };
            const specIgnoreRegexes = rawConfig.testPathIgnorePatterns?.map((p) => new RegExp(replaceRootDirInPath(projectRoot, p)));
            for (const testPath of specs) {
                const relativePath = (0, devkit_1.normalizePath)((0, node_path_1.relative)((0, node_path_1.join)(context.workspaceRoot, projectRoot), testPath));
                if (relativePath.includes('../')) {
                    throw new Error('@nx/jest/plugin attempted to run tests outside of the project root. This is not supported and should not happen. Please open an issue at https://github.com/nrwl/nx/issues/new/choose with the following information:\n\n' +
                        `\n\n${JSON.stringify({
                            projectRoot,
                            relativePath,
                            specs,
                            context,
                            testMatch,
                        }, null, 2)}`);
                }
                if (specIgnoreRegexes?.some((regex) => regex.test(relativePath))) {
                    continue;
                }
                const targetName = `${options.ciTargetName}--${relativePath}`;
                dependsOn.push({
                    target: targetName,
                    projects: 'self',
                    params: 'forward',
                    options: 'forward',
                });
                targets[targetName] = {
                    command: `jest ${relativePath}`,
                    cache,
                    inputs,
                    outputs,
                    options: {
                        cwd: projectRoot,
                        env,
                    },
                    metadata: {
                        technologies: ['jest'],
                        description: `Run Jest Tests in ${relativePath}`,
                        help: {
                            command: `${pmc.exec} jest --help`,
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
                    inputs,
                    outputs,
                    dependsOn,
                    metadata: {
                        technologies: ['jest'],
                        description: 'Run Jest Tests in CI',
                        nonAtomizedTarget: options.targetName,
                        help: {
                            command: `${pmc.exec} jest --help`,
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
    else {
        const { readConfig } = requireJestUtil('jest-config', projectRoot, context.workspaceRoot);
        let config;
        try {
            config = await readConfig({
                _: [],
                $0: undefined,
            }, rawConfig, undefined, (0, node_path_1.dirname)(absConfigFilePath));
        }
        catch (e) {
            console.error(e);
            throw e;
        }
        const outputs = (target.outputs = getOutputs(projectRoot, config.globalConfig?.coverageDirectory, config.globalConfig?.outputFile, context));
        if (options?.ciTargetName) {
            // nx-ignore-next-line
            const { default: Runtime } = requireJestUtil('jest-runtime', projectRoot, context.workspaceRoot);
            const jestContext = await Runtime.createContext(config.projectConfig, {
                maxWorkers: 1,
                watchman: false,
            });
            const jest = require(resolveJestPath(projectRoot, context.workspaceRoot));
            const source = new jest.SearchSource(jestContext);
            const jestVersion = (0, versions_1.getInstalledJestMajorVersion)();
            const specs = jestVersion >= 30
                ? await source.getTestPaths(config.globalConfig, config.projectConfig)
                : // @ts-expect-error Jest v29 doesn't have the projectConfig parameter
                    await source.getTestPaths(config.globalConfig);
            const testPaths = new Set(specs.tests.map(({ path }) => path));
            if (testPaths.size > 0) {
                const targetGroup = [];
                metadata = {
                    targetGroups: {
                        [groupName]: targetGroup,
                    },
                };
                const dependsOn = [];
                for (const testPath of testPaths) {
                    const relativePath = (0, devkit_1.normalizePath)((0, node_path_1.relative)((0, node_path_1.join)(context.workspaceRoot, projectRoot), testPath));
                    if (relativePath.includes('../')) {
                        throw new Error('@nx/jest/plugin attempted to run tests outside of the project root. This is not supported and should not happen. Please open an issue at https://github.com/nrwl/nx/issues/new/choose with the following information:\n\n' +
                            `\n\n${JSON.stringify({
                                projectRoot,
                                relativePath,
                                testPaths,
                                context,
                            }, null, 2)}`);
                    }
                    const targetName = `${options.ciTargetName}--${relativePath}`;
                    dependsOn.push({
                        target: targetName,
                        projects: 'self',
                        params: 'forward',
                        options: 'forward',
                    });
                    targets[targetName] = {
                        command: `jest ${relativePath}`,
                        cache,
                        inputs,
                        outputs,
                        options: {
                            cwd: projectRoot,
                            env,
                        },
                        metadata: {
                            technologies: ['jest'],
                            description: `Run Jest Tests in ${relativePath}`,
                            help: {
                                command: `${pmc.exec} jest --help`,
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
                targets[options.ciTargetName] = {
                    executor: 'nx:noop',
                    cache: true,
                    inputs,
                    outputs,
                    dependsOn,
                    metadata: {
                        technologies: ['jest'],
                        description: 'Run Jest Tests in CI',
                        nonAtomizedTarget: options.targetName,
                        help: {
                            command: `${pmc.exec} jest --help`,
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
    return { targets, metadata };
}
function getInputs(namedInputs, preset, projectRoot, workspaceRoot, disableJestRuntime) {
    const inputs = [
        ...('production' in namedInputs
            ? ['default', '^production']
            : ['default', '^default']),
    ];
    const externalDependencies = ['jest'];
    const presetInput = disableJestRuntime
        ? resolvePresetInputWithoutJestResolver(preset, projectRoot, workspaceRoot)
        : resolvePresetInputWithJestResolver(preset, projectRoot, workspaceRoot);
    if (presetInput) {
        if (typeof presetInput !== 'string' &&
            'externalDependencies' in presetInput) {
            externalDependencies.push(...presetInput.externalDependencies);
        }
        else {
            inputs.push(presetInput);
        }
    }
    inputs.push({ externalDependencies });
    return inputs;
}
function resolvePresetInputWithoutJestResolver(presetValue, projectRoot, workspaceRoot) {
    if (!presetValue)
        return null;
    const presetPath = replaceRootDirInPath(projectRoot, presetValue);
    const isNpmPackage = !presetValue.startsWith('.') && !(0, node_path_1.isAbsolute)(presetPath);
    if (isNpmPackage) {
        return { externalDependencies: [presetValue] };
    }
    if (presetPath.startsWith('..')) {
        const relativePath = (0, node_path_1.relative)(workspaceRoot, (0, node_path_1.join)(projectRoot, presetPath));
        return (0, node_path_1.join)('{workspaceRoot}', relativePath);
    }
    else {
        const relativePath = (0, node_path_1.relative)(projectRoot, presetPath);
        return (0, node_path_1.join)('{projectRoot}', relativePath);
    }
}
// preset resolution adapted from:
// https://github.com/jestjs/jest/blob/c54bccd657fb4cf060898717c09f633b4da3eec4/packages/jest-config/src/normalize.ts#L122
function resolvePresetInputWithJestResolver(presetValue, projectRoot, workspaceRoot) {
    if (!presetValue)
        return null;
    let presetPath = replaceRootDirInPath(projectRoot, presetValue);
    const isNpmPackage = !presetValue.startsWith('.') && !(0, node_path_1.isAbsolute)(presetPath);
    presetPath = presetPath.startsWith('.')
        ? presetPath
        : (0, node_path_1.join)(presetPath, 'jest-preset');
    const { default: jestResolve } = requireJestUtil('jest-resolve', projectRoot, workspaceRoot);
    const absoluteProjectRoot = (0, node_path_1.join)(workspaceRoot, projectRoot);
    const presetModule = jestResolve.findNodeModule(presetPath, {
        basedir: absoluteProjectRoot,
        extensions: ['.json', '.js', '.cjs', '.mjs'],
    });
    if (!presetModule) {
        return null;
    }
    if (isNpmPackage) {
        return { externalDependencies: [presetValue] };
    }
    const relativePath = (0, node_path_1.relative)(absoluteProjectRoot, presetModule);
    return relativePath.startsWith('..')
        ? (0, node_path_1.join)('{workspaceRoot}', (0, node_path_1.join)(projectRoot, relativePath))
        : (0, node_path_1.join)('{projectRoot}', relativePath);
}
// Adapted from here https://github.com/jestjs/jest/blob/c13bca3/packages/jest-config/src/utils.ts#L57-L69
function replaceRootDirInPath(rootDir, filePath) {
    if (!filePath.startsWith('<rootDir>')) {
        return filePath;
    }
    return (0, node_path_1.resolve)(rootDir, (0, node_path_1.normalize)(`./${filePath.slice('<rootDir>'.length)}`));
}
function getOutputs(projectRoot, coverageDirectory, outputFile, context) {
    function getOutput(path) {
        const relativePath = (0, node_path_1.relative)((0, node_path_1.join)(context.workspaceRoot, projectRoot), path);
        if (relativePath.startsWith('..')) {
            return (0, node_path_1.join)('{workspaceRoot}', (0, node_path_1.join)(projectRoot, relativePath));
        }
        else {
            return (0, node_path_1.join)('{projectRoot}', relativePath);
        }
    }
    const outputs = [];
    for (const outputOption of [coverageDirectory, outputFile]) {
        if (outputOption) {
            outputs.push(getOutput(outputOption));
        }
    }
    return outputs;
}
function normalizeOptions(options) {
    options ??= {};
    options.targetName ??= 'test';
    return options;
}
let resolvedJestPaths;
function resolveJestPath(projectRoot, workspaceRoot) {
    resolvedJestPaths ??= {};
    if (resolvedJestPaths[projectRoot]) {
        return resolvedJestPaths[projectRoot];
    }
    resolvedJestPaths[projectRoot] = require.resolve('jest', {
        paths: [projectRoot, ...(0, installation_directory_1.getNxRequirePaths)(workspaceRoot), __dirname],
    });
    return resolvedJestPaths[projectRoot];
}
let resolvedJestCorePaths;
/**
 * Resolves a jest util package version that `jest` is using.
 */
function requireJestUtil(packageName, projectRoot, workspaceRoot) {
    const jestPath = resolveJestPath(projectRoot, workspaceRoot);
    resolvedJestCorePaths ??= {};
    if (!resolvedJestCorePaths[jestPath]) {
        // nx-ignore-next-line
        resolvedJestCorePaths[jestPath] = require.resolve('@jest/core', {
            paths: [(0, node_path_1.dirname)(jestPath)],
        });
    }
    return require(require.resolve(packageName, {
        paths: [(0, node_path_1.dirname)(resolvedJestCorePaths[jestPath])],
    }));
}
async function getTestPaths(projectRoot, rawConfig, absConfigFilePath, context, presetCache) {
    const testMatch = await getJestOption(rawConfig, absConfigFilePath, 'testMatch', presetCache);
    let paths = await (0, workspace_context_1.globWithWorkspaceContext)(context.workspaceRoot, (testMatch || [
        // Default copied from https://github.com/jestjs/jest/blob/d1a2ed7/packages/jest-config/src/Defaults.ts#L84
        '**/__tests__/**/*.?([mc])[jt]s?(x)',
        '**/?(*.)+(spec|test).?([mc])[jt]s?(x)',
    ]).map((pattern) => (0, node_path_1.join)(projectRoot, pattern)), []);
    const testRegex = await getJestOption(rawConfig, absConfigFilePath, 'testRegex', presetCache);
    if (testRegex) {
        const testRegexes = Array.isArray(rawConfig.testRegex)
            ? rawConfig.testRegex.map((r) => new RegExp(r))
            : [new RegExp(rawConfig.testRegex)];
        paths = paths.filter((path) => testRegexes.some((r) => r.test(path)));
    }
    return { specs: paths, testMatch };
}
async function getJestOption(rawConfig, absConfigFilePath, optionName, presetCache) {
    if (rawConfig[optionName])
        return rawConfig[optionName];
    if (rawConfig.preset) {
        const dir = (0, node_path_1.dirname)(absConfigFilePath);
        const presetPath = (0, node_path_1.resolve)(dir, rawConfig.preset);
        try {
            let preset = presetCache[presetPath];
            if (!preset) {
                preset = await (0, config_utils_1.loadConfigFile)(presetPath);
                presetCache[presetPath] = preset;
            }
            if (preset[optionName])
                return preset[optionName];
        }
        catch {
            // If preset fails to load, ignore the error and continue.
            // This is safe and less jarring for users. They will need to fix the
            // preset for Jest to run, and at that point we can read in the correct
            // value.
        }
    }
    return undefined;
}
