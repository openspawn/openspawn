"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webpackInitGenerator = exports.NxTsconfigPathsWebpackPlugin = exports.NxWebpackPlugin = exports.webpackProjectGenerator = exports.useLegacyNxPlugin = exports.configurationGenerator = void 0;
exports.convertConfigToWebpackPluginGenerator = convertConfigToWebpackPluginGenerator;
const tslib_1 = require("tslib");
const configuration_1 = require("./src/generators/configuration/configuration");
Object.defineProperty(exports, "configurationGenerator", { enumerable: true, get: function () { return configuration_1.configurationGenerator; } });
const nx_app_webpack_plugin_1 = require("./src/plugins/nx-webpack-plugin/nx-app-webpack-plugin");
const nx_tsconfig_paths_webpack_plugin_1 = require("./src/plugins/nx-typescript-webpack-plugin/nx-tsconfig-paths-webpack-plugin");
const use_legacy_nx_plugin_1 = require("./src/plugins/use-legacy-nx-plugin/use-legacy-nx-plugin");
Object.defineProperty(exports, "useLegacyNxPlugin", { enumerable: true, get: function () { return use_legacy_nx_plugin_1.useLegacyNxPlugin; } });
// Lazy-loaded to avoid requiring typescript before it's installed.
// Other generators may import this index before typescript is available.
// This generator imports @phenomnomnominal/tsquery which requires typescript.
// Note: This seems to only affect yarn v1.
function convertConfigToWebpackPluginGenerator(...args) {
    return require('./src/generators/convert-config-to-webpack-plugin/convert-config-to-webpack-plugin').convertConfigToWebpackPluginGenerator(...args);
}
// Exported for backwards compatibility in case a plugin is using the old name.
/** @deprecated Use `configurationGenerator` instead. */
exports.webpackProjectGenerator = configuration_1.configurationGenerator;
/** @deprecated Use NxAppWebpackPlugin from `@nx/webpack/app-plugin` instead, which can improve graph creation by 150-200ms per file. */
exports.NxWebpackPlugin = nx_app_webpack_plugin_1.NxAppWebpackPlugin;
/** @deprecated Use NxTsconfigPathsWebpackPlugin from `@nx/webpack/tsconfig-paths-plugin` instead. */
exports.NxTsconfigPathsWebpackPlugin = nx_tsconfig_paths_webpack_plugin_1.NxTsconfigPathsWebpackPlugin;
tslib_1.__exportStar(require("./src/utils/create-copy-plugin"), exports);
tslib_1.__exportStar(require("./src/utils/config"), exports);
var init_1 = require("./src/generators/init/init");
Object.defineProperty(exports, "webpackInitGenerator", { enumerable: true, get: function () { return init_1.webpackInitGenerator; } });
tslib_1.__exportStar(require("./src/executors/dev-server/dev-server.impl"), exports);
tslib_1.__exportStar(require("./src/executors/webpack/lib/normalize-options"), exports);
tslib_1.__exportStar(require("./src/executors/webpack/webpack.impl"), exports);
tslib_1.__exportStar(require("./src/utils/get-css-module-local-ident"), exports);
tslib_1.__exportStar(require("./src/utils/with-nx"), exports);
tslib_1.__exportStar(require("./src/utils/with-web"), exports);
tslib_1.__exportStar(require("./src/utils/e2e-web-server-info-utils"), exports);
