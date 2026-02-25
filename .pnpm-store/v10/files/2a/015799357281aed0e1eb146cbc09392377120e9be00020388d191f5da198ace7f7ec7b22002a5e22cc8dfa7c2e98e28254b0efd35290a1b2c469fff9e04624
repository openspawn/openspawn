"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodesV2 = exports.createNodes = void 0;
const devkit_1 = require("@nx/devkit");
const calculate_hash_for_create_nodes_1 = require("@nx/devkit/src/utils/calculate-hash-for-create-nodes");
const js_1 = require("@nx/js");
const node_fs_1 = require("node:fs");
const posix_1 = require("node:path/posix");
const file_hasher_1 = require("nx/src/hasher/file-hasher");
const cache_directory_1 = require("nx/src/utils/cache-directory");
const globs_1 = require("nx/src/utils/globs");
const workspace_context_1 = require("nx/src/utils/workspace-context");
const semver_1 = require("semver");
const config_file_1 = require("../utils/config-file");
const resolve_eslint_class_1 = require("../utils/resolve-eslint-class");
const pmc = (0, devkit_1.getPackageManagerCommand)();
const DEFAULT_EXTENSIONS = [
    'ts',
    'cts',
    'mts',
    'tsx',
    'js',
    'cjs',
    'mjs',
    'jsx',
    'html',
    'vue',
];
const PROJECT_CONFIG_FILENAMES = ['project.json', 'package.json'];
const ESLINT_CONFIG_GLOB_V2 = (0, globs_1.combineGlobPatterns)([
    ...config_file_1.ESLINT_CONFIG_FILENAMES.map((f) => `**/${f}`),
    ...PROJECT_CONFIG_FILENAMES.map((f) => `**/${f}`),
]);
function readTargetsCache(cachePath) {
    return process.env.NX_CACHE_PROJECT_GRAPH !== 'false' && (0, node_fs_1.existsSync)(cachePath)
        ? (0, devkit_1.readJsonFile)(cachePath)
        : {};
}
function writeTargetsToCache(cachePath, results) {
    (0, devkit_1.writeJsonFile)(cachePath, results);
}
const internalCreateNodesV2 = async (ESLint, configFilePath, options, context, projectRootsByEslintRoots, lintableFilesPerProjectRoot, projectsCache, hashByRoot) => {
    const configDir = (0, posix_1.dirname)(configFilePath);
    const eslintVersion = ESLint.version;
    const projects = {};
    await Promise.all(projectRootsByEslintRoots.get(configDir).map(async (projectRoot) => {
        const hash = hashByRoot.get(projectRoot);
        if (projectsCache[hash]) {
            // We can reuse the projects in the cache.
            Object.assign(projects, projectsCache[hash]);
            return;
        }
        let hasNonIgnoredLintableFiles = false;
        if (configDir !== projectRoot || projectRoot === '.') {
            const eslint = new ESLint({
                cwd: (0, posix_1.join)(context.workspaceRoot, projectRoot),
            });
            for (const file of lintableFilesPerProjectRoot.get(projectRoot) ?? []) {
                if (!(await eslint.isPathIgnored((0, posix_1.join)(context.workspaceRoot, file)))) {
                    hasNonIgnoredLintableFiles = true;
                    break;
                }
            }
        }
        else {
            hasNonIgnoredLintableFiles = true;
        }
        if (!hasNonIgnoredLintableFiles) {
            // No lintable files in the project, store in the cache and skip further processing
            projectsCache[hash] = {};
            return;
        }
        const project = getProjectUsingESLintConfig(configFilePath, projectRoot, eslintVersion, options, context);
        if (project) {
            projects[projectRoot] = project;
            // Store project into the cache
            projectsCache[hash] = { [projectRoot]: project };
        }
        else {
            // No project found, store in the cache
            projectsCache[hash] = {};
        }
    }));
    return {
        projects,
    };
};
exports.createNodes = [
    ESLINT_CONFIG_GLOB_V2,
    async (configFiles, options, context) => {
        options = normalizeOptions(options);
        const optionsHash = (0, file_hasher_1.hashObject)(options);
        const cachePath = (0, posix_1.join)(cache_directory_1.workspaceDataDirectory, `eslint-${optionsHash}.hash`);
        const targetsCache = readTargetsCache(cachePath);
        const { eslintConfigFiles, projectRoots, projectRootsByEslintRoots } = splitConfigFiles(configFiles);
        const lintableFilesPerProjectRoot = await collectLintableFilesByProjectRoot(projectRoots, options, context);
        const lockFilePattern = (0, js_1.getLockFileName)((0, devkit_1.detectPackageManager)(context.workspaceRoot));
        const hashes = await (0, calculate_hash_for_create_nodes_1.calculateHashesForCreateNodes)(projectRoots, options, context, projectRoots.map((root) => {
            const parentConfigs = eslintConfigFiles.filter((eslintConfig) => isSubDir(root, (0, posix_1.dirname)(eslintConfig)));
            return [...parentConfigs, (0, posix_1.join)(root, '.eslintignore'), lockFilePattern];
        }));
        const hashByRoot = new Map(projectRoots.map((r, i) => [r, hashes[i]]));
        try {
            if (eslintConfigFiles.length === 0) {
                return [];
            }
            const ESLint = await (0, resolve_eslint_class_1.resolveESLintClass)({
                useFlatConfigOverrideVal: (0, config_file_1.isFlatConfig)(eslintConfigFiles[0]),
            });
            return await (0, devkit_1.createNodesFromFiles)((configFile, options, context) => internalCreateNodesV2(ESLint, configFile, options, context, projectRootsByEslintRoots, lintableFilesPerProjectRoot, targetsCache, hashByRoot), eslintConfigFiles, options, context);
        }
        finally {
            writeTargetsToCache(cachePath, targetsCache);
        }
    },
];
exports.createNodesV2 = exports.createNodes;
function splitConfigFiles(configFiles) {
    const eslintConfigFiles = [];
    const projectRoots = new Set();
    for (const configFile of configFiles) {
        if (PROJECT_CONFIG_FILENAMES.includes((0, posix_1.basename)(configFile))) {
            projectRoots.add((0, posix_1.dirname)(configFile));
        }
        else {
            eslintConfigFiles.push(configFile);
        }
    }
    const uniqueProjectRoots = Array.from(projectRoots);
    const projectRootsByEslintRoots = groupProjectRootsByEslintRoots(eslintConfigFiles, uniqueProjectRoots);
    return {
        eslintConfigFiles,
        projectRoots: uniqueProjectRoots,
        projectRootsByEslintRoots,
    };
}
function groupProjectRootsByEslintRoots(eslintConfigFiles, projectRoots) {
    const projectRootsByEslintRoots = new Map();
    for (const eslintConfig of eslintConfigFiles) {
        projectRootsByEslintRoots.set((0, posix_1.dirname)(eslintConfig), []);
    }
    for (const projectRoot of projectRoots) {
        const eslintRoot = getRootForDirectory(projectRoot, projectRootsByEslintRoots);
        if (eslintRoot) {
            projectRootsByEslintRoots.get(eslintRoot).push(projectRoot);
        }
    }
    return projectRootsByEslintRoots;
}
async function collectLintableFilesByProjectRoot(projectRoots, options, context) {
    const lintableFilesPerProjectRoot = new Map();
    const lintableFiles = await (0, workspace_context_1.globWithWorkspaceContext)(context.workspaceRoot, [
        `**/*.{${options.extensions.join(',')}}`,
    ]);
    for (const projectRoot of projectRoots) {
        lintableFilesPerProjectRoot.set(projectRoot, []);
    }
    for (const file of lintableFiles) {
        const projectRoot = getRootForDirectory((0, posix_1.dirname)(file), lintableFilesPerProjectRoot);
        if (projectRoot) {
            lintableFilesPerProjectRoot.get(projectRoot).push(file);
        }
    }
    return lintableFilesPerProjectRoot;
}
function getRootForDirectory(directory, roots) {
    let currentPath = (0, posix_1.normalize)(directory);
    while (currentPath !== (0, posix_1.dirname)(currentPath)) {
        if (roots.has(currentPath)) {
            return currentPath;
        }
        currentPath = (0, posix_1.dirname)(currentPath);
    }
    return roots.has(currentPath) ? currentPath : null;
}
function getProjectUsingESLintConfig(configFilePath, projectRoot, eslintVersion, options, context) {
    const rootEslintConfig = [
        config_file_1.baseEsLintConfigFile,
        ...config_file_1.BASE_ESLINT_CONFIG_FILENAMES,
        ...config_file_1.ESLINT_CONFIG_FILENAMES,
    ].find((f) => (0, node_fs_1.existsSync)((0, posix_1.join)(context.workspaceRoot, f)));
    // Add a lint target for each child project without an eslint config, with the root level config as an input
    let standaloneSrcPath;
    if (projectRoot === '.' &&
        (0, node_fs_1.existsSync)((0, posix_1.join)(context.workspaceRoot, projectRoot, 'package.json'))) {
        if ((0, node_fs_1.existsSync)((0, posix_1.join)(context.workspaceRoot, projectRoot, 'src'))) {
            standaloneSrcPath = 'src';
        }
        else if ((0, node_fs_1.existsSync)((0, posix_1.join)(context.workspaceRoot, projectRoot, 'lib'))) {
            standaloneSrcPath = 'lib';
        }
    }
    if (projectRoot === '.' && !standaloneSrcPath) {
        return null;
    }
    const eslintConfigs = [configFilePath];
    if (rootEslintConfig && !eslintConfigs.includes(rootEslintConfig)) {
        eslintConfigs.unshift(rootEslintConfig);
    }
    return {
        targets: buildEslintTargets(eslintConfigs, eslintVersion, projectRoot, context.workspaceRoot, options, standaloneSrcPath),
    };
}
function buildEslintTargets(eslintConfigs, eslintVersion, projectRoot, workspaceRoot, options, standaloneSrcPath) {
    const isRootProject = projectRoot === '.';
    const targets = {};
    const targetConfig = {
        command: `eslint ${isRootProject && standaloneSrcPath ? `./${standaloneSrcPath}` : '.'}`,
        cache: true,
        options: {
            cwd: projectRoot,
        },
        inputs: [
            'default',
            // Certain lint rules can be impacted by changes to dependencies
            '^default',
            ...eslintConfigs.map((config) => `{workspaceRoot}/${config}`),
            ...((0, node_fs_1.existsSync)((0, posix_1.join)(workspaceRoot, projectRoot, '.eslintignore'))
                ? [(0, posix_1.join)('{workspaceRoot}', projectRoot, '.eslintignore')]
                : []),
            '{workspaceRoot}/tools/eslint-rules/**/*',
            { externalDependencies: ['eslint'] },
        ],
        outputs: ['{options.outputFile}'],
        metadata: {
            technologies: ['eslint'],
            description: 'Runs ESLint on project',
            help: {
                command: `${pmc.exec} eslint --help`,
                example: {
                    options: {
                        'max-warnings': 0,
                    },
                },
            },
        },
    };
    // Always set the environment variable to ensure that the ESLint CLI can run on eslint v8 and v9
    const useFlatConfig = eslintConfigs.some((config) => (0, config_file_1.isFlatConfig)(config));
    // Flat config is default for 9.0.0+
    const defaultSetting = (0, semver_1.gte)(eslintVersion, '9.0.0');
    if (useFlatConfig !== defaultSetting) {
        targetConfig.options.env = {
            ESLINT_USE_FLAT_CONFIG: useFlatConfig ? 'true' : 'false',
        };
    }
    targets[options.targetName] = targetConfig;
    return targets;
}
function normalizeOptions(options) {
    const normalizedOptions = {
        targetName: options?.targetName ?? 'lint',
    };
    // Normalize user input for extensions (strip leading . characters)
    if (Array.isArray(options?.extensions)) {
        normalizedOptions.extensions = options.extensions.map((f) => f.replace(/^\.+/, ''));
    }
    else {
        normalizedOptions.extensions = DEFAULT_EXTENSIONS;
    }
    return normalizedOptions;
}
/**
 * Determines if `child` is a subdirectory of `parent`. This is a simplified
 * version that takes into account that paths are always relative to the
 * workspace root.
 */
function isSubDir(parent, child) {
    if (parent === '.') {
        return true;
    }
    parent = (0, posix_1.normalize)(parent);
    child = (0, posix_1.normalize)(child);
    if (!parent.endsWith(posix_1.sep)) {
        parent += posix_1.sep;
    }
    return child.startsWith(parent);
}
