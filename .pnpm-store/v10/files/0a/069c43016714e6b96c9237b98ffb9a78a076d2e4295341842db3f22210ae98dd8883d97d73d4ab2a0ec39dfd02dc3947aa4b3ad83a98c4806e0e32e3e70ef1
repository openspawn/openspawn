"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNx = withNx;
const apply_base_config_1 = require("../plugins/nx-webpack-plugin/lib/apply-base-config");
const normalize_options_1 = require("../plugins/nx-webpack-plugin/lib/normalize-options");
const processed = new Set();
/**
 * @param {WithNxOptions} pluginOptions
 * @returns {NxWebpackPlugin}
 */
function withNx(pluginOptions = {}) {
    return function configure(config, { options, context }) {
        if (processed.has(config))
            return config;
        (0, apply_base_config_1.applyBaseConfig)({
            ...options,
            ...pluginOptions,
            target: options.target ?? 'web',
            assets: options.assets
                ? options.assets
                : pluginOptions.assets
                    ? (0, normalize_options_1.normalizeAssets)(pluginOptions.assets, options.root, options.sourceRoot, options.projectRoot)
                    : [],
            root: context.root,
            projectName: context.projectName,
            targetName: context.targetName,
            configurationName: context.configurationName,
            projectGraph: context.projectGraph,
        }, config);
        processed.add(config);
        return config;
    };
}
