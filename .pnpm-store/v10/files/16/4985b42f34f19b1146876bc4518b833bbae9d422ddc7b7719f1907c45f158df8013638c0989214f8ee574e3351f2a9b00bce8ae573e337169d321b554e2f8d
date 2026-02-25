"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePathOptions = normalizePathOptions;
const utils_1 = require("./utils");
const executorFieldsToNormalize = [
    'outputPath',
    'index',
    'main',
    'assets',
    'tsConfig',
    'styles',
    'babelConfig',
    'additionalEntryPoints',
    'scripts',
    'fileReplacements',
    'postcssConfig',
    'stylePreprocessorOptions',
    'publicPath',
];
function normalizePathOptions(projectRoot, options) {
    for (const [key, value] of Object.entries(options)) {
        if (!executorFieldsToNormalize.includes(key)) {
            continue;
        }
        options[key] = normalizePath(projectRoot, key, value);
    }
    return options;
}
function normalizePath(projectRoot, key, value) {
    if (!value)
        return value;
    switch (key) {
        case 'assets':
            return value.map((asset) => {
                if (typeof asset === 'string') {
                    return (0, utils_1.toProjectRelativePath)(asset, projectRoot);
                }
                return {
                    ...asset,
                    input: (0, utils_1.toProjectRelativePath)(asset.input, projectRoot),
                    output: (0, utils_1.toProjectRelativePath)(asset.output, projectRoot),
                };
            });
        case 'styles':
        case 'scripts':
            return value.map((item) => {
                if (typeof item === 'string') {
                    return (0, utils_1.toProjectRelativePath)(item, projectRoot);
                }
                return {
                    ...item,
                    input: (0, utils_1.toProjectRelativePath)(item.input, projectRoot),
                };
            });
        case 'additionalEntryPoints':
            return value.map((entry) => {
                return {
                    ...entry,
                    entryPath: (0, utils_1.toProjectRelativePath)(entry.entryPath, projectRoot),
                };
            });
        case 'fileReplacements':
            return value.map((replacement) => {
                return {
                    replace: (0, utils_1.toProjectRelativePath)(replacement.replace, projectRoot),
                    with: (0, utils_1.toProjectRelativePath)(replacement.with, projectRoot),
                };
            });
        default:
            return Array.isArray(value)
                ? value.map((item) => (0, utils_1.toProjectRelativePath)(item, projectRoot))
                : (0, utils_1.toProjectRelativePath)(value, projectRoot);
    }
}
