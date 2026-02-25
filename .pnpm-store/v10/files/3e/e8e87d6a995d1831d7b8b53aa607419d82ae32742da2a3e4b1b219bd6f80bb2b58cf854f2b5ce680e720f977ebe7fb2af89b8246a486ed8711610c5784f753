"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceRules = void 0;
exports.loadWorkspaceRules = loadWorkspaceRules;
const devkit_1 = require("@nx/devkit");
const config_utils_1 = require("@nx/devkit/src/utils/config-utils");
const internal_1 = require("@nx/js/src/internal");
const fs_1 = require("fs");
const path_1 = require("path");
const constants_1 = require("./constants");
// ESM import() cannot resolve directories to index files like require() can
const INDEX_FILE_EXTENSIONS = [
    '.ts',
    '.mts',
    '.cts',
    '.js',
    '.mjs',
    '.cjs',
];
function resolveDirectoryEntryFile(directory) {
    for (const ext of INDEX_FILE_EXTENSIONS) {
        const candidatePath = (0, path_1.join)(directory, `index${ext}`);
        if ((0, fs_1.existsSync)(candidatePath)) {
            return candidatePath;
        }
    }
    throw new Error(`No index file found in directory: ${directory}. ` +
        `Expected one of: ${INDEX_FILE_EXTENSIONS.map((ext) => `index${ext}`).join(', ')}`);
}
function normalizePath(path) {
    return `${(0, path_1.normalize)(path).replace(/[\/\\]$/g, '')}${path_1.sep}`;
}
function findTsConfig(directory, tsConfigPath) {
    let effectiveTsConfigPath = tsConfigPath;
    const normalizedWorkspaceRoot = normalizePath(devkit_1.workspaceRoot);
    if (effectiveTsConfigPath) {
        if (!(0, path_1.isAbsolute)(effectiveTsConfigPath)) {
            effectiveTsConfigPath = (0, path_1.resolve)(devkit_1.workspaceRoot, effectiveTsConfigPath);
        }
        if (!effectiveTsConfigPath.startsWith(normalizedWorkspaceRoot)) {
            console.warn(`TypeScript config "${effectiveTsConfigPath}" is outside the workspace root "${devkit_1.workspaceRoot}". Falling back to automatic tsconfig detection.`);
            effectiveTsConfigPath = undefined;
        }
    }
    if (!effectiveTsConfigPath) {
        let currentDir = directory;
        while (currentDir.startsWith(normalizedWorkspaceRoot)) {
            const candidatePath = (0, path_1.join)(currentDir, 'tsconfig.json');
            if ((0, fs_1.existsSync)(candidatePath)) {
                effectiveTsConfigPath = candidatePath;
                break;
            }
            const parentDir = (0, path_1.dirname)(currentDir);
            if (normalizePath(parentDir) === normalizedWorkspaceRoot) {
                break;
            }
            currentDir = parentDir;
        }
    }
    if (!tsConfigPath && !effectiveTsConfigPath) {
        console.warn(`No TypeScript config found. Crawled up to workspace root "${devkit_1.workspaceRoot}" ` +
            `from directory "${directory}" without finding a tsconfig.json file. Provide ` +
            `a tsconfig.json file path to the loadWorkspaceRules function.`);
    }
    return effectiveTsConfigPath;
}
/**
 * Load ESLint rules from a directory.
 *
 * This utility allows loading custom ESLint rules from any directory within the workspace,
 * not just the default `tools/eslint-rules` location. It's useful for:
 * - Loading rules from a custom directory structure
 * - Loading rules from npm workspace packages (e.g., linked packages via npm/yarn/pnpm workspaces)
 * - Loading rules from multiple directories with different configurations
 *
 * The directory must contain an index file (index.ts, index.js, etc.) that exports the rules.
 *
 * @param directory - The directory path to load rules from. Can be absolute or relative to workspace root.
 * @param tsConfigPath - Optional path to tsconfig.json for TypeScript compilation.
 *                       If not provided, will search for tsconfig.json starting from
 *                       the directory and traversing up to the workspace root.
 * @returns An object containing the loaded ESLint rules (without any prefix).
 *          Returns an empty object if the directory doesn't exist or loading fails.
 *
 * @example
 * ```typescript
 * // Load rules from a custom directory (relative to workspace root)
 * const customRules = await loadWorkspaceRules('packages/my-eslint-plugin/rules');
 *
 * // Load rules with a specific tsconfig
 * const customRules = await loadWorkspaceRules(
 *   'packages/my-eslint-plugin/rules',
 *   'packages/my-eslint-plugin/tsconfig.json'
 * );
 *
 * // Or use absolute paths
 * const customRules = loadWorkspaceRules('/absolute/path/to/rules');
 * ```
 */
async function loadWorkspaceRules(directory, tsConfigPath) {
    const resolvedDirectory = (0, path_1.isAbsolute)(directory)
        ? directory
        : (0, path_1.resolve)(devkit_1.workspaceRoot, directory);
    if (!resolvedDirectory.startsWith(normalizePath(devkit_1.workspaceRoot))) {
        console.warn(`Directory "${resolvedDirectory}" is outside the workspace root "${devkit_1.workspaceRoot}". ESLint rules can only be loaded from within the workspace.`);
        return {};
    }
    if (!(0, fs_1.existsSync)(resolvedDirectory)) {
        console.warn(`Directory "${resolvedDirectory}" does not exist. Skipping loading ESLint rules from this directory.`);
        return {};
    }
    let registrationCleanup = null;
    try {
        const effectiveTsConfigPath = findTsConfig(resolvedDirectory, tsConfigPath);
        if (effectiveTsConfigPath) {
            registrationCleanup = (0, internal_1.registerTsProject)(effectiveTsConfigPath);
        }
        const entryFile = resolveDirectoryEntryFile(resolvedDirectory);
        // Only rules are supported (not configs, processors, etc.)
        const module = await (0, config_utils_1.loadConfigFile)(entryFile);
        const rules = module.rules || module;
        return rules;
    }
    catch (err) {
        console.error(err);
        return {};
    }
    finally {
        if (registrationCleanup) {
            registrationCleanup();
        }
    }
}
exports.workspaceRules = (() => {
    // If `tools/eslint-rules` folder doesn't exist, there is no point trying to register and load it
    if (!(0, fs_1.existsSync)(constants_1.WORKSPACE_PLUGIN_DIR)) {
        return {};
    }
    // Register `tools/eslint-rules` for TS transpilation
    const registrationCleanup = (0, internal_1.registerTsProject)((0, path_1.join)(constants_1.WORKSPACE_PLUGIN_DIR, 'tsconfig.json'));
    try {
        /**
         * Currently we only support applying the rules from the user's workspace plugin object
         * (i.e. not other things that plugings can expose like configs, processors etc)
         */
        const { rules } = require(constants_1.WORKSPACE_PLUGIN_DIR);
        // Apply the namespace to the resolved rules
        const namespacedRules = {};
        for (const [ruleName, ruleConfig] of Object.entries(rules)) {
            namespacedRules[`${constants_1.WORKSPACE_RULE_PREFIX}-${ruleName}`] = ruleConfig;
            // keep the old namespaced rules for backwards compatibility
            namespacedRules[`${constants_1.WORKSPACE_RULE_PREFIX}/${ruleName}`] = ruleConfig;
        }
        return namespacedRules;
    }
    catch (err) {
        console.error(err);
        return {};
    }
    finally {
        if (registrationCleanup) {
            registrationCleanup();
        }
    }
})();
