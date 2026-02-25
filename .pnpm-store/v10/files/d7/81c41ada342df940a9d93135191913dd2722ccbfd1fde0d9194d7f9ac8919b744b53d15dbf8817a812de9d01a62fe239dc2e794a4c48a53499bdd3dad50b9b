"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToInferred = convertToInferred;
exports.createCollectingLogger = createCollectingLogger;
const devkit_1 = require("@nx/devkit");
const aggregate_log_util_1 = require("@nx/devkit/src/generators/plugin-migrations/aggregate-log-util");
const executor_to_plugin_migrator_1 = require("@nx/devkit/src/generators/plugin-migrations/executor-to-plugin-migrator");
const tsquery_1 = require("@phenomnomnominal/tsquery");
const plugin_1 = require("../../plugins/plugin");
const versions_1 = require("../../utils/versions");
const utils_1 = require("./utils");
const devkit_exports_1 = require("nx/src/devkit-exports");
async function convertToInferred(tree, options) {
    const projectGraph = await (0, devkit_1.createProjectGraphAsync)();
    const migrationContext = {
        logger: new aggregate_log_util_1.AggregatedLog(),
        projectGraph,
        workspaceRoot: tree.root,
    };
    const logger = createCollectingLogger();
    const migratedProjects = await (0, executor_to_plugin_migrator_1.migrateProjectExecutorsToPlugin)(tree, projectGraph, '@nx/webpack/plugin', plugin_1.createNodesV2, {
        buildTargetName: 'build',
        previewTargetName: 'preview',
        serveStaticTargetName: 'serve-static',
        serveTargetName: 'serve',
    }, [
        {
            executors: ['@nx/webpack:webpack', '@nrwl/webpack:webpack'],
            postTargetTransformer: (0, utils_1.buildPostTargetTransformerFactory)(migrationContext),
            targetPluginOptionMapper: (target) => ({ buildTargetName: target }),
            skipProjectFilter: skipProjectFilterFactory(tree),
        },
        {
            executors: ['@nx/webpack:dev-server', '@nrwl/webpack:dev-server'],
            postTargetTransformer: (0, utils_1.servePostTargetTransformerFactory)(migrationContext),
            targetPluginOptionMapper: (target) => ({ serveTargetName: target }),
            skipProjectFilter: skipProjectFilterFactory(tree),
        },
    ], options.project, logger);
    if (migratedProjects.size === 0) {
        const convertMessage = [...logger.loggedMessages.values()]
            .flat()
            .find((v) => v.includes('@nx/webpack:convert-config-to-webpack-plugin'));
        if (convertMessage.length > 0) {
            logger.flushLogs((message) => !convertMessage.includes(message));
            throw new Error(convertMessage);
        }
        else {
            logger.flushLogs();
            throw new executor_to_plugin_migrator_1.NoTargetsToMigrateError();
        }
    }
    else {
        logger.flushLogs();
    }
    const installCallback = (0, devkit_1.addDependenciesToPackageJson)(tree, {}, { 'webpack-cli': versions_1.webpackCliVersion }, undefined, true);
    if (!options.skipFormat) {
        await (0, devkit_1.formatFiles)(tree);
    }
    return (0, devkit_1.runTasksInSerial)(installCallback, () => {
        migrationContext.logger.flushLogs();
    });
}
function skipProjectFilterFactory(tree) {
    return function skipProjectFilter(projectConfiguration) {
        const buildTarget = Object.values(projectConfiguration.targets).find((target) => target.executor === '@nx/webpack:webpack' ||
            target.executor === '@nrwl/webpack:webpack');
        // the projects for which this is called are guaranteed to have a build target
        const webpackConfigPath = buildTarget.options.webpackConfig;
        if (!webpackConfigPath) {
            return `The webpack config path is missing in the project configuration (${projectConfiguration.root}).`;
        }
        const sourceFile = (0, tsquery_1.ast)(tree.read(webpackConfigPath, 'utf-8'));
        const composePluginsSelector = 'CallExpression:has(Identifier[name=composePlugins])';
        const composePlugins = (0, tsquery_1.query)(sourceFile, composePluginsSelector)[0];
        if (composePlugins) {
            return `The webpack config (${webpackConfigPath}) can only work with the  "@nx/webpack:webpack" executor. Run the "@nx/webpack:convert-config-to-webpack-plugin" generator first.`;
        }
        const nxAppWebpackPluginSelector = 'PropertyAssignment:has(Identifier[name=plugins]) NewExpression:has(Identifier[name=NxAppWebpackPlugin])';
        const nxAppWebpackPlugin = (0, tsquery_1.query)(sourceFile, nxAppWebpackPluginSelector)[0];
        if (!nxAppWebpackPlugin) {
            return `No "NxAppWebpackPlugin" found in the webpack config (${webpackConfigPath}). Its usage is required for the migration to work.`;
        }
        return false;
    };
}
function createCollectingLogger() {
    const loggedMessages = new Map();
    const flushLogs = (filter) => {
        loggedMessages.forEach((messages, method) => {
            messages.forEach((message) => {
                if (!filter || filter(message)) {
                    devkit_exports_1.logger[method](message);
                }
            });
        });
    };
    return new Proxy({ ...devkit_exports_1.logger, loggedMessages, flushLogs }, {
        get(target, property) {
            const originalMethod = target[property];
            if (typeof originalMethod === 'function') {
                return (...args) => {
                    const message = args.join(' ');
                    const propertyString = String(property);
                    if (!loggedMessages.has(message)) {
                        loggedMessages.set(propertyString, []);
                    }
                    loggedMessages.get(propertyString).push(message);
                };
            }
            return originalMethod;
        },
    });
}
