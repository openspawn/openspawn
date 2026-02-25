"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevServerOptions = getDevServerOptions;
const devkit_1 = require("@nx/devkit");
const path = require("path");
const fs_1 = require("fs");
const serve_path_1 = require("./serve-path");
function getDevServerOptions(root, serveOptions, buildOptions) {
    const servePath = (0, serve_path_1.buildServePath)(buildOptions);
    let scriptsOptimization;
    let stylesOptimization;
    if (typeof buildOptions.optimization === 'boolean') {
        scriptsOptimization = stylesOptimization = buildOptions.optimization;
    }
    else if (buildOptions.optimization) {
        scriptsOptimization = buildOptions.optimization.scripts;
        stylesOptimization = buildOptions.optimization.styles;
    }
    else {
        scriptsOptimization = stylesOptimization = false;
    }
    const config = {
        host: serveOptions.host,
        port: serveOptions.port,
        headers: { 'Access-Control-Allow-Origin': '*' },
        historyApiFallback: {
            index: buildOptions.index &&
                `${servePath}${path.basename(buildOptions.index)}`,
            disableDotRule: true,
            htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
        },
        onListening(server) {
            const isHttps = server.options.https || server.options.server?.type === 'https';
            devkit_1.logger.info(`NX Web Development Server is listening at ${isHttps ? 'https' : 'http'}://${server.options.host}:${server.options.port}${(0, serve_path_1.buildServePath)(buildOptions)}`);
        },
        open: serveOptions.open,
        static: false,
        compress: scriptsOptimization || stylesOptimization,
        devMiddleware: {
            publicPath: servePath,
            stats: false,
        },
        client: {
            webSocketURL: serveOptions.publicHost,
            overlay: {
                errors: !(scriptsOptimization || stylesOptimization),
                warnings: false,
            },
        },
        liveReload: serveOptions.hmr ? false : serveOptions.liveReload, // disable liveReload if hmr is enabled
        hot: serveOptions.hmr,
    };
    if (serveOptions.ssl) {
        config.server = {
            type: 'https',
        };
        if (serveOptions.sslKey && serveOptions.sslCert) {
            config.server.options = getSslConfig(root, serveOptions);
        }
    }
    if (serveOptions.proxyConfig) {
        config.proxy = getProxyConfig(root, serveOptions);
    }
    if (serveOptions.allowedHosts) {
        config.allowedHosts = serveOptions.allowedHosts.split(',');
    }
    return config;
}
function getSslConfig(root, options) {
    return {
        key: (0, fs_1.readFileSync)(path.resolve(root, options.sslKey), 'utf-8'),
        cert: (0, fs_1.readFileSync)(path.resolve(root, options.sslCert), 'utf-8'),
    };
}
function getProxyConfig(root, options) {
    const proxyPath = path.resolve(root, options.proxyConfig);
    return require(proxyPath);
}
