"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWebpackDevServer = runWebpackDevServer;
const rxjs_1 = require("rxjs");
function runWebpackDevServer(config, webpack, WebpackDevServer) {
    return new rxjs_1.Observable((subscriber) => {
        const webpackCompiler = webpack(config);
        let baseUrl;
        webpackCompiler.hooks.done.tap('build-webpack', (stats) => {
            subscriber.next({ stats, baseUrl });
        });
        const devServerConfig = config.devServer || {};
        const originalOnListen = devServerConfig.onListening;
        devServerConfig.onListening = function (server) {
            if (typeof originalOnListen === 'function') {
                originalOnListen(server);
            }
            const devServerOptions = server.options;
            baseUrl = `${server.options.https ? 'https' : 'http'}://${server.options.host}:${server.options.port}${devServerOptions.devMiddleware.publicPath}`;
        };
        const webpackServer = new WebpackDevServer(devServerConfig, webpackCompiler);
        try {
            webpackServer.start().catch((err) => subscriber.error(err));
            return () => webpackServer.stop();
        }
        catch (e) {
            throw new Error('Could not start start dev server');
        }
    });
}
