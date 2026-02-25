"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptions = normalizeOptions;
exports.normalizeAssets = normalizeAssets;
exports.normalizeFileReplacements = normalizeFileReplacements;
const devkit_1 = require("@nx/devkit");
const ts_solution_setup_1 = require("@nx/js/src/utils/typescript/ts-solution-setup");
const fs_1 = require("fs");
const path_1 = require("path");
function normalizeOptions(options) {
    const combinedPluginAndMaybeExecutorOptions = {};
    const isProd = process.env.NODE_ENV === 'production';
    // Since this is invoked by the executor, the graph has already been created and cached.
    const projectGraph = (0, devkit_1.readCachedProjectGraph)();
    const taskDetailsFromBuildTarget = process.env.NX_BUILD_TARGET
        ? (0, devkit_1.parseTargetString)(process.env.NX_BUILD_TARGET, projectGraph)
        : undefined;
    const projectName = taskDetailsFromBuildTarget
        ? taskDetailsFromBuildTarget.project
        : process.env.NX_TASK_TARGET_PROJECT;
    const targetName = taskDetailsFromBuildTarget
        ? taskDetailsFromBuildTarget.target
        : process.env.NX_TASK_TARGET_TARGET;
    const configurationName = taskDetailsFromBuildTarget
        ? taskDetailsFromBuildTarget.configuration
        : process.env.NX_TASK_TARGET_CONFIGURATION;
    const projectNode = projectGraph.nodes[projectName];
    const targetConfig = projectNode.data.targets[targetName];
    normalizeRelativePaths(projectNode.data.root, options);
    // Merge options from `@nx/webpack:webpack` into plugin options.
    // Options from `@nx/webpack:webpack` take precedence.
    const originalTargetOptions = targetConfig.options;
    if (configurationName) {
        Object.assign(originalTargetOptions, targetConfig.configurations?.[configurationName]);
    }
    // This could be called from dev-server which means we need to read `buildTarget` to get actual build options.
    // Otherwise, the options are passed from the `@nx/webpack:webpack` executor.
    if (originalTargetOptions.buildTarget) {
        const buildTargetOptions = targetConfig.options;
        if (configurationName) {
            Object.assign(buildTargetOptions, targetConfig.configurations?.[configurationName]);
        }
        Object.assign(combinedPluginAndMaybeExecutorOptions, options, 
        // executor options take precedence (especially for overriding with CLI args)
        buildTargetOptions);
    }
    else {
        Object.assign(combinedPluginAndMaybeExecutorOptions, options, 
        // executor options take precedence (especially for overriding with CLI args)
        originalTargetOptions);
    }
    const sourceRoot = (0, ts_solution_setup_1.getProjectSourceRoot)(projectNode.data);
    if (!combinedPluginAndMaybeExecutorOptions.main) {
        throw new Error(`Missing "main" option for the entry file. Set this option in your Nx webpack plugin.`);
    }
    return {
        ...combinedPluginAndMaybeExecutorOptions,
        assets: combinedPluginAndMaybeExecutorOptions.assets
            ? normalizeAssets(combinedPluginAndMaybeExecutorOptions.assets, devkit_1.workspaceRoot, sourceRoot, projectNode.data.root)
            : [],
        baseHref: combinedPluginAndMaybeExecutorOptions.baseHref ?? '/',
        buildLibsFromSource: combinedPluginAndMaybeExecutorOptions.buildLibsFromSource ?? true,
        commonChunk: combinedPluginAndMaybeExecutorOptions.commonChunk ?? true,
        compiler: combinedPluginAndMaybeExecutorOptions.compiler ?? 'babel',
        configurationName,
        extractCss: combinedPluginAndMaybeExecutorOptions.extractCss ?? true,
        fileReplacements: normalizeFileReplacements(devkit_1.workspaceRoot, combinedPluginAndMaybeExecutorOptions.fileReplacements),
        generateIndexHtml: combinedPluginAndMaybeExecutorOptions.generateIndexHtml ?? true,
        main: combinedPluginAndMaybeExecutorOptions.main,
        namedChunks: combinedPluginAndMaybeExecutorOptions.namedChunks ?? !isProd,
        optimization: combinedPluginAndMaybeExecutorOptions.optimization ?? isProd,
        outputFileName: combinedPluginAndMaybeExecutorOptions.outputFileName ?? 'main.js',
        outputHashing: combinedPluginAndMaybeExecutorOptions.outputHashing ??
            (isProd ? 'all' : 'none'),
        outputPath: combinedPluginAndMaybeExecutorOptions.outputPath,
        projectGraph,
        projectName,
        projectRoot: projectNode.data.root,
        root: devkit_1.workspaceRoot,
        runtimeChunk: combinedPluginAndMaybeExecutorOptions.runtimeChunk ?? true,
        scripts: combinedPluginAndMaybeExecutorOptions.scripts ?? [],
        sourceMap: combinedPluginAndMaybeExecutorOptions.sourceMap ?? !isProd,
        sourceRoot,
        styles: combinedPluginAndMaybeExecutorOptions.styles ?? [],
        target: combinedPluginAndMaybeExecutorOptions.target,
        targetName,
        vendorChunk: combinedPluginAndMaybeExecutorOptions.vendorChunk ?? !isProd,
    };
}
function normalizeAssets(assets, root, sourceRoot, projectRoot, resolveRelativePathsToProjectRoot = true) {
    return assets.map((asset) => {
        if (typeof asset === 'string') {
            const assetPath = (0, devkit_1.normalizePath)(asset);
            const resolvedAssetPath = (0, path_1.resolve)(root, assetPath);
            const resolvedSourceRoot = (0, path_1.resolve)(root, sourceRoot);
            if (!resolvedAssetPath.startsWith(resolvedSourceRoot)) {
                throw new Error(`The ${resolvedAssetPath} asset path must start with the project source root: ${sourceRoot}`);
            }
            const isDirectory = (0, fs_1.statSync)(resolvedAssetPath).isDirectory();
            const input = isDirectory
                ? resolvedAssetPath
                : (0, path_1.dirname)(resolvedAssetPath);
            const output = (0, path_1.relative)(resolvedSourceRoot, (0, path_1.resolve)(root, input));
            const glob = isDirectory ? '**/*' : (0, path_1.basename)(resolvedAssetPath);
            return {
                input,
                output,
                glob,
            };
        }
        else {
            if (asset.output.startsWith('..')) {
                throw new Error('An asset cannot be written to a location outside of the output path.');
            }
            const assetPath = (0, devkit_1.normalizePath)(asset.input);
            let resolvedAssetPath = (0, path_1.resolve)(root, assetPath);
            if (resolveRelativePathsToProjectRoot && asset.input.startsWith('.')) {
                const resolvedProjectRoot = (0, path_1.resolve)(root, projectRoot);
                resolvedAssetPath = (0, path_1.resolve)(resolvedProjectRoot, assetPath);
            }
            return {
                ...asset,
                input: resolvedAssetPath,
                // Now we remove starting slash to make Webpack place it from the output root.
                output: asset.output.replace(/^\//, ''),
            };
        }
    });
}
function normalizeFileReplacements(root, fileReplacements) {
    return fileReplacements
        ? fileReplacements.map((fileReplacement) => ({
            replace: (0, path_1.resolve)(root, fileReplacement.replace),
            with: (0, path_1.resolve)(root, fileReplacement.with),
        }))
        : [];
}
function normalizeRelativePaths(projectRoot, options) {
    for (const [fieldName, fieldValue] of Object.entries(options)) {
        if (isRelativePath(fieldValue)) {
            options[fieldName] = (0, path_1.join)(projectRoot, fieldValue);
        }
        else if (fieldName === 'additionalEntryPoints') {
            for (let i = 0; i < fieldValue.length; i++) {
                const v = fieldValue[i];
                if (isRelativePath(v)) {
                    fieldValue[i] = {
                        entryName: (0, path_1.parse)(v).name,
                        entryPath: (0, path_1.join)(projectRoot, v),
                    };
                }
                else if (isRelativePath(v.entryPath)) {
                    v.entryPath = (0, path_1.join)(projectRoot, v.entryPath);
                }
            }
        }
        else if (Array.isArray(fieldValue)) {
            for (let i = 0; i < fieldValue.length; i++) {
                if (isRelativePath(fieldValue[i])) {
                    fieldValue[i] = (0, path_1.join)(projectRoot, fieldValue[i]);
                }
            }
        }
    }
}
function isRelativePath(val) {
    return (typeof val === 'string' &&
        (val.startsWith('./') ||
            // Windows
            val.startsWith('.\\')));
}
