"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWeb = withWeb;
const apply_web_config_1 = require("../plugins/nx-webpack-plugin/lib/apply-web-config");
const processed = new Set();
/**
 * @param {WithWebOptions} pluginOptions
 * @returns {NxWebpackPlugin}
 */
function withWeb(pluginOptions = {}) {
    return function configure(config, { options, context }) {
        if (processed.has(config))
            return config;
        (0, apply_web_config_1.applyWebConfig)({
            ...options,
            ...pluginOptions,
            projectName: context.projectName,
            targetName: context.targetName,
            configurationName: context.configurationName,
            projectGraph: context.projectGraph,
        }, config);
        processed.add(config);
        return config;
    };
}
