"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servePostTargetTransformerFactory = servePostTargetTransformerFactory;
const devkit_1 = require("@nx/devkit");
const plugin_migration_utils_1 = require("@nx/devkit/src/generators/plugin-migrations/plugin-migration-utils");
const tsquery_1 = require("@phenomnomnominal/tsquery");
const path_1 = require("path");
const ts = require("typescript");
const serve_path_1 = require("../../../executors/dev-server/lib/serve-path");
const ast_1 = require("./ast");
function servePostTargetTransformerFactory(migrationContext) {
    return async function servePostTargetTransformer(target, tree, projectDetails, inferredTarget) {
        const context = {
            ...migrationContext,
            projectName: projectDetails.projectName,
            projectRoot: projectDetails.root,
        };
        const { devServerOptions, webpackConfigPath } = await processOptions(tree, target, context);
        updateWebpackConfig(tree, webpackConfigPath, devServerOptions, context);
        if (target.outputs) {
            (0, plugin_migration_utils_1.processTargetOutputs)(target, [], inferredTarget, {
                projectName: projectDetails.projectName,
                projectRoot: projectDetails.root,
            });
        }
        return target;
    };
}
async function processOptions(tree, target, context) {
    const executorContext = {
        cwd: process.cwd(),
        nxJsonConfiguration: (0, devkit_1.readJson)(tree, 'nx.json'),
        projectGraph: context.projectGraph,
        projectName: context.projectName,
        projectsConfigurations: Object.entries(context.projectGraph.nodes).reduce((acc, [projectName, project]) => {
            acc.projects[projectName] = project.data;
            return acc;
        }, { version: 1, projects: {} }),
        root: context.workspaceRoot,
    };
    const buildTarget = (0, devkit_1.parseTargetString)(target.options.buildTarget, executorContext);
    const buildOptions = (0, devkit_1.readTargetOptions)(buildTarget, executorContext);
    // it must exist, we validated it in the project filter
    const webpackConfigPath = buildOptions.webpackConfig;
    const defaultOptions = extractDevServerOptions(target.options, context);
    applyDefaults(defaultOptions, buildOptions);
    const devServerOptions = {
        default: defaultOptions,
    };
    if (target.configurations && Object.keys(target.configurations).length) {
        for (const [configName, config] of Object.entries(target.configurations)) {
            devServerOptions[configName] = extractDevServerOptions(config, context);
        }
    }
    return { devServerOptions, webpackConfigPath };
}
function extractDevServerOptions(options, context) {
    const devServerOptions = {};
    for (const [key, value] of Object.entries(options)) {
        if (key === 'hmr') {
            devServerOptions.hot = value;
            if (value) {
                // the executor disables liveReload when hmr is enabled
                devServerOptions.liveReload = false;
                delete options.liveReload;
            }
            delete options.hmr;
        }
        else if (key === 'allowedHosts') {
            devServerOptions.allowedHosts = value.split(',');
            delete options.allowedHosts;
        }
        else if (key === 'publicHost') {
            devServerOptions.client = {
                webSocketURL: value,
            };
            delete options.publicHost;
        }
        else if (key === 'proxyConfig') {
            devServerOptions.proxy = getProxyConfig(context.workspaceRoot, value);
            delete options.proxyConfig;
        }
        else if (key === 'ssl' || key === 'sslCert' || key === 'sslKey') {
            if (key === 'ssl' || 'ssl' in options) {
                if (options.ssl) {
                    devServerOptions.server = { type: 'https' };
                    if (options.sslCert && options.sslKey) {
                        devServerOptions.server.options = {};
                        devServerOptions.server.options.cert = (0, plugin_migration_utils_1.toProjectRelativePath)(options.sslCert, context.projectRoot);
                        devServerOptions.server.options.key = (0, plugin_migration_utils_1.toProjectRelativePath)(options.sslKey, context.projectRoot);
                    }
                    else if (options.sslCert) {
                        context.logger.addLog({
                            executorName: '@nx/webpack:dev-server',
                            log: 'The "sslCert" option was set but "sslKey" was missing and "ssl" was set to "true". This means that "sslCert" was ignored by the executor. It has been removed from the options.',
                            project: context.projectName,
                        });
                    }
                    else if (options.sslKey) {
                        context.logger.addLog({
                            executorName: '@nx/webpack:dev-server',
                            log: 'The "sslKey" option was set but "sslCert" was missing and "ssl" was set to "true". This means that "sslKey" was ignored by the executor. It has been removed from the options.',
                            project: context.projectName,
                        });
                    }
                }
                else if (options.sslCert || options.sslKey) {
                    context.logger.addLog({
                        executorName: '@nx/webpack:dev-server',
                        log: 'The "sslCert" and/or "sslKey" were set with "ssl" set to "false". This means they were ignored by the executor. They have been removed from the options.',
                        project: context.projectName,
                    });
                }
                delete options.ssl;
                delete options.sslCert;
                delete options.sslKey;
            }
            else if (options.sslCert || options.sslKey) {
                context.logger.addLog({
                    executorName: '@nx/webpack:dev-server',
                    log: 'The "sslCert" and/or "sslKey" were set but the "ssl" was not set. This means they were ignored by the executor. They have been removed from the options.',
                    project: context.projectName,
                });
                delete options.sslCert;
                delete options.sslKey;
            }
        }
        else if (key === 'buildTarget') {
            delete options.buildTarget;
        }
        else if (key === 'watch') {
            context.logger.addLog({
                executorName: '@nx/webpack:dev-server',
                log: 'The "watch" option was removed from the serve configuration since it is not needed. The dev server always watches the files.',
                project: context.projectName,
            });
            delete options.watch;
        }
        else if (key === 'baseHref') {
            context.logger.addLog({
                executorName: '@nx/webpack:dev-server',
                log: 'The "baseHref" option was removed from the serve configuration. If you need different base hrefs for the build and the dev server, please update the final webpack config manually to achieve that.',
                project: context.projectName,
            });
            delete options.baseHref;
        }
        else if (key === 'memoryLimit') {
            // we already log a message for this one when processing the build options
            delete options.memoryLimit;
        }
        else {
            devServerOptions[key] = value;
            delete options[key];
        }
    }
    return devServerOptions;
}
function applyDefaults(options, buildOptions) {
    if (!options) {
        options = {};
    }
    if (options?.port === undefined) {
        options.port = 4200;
    }
    options.headers = { 'Access-Control-Allow-Origin': '*' };
    const servePath = (0, serve_path_1.buildServePath)(buildOptions);
    options.historyApiFallback = {
        index: buildOptions.index && `${servePath}${(0, path_1.basename)(buildOptions.index)}`,
        disableDotRule: true,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
    };
}
function getProxyConfig(root, proxyConfig) {
    const proxyPath = (0, path_1.resolve)(root, proxyConfig);
    return require(proxyPath);
}
function updateWebpackConfig(tree, webpackConfigPath, devServerOptions, context) {
    let sourceFile;
    let webpackConfigText;
    const updateSources = () => {
        webpackConfigText = tree.read(webpackConfigPath, 'utf-8');
        sourceFile = (0, tsquery_1.ast)(webpackConfigText);
    };
    updateSources();
    setOptionsInWebpackConfig(tree, webpackConfigText, sourceFile, webpackConfigPath, devServerOptions);
    updateSources();
    setDevServerOptionsInWebpackConfig(tree, webpackConfigText, sourceFile, webpackConfigPath, context);
}
function setOptionsInWebpackConfig(tree, text, sourceFile, webpackConfigPath, devServerOptions) {
    const { default: defaultOptions, ...configurationOptions } = devServerOptions;
    const configValuesSelector = 'VariableDeclaration:has(Identifier[name=configValues]) ObjectLiteralExpression';
    const configValuesObject = (0, tsquery_1.query)(sourceFile, configValuesSelector)[0];
    // configValues must exist at this point, we added it when processing the build target
    /**
     * const configValues = {
     *   ...
     *   serve: {
     *     default: { ... },
     *     configuration1: { ... },
     *    ...
     *  },
     */
    const updatedConfigValuesObject = ts.factory.updateObjectLiteralExpression(configValuesObject, [
        ...configValuesObject.properties,
        ts.factory.createPropertyAssignment('serve', ts.factory.createObjectLiteralExpression([
            ts.factory.createPropertyAssignment('default', ts.factory.createObjectLiteralExpression(Object.entries(defaultOptions).map(([key, value]) => (0, ast_1.toPropertyAssignment)(key, value)))),
            ...(configurationOptions
                ? Object.entries(configurationOptions).map(([key, value]) => ts.factory.createPropertyAssignment(key, ts.factory.createObjectLiteralExpression(Object.entries(value).map(([key, value]) => (0, ast_1.toPropertyAssignment)(key, value)))))
                : []),
        ])),
    ]);
    text = `${text.slice(0, configValuesObject.getStart())}${ts
        .createPrinter()
        .printNode(ts.EmitHint.Unspecified, updatedConfigValuesObject, sourceFile)}${text.slice(configValuesObject.getEnd())}`;
    tree.write(webpackConfigPath, text);
    sourceFile = (0, tsquery_1.ast)(text);
    const buildOptionsSelector = 'VariableStatement:has(VariableDeclaration:has(Identifier[name=buildOptions]))';
    const buildOptionsStatement = (0, tsquery_1.query)(sourceFile, buildOptionsSelector)[0];
    text = `${text.slice(0, buildOptionsStatement.getEnd())}
  const devServerOptions = {
    ...configValues.serve.default,
    ...configValues.serve[configuration],
  };${text.slice(buildOptionsStatement.getEnd())}`;
    tree.write(webpackConfigPath, text);
}
function setDevServerOptionsInWebpackConfig(tree, text, sourceFile, webpackConfigPath, context) {
    const webpackConfigDevServerSelector = 'ObjectLiteralExpression > PropertyAssignment:has(Identifier[name=devServer])';
    const webpackConfigDevServer = (0, tsquery_1.query)(sourceFile, webpackConfigDevServerSelector)[0];
    if (webpackConfigDevServer) {
        context.logger.addLog({
            executorName: '@nx/webpack:dev-server',
            log: `The "devServer" option is already set in the webpack config. The migration doesn't support updating it. Please review it and make any necessary changes manually.`,
            project: context.projectName,
        });
        text = `${text.slice(0, webpackConfigDevServer.getStart())}// This is the untouched "devServer" option from the original webpack config. Please review it and make any necessary changes manually.
    ${text.slice(webpackConfigDevServer.getStart())}`;
        tree.write(webpackConfigPath, text);
        // If the devServer property already exists, we don't know how to merge the
        // options, so we leave it as is.
        return;
    }
    const webpackConfigSelector = 'ObjectLiteralExpression:has(PropertyAssignment:has(Identifier[name=plugins]))';
    const webpackConfig = (0, tsquery_1.query)(sourceFile, webpackConfigSelector)[0];
    const updatedWebpackConfig = ts.factory.updateObjectLiteralExpression(webpackConfig, [
        ts.factory.createPropertyAssignment('devServer', ts.factory.createIdentifier('devServerOptions')),
        ...webpackConfig.properties,
    ]);
    text = `${text.slice(0, webpackConfig.getStart())}${ts
        .createPrinter()
        .printNode(ts.EmitHint.Unspecified, updatedWebpackConfig, sourceFile)}${text.slice(webpackConfig.getEnd())}`;
    tree.write(webpackConfigPath, text);
}
