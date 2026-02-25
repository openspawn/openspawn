"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPostTargetTransformerFactory = buildPostTargetTransformerFactory;
const plugin_migration_utils_1 = require("@nx/devkit/src/generators/plugin-migrations/plugin-migration-utils");
const tsquery_1 = require("@phenomnomnominal/tsquery");
const ts = require("typescript");
const ast_1 = require("./ast");
function buildPostTargetTransformerFactory(migrationContext) {
    return function buildPostTargetTransformer(target, tree, projectDetails, inferredTarget) {
        const context = {
            ...migrationContext,
            projectName: projectDetails.projectName,
            projectRoot: projectDetails.root,
        };
        const { pluginOptions, webpackConfigPath } = processOptions(target, context);
        updateWebpackConfig(tree, webpackConfigPath, pluginOptions);
        if (target.outputs) {
            (0, plugin_migration_utils_1.processTargetOutputs)(target, [], inferredTarget, {
                projectName: projectDetails.projectName,
                projectRoot: projectDetails.root,
            });
        }
        return target;
    };
}
function processOptions(target, context) {
    const webpackConfigPath = target.options.webpackConfig;
    delete target.options.webpackConfig;
    const pluginOptions = {
        default: extractPluginOptions(target.options, context),
    };
    if (target.configurations && Object.keys(target.configurations).length) {
        for (const [configName, config] of Object.entries(target.configurations)) {
            pluginOptions[configName] = extractPluginOptions(config, context, configName);
        }
    }
    return { pluginOptions, webpackConfigPath };
}
const pathOptions = new Set([
    'babelConfig',
    'index',
    'main',
    'outputPath',
    'polyfills',
    'postcssConfig',
    'tsConfig',
]);
const assetsOptions = new Set(['assets', 'scripts', 'styles']);
function extractPluginOptions(options, context, configName) {
    const pluginOptions = {};
    for (const [key, value] of Object.entries(options)) {
        if (pathOptions.has(key)) {
            pluginOptions[key] = (0, plugin_migration_utils_1.toProjectRelativePath)(value, context.projectRoot);
            delete options[key];
        }
        else if (assetsOptions.has(key)) {
            pluginOptions[key] = value.map((asset) => {
                if (typeof asset === 'string') {
                    return (0, plugin_migration_utils_1.toProjectRelativePath)(asset, context.projectRoot);
                }
                asset.input = (0, plugin_migration_utils_1.toProjectRelativePath)(asset.input, context.projectRoot);
                return asset;
            });
            delete options[key];
        }
        else if (key === 'fileReplacements') {
            pluginOptions.fileReplacements = value.map((replacement) => ({
                replace: (0, plugin_migration_utils_1.toProjectRelativePath)(replacement.replace, context.projectRoot),
                with: (0, plugin_migration_utils_1.toProjectRelativePath)(replacement.with, context.projectRoot),
            }));
            delete options.fileReplacements;
        }
        else if (key === 'additionalEntryPoints') {
            pluginOptions.additionalEntryPoints = value.map((entryPoint) => {
                entryPoint.entryPath = (0, plugin_migration_utils_1.toProjectRelativePath)(entryPoint.entryPath, context.projectRoot);
                return entryPoint;
            });
            delete options.additionalEntryPoints;
        }
        else if (key === 'memoryLimit') {
            pluginOptions.memoryLimit = value;
            const serveMemoryLimit = getMemoryLimitFromServeTarget(context, configName);
            if (serveMemoryLimit) {
                pluginOptions.memoryLimit = Math.max(serveMemoryLimit, value);
                context.logger.addLog({
                    executorName: '@nx/webpack:webpack',
                    log: `The "memoryLimit" option was set in both the serve and build configurations. The migration set the higher value to the build configuration and removed the option from the serve configuration.`,
                    project: context.projectName,
                });
            }
            delete options.memoryLimit;
        }
        else if (key === 'standardWebpackConfigFunction') {
            delete options.standardWebpackConfigFunction;
        }
        else {
            pluginOptions[key] = value;
            delete options[key];
        }
    }
    return pluginOptions;
}
function updateWebpackConfig(tree, webpackConfig, pluginOptions) {
    let sourceFile;
    let webpackConfigText;
    const updateSources = () => {
        webpackConfigText = tree.read(webpackConfig, 'utf-8');
        sourceFile = (0, tsquery_1.ast)(webpackConfigText);
    };
    updateSources();
    setOptionsInWebpackConfig(tree, webpackConfigText, sourceFile, webpackConfig, pluginOptions);
    updateSources();
    setOptionsInNxWebpackPlugin(tree, webpackConfigText, sourceFile, webpackConfig);
    updateSources();
    setOptionsInLegacyNxPlugin(tree, webpackConfigText, sourceFile, webpackConfig);
}
function setOptionsInWebpackConfig(tree, text, sourceFile, webpackConfig, pluginOptions) {
    const { default: defaultOptions, ...configurationOptions } = pluginOptions;
    const optionsSelector = 'VariableStatement:has(VariableDeclaration:has(Identifier[name=options]))';
    const optionsVariable = (0, tsquery_1.query)(sourceFile, optionsSelector)[0];
    // This is assuming the `options` variable will be available since it's what the
    // `convert-config-to-webpack-plugin` generates
    let defaultOptionsObject;
    const optionsObject = (0, tsquery_1.query)(optionsVariable, 'ObjectLiteralExpression')[0];
    if (optionsObject.properties.length === 0) {
        defaultOptionsObject = ts.factory.createObjectLiteralExpression(Object.entries(defaultOptions).map(([key, value]) => (0, ast_1.toPropertyAssignment)(key, value)));
    }
    else {
        // filter out the default options that are already in the options object
        // the existing options override the options from the project.json file
        const filteredDefaultOptions = Object.entries(defaultOptions).filter(([key]) => !optionsObject.properties.some((property) => ts.isPropertyAssignment(property) &&
            ts.isIdentifier(property.name) &&
            property.name.text === key));
        defaultOptionsObject = ts.factory.createObjectLiteralExpression([
            ...optionsObject.properties,
            ...filteredDefaultOptions.map(([key, value]) => (0, ast_1.toPropertyAssignment)(key, value)),
        ]);
    }
    /**
     * const configValues = {
     *  build: {
     *   default: { ... },
     *   configuration1: { ... },
     *   configuration2: { ... },
     * }
     */
    const configValuesVariable = ts.factory.createVariableStatement(undefined, ts.factory.createVariableDeclarationList([
        ts.factory.createVariableDeclaration('configValues', undefined, undefined, ts.factory.createObjectLiteralExpression([
            ts.factory.createPropertyAssignment('build', ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment('default', defaultOptionsObject),
                ...(configurationOptions
                    ? Object.entries(configurationOptions).map(([key, value]) => ts.factory.createPropertyAssignment(key, ts.factory.createObjectLiteralExpression(Object.entries(value).map(([key, value]) => (0, ast_1.toPropertyAssignment)(key, value)))))
                    : []),
            ])),
        ], true)),
    ], ts.NodeFlags.Const));
    text = `${text.slice(0, optionsVariable.getStart())}
    // These options were migrated by @nx/webpack:convert-to-inferred from
    // the project.json file and merged with the options in this file
    ${ts
        .createPrinter()
        .printNode(ts.EmitHint.Unspecified, configValuesVariable, sourceFile)}
    
    // Determine the correct configValue to use based on the configuration
    const configuration = process.env.NX_TASK_TARGET_CONFIGURATION || 'default';

    const buildOptions = {
      ...configValues.build.default,
      ...configValues.build[configuration],
    };${text.slice(optionsVariable.getEnd())}`;
    // These are comments written by the `convert-config-to-webpack-plugin` that are no longer needed
    text = text
        .replace(`// This file was migrated using @nx/webpack:convert-config-to-webpack-plugin from your './webpack.config.old.js'`, '')
        .replace('// Please check that the options here are correct as they were moved from the old webpack.config.js to this file.', '');
    tree.write(webpackConfig, text);
}
function setOptionsInNxWebpackPlugin(tree, text, sourceFile, webpackConfig) {
    const nxAppWebpackPluginSelector = 'PropertyAssignment:has(Identifier[name=plugins]) NewExpression:has(Identifier[name=NxAppWebpackPlugin])';
    const nxAppWebpackPlugin = (0, tsquery_1.query)(sourceFile, nxAppWebpackPluginSelector)[0];
    // the NxAppWebpackPlugin must exists, otherwise, the migration doesn't run and we wouldn't reach this point
    const updatedNxAppWebpackPlugin = ts.factory.updateNewExpression(nxAppWebpackPlugin, nxAppWebpackPlugin.expression, undefined, [ts.factory.createIdentifier('buildOptions')]);
    text = `${text.slice(0, nxAppWebpackPlugin.getStart())}${ts
        .createPrinter()
        .printNode(ts.EmitHint.Unspecified, updatedNxAppWebpackPlugin, sourceFile)}${text.slice(nxAppWebpackPlugin.getEnd())}`;
    tree.write(webpackConfig, text);
}
function setOptionsInLegacyNxPlugin(tree, text, sourceFile, webpackConfig) {
    const legacyNxPluginSelector = 'AwaitExpression CallExpression:has(Identifier[name=useLegacyNxPlugin])';
    const legacyNxPlugin = (0, tsquery_1.query)(sourceFile, legacyNxPluginSelector)[0];
    // we're assuming the `useLegacyNxPlugin` function is being called since it's what the `convert-config-to-webpack-plugin` generates
    // we've already "ensured" that the `convert-config-to-webpack-plugin` was run by checking for the `NxAppWebpackPlugin` in the project validation
    const updatedLegacyNxPlugin = ts.factory.updateCallExpression(legacyNxPlugin, legacyNxPlugin.expression, undefined, [legacyNxPlugin.arguments[0], ts.factory.createIdentifier('buildOptions')]);
    text = `${text.slice(0, legacyNxPlugin.getStart())}${ts
        .createPrinter()
        .printNode(ts.EmitHint.Unspecified, updatedLegacyNxPlugin, sourceFile)}${text.slice(legacyNxPlugin.getEnd())}`;
    tree.write(webpackConfig, text);
}
function getMemoryLimitFromServeTarget(context, configName) {
    const { targets } = context.projectGraph.nodes[context.projectName].data;
    const serveTarget = Object.values(targets).find((target) => target.executor === '@nx/webpack:dev-server' ||
        target.executor === '@nrwl/web:dev-server');
    if (!serveTarget) {
        return undefined;
    }
    if (configName && serveTarget.configurations?.[configName]) {
        return (serveTarget.configurations[configName].options?.memoryLimit ??
            serveTarget.options?.memoryLimit);
    }
    return serveTarget.options?.memoryLimit;
}
