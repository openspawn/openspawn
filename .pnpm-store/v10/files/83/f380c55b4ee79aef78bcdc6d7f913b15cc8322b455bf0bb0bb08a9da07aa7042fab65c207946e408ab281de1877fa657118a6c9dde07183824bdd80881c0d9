/*
    MIT License http://www.opensource.org/licenses/mit-license.php
    Author Tobias Koppers @sokra and Zackary Jackson @ScriptedAlchemy
*/
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = require("@module-federation/sdk");
const options_1 = require("../container/options");
const ConsumeSharedPlugin_1 = __importDefault(require("./ConsumeSharedPlugin"));
const ProvideSharedPlugin_1 = __importDefault(require("./ProvideSharedPlugin"));
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const utils_1 = require("../../utils");
const validate = (0, utils_1.createSchemaValidation)(
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('../../schemas/sharing/SharePlugin.check.js').validate, () => require('../../schemas/sharing/SharePlugin').default, {
    name: 'Share Plugin',
    baseDataPath: 'options',
});
class SharePlugin {
    constructor(options) {
        validate(options);
        const sharedOptions = (0, options_1.parseOptions)(options.shared, (item, key) => {
            if (typeof item !== 'string')
                throw new Error(`Unexpected array in shared configuration for key "${key}"`);
            const config = item === key || !(0, sdk_1.isRequiredVersion)(item)
                ? {
                    import: item,
                }
                : {
                    import: key,
                    requiredVersion: item,
                };
            return config;
        }, (item) => item);
        const consumes = sharedOptions.map(([key, options]) => ({
            [key]: {
                import: options.import,
                shareKey: options.shareKey || key,
                shareScope: options.shareScope,
                requiredVersion: options.requiredVersion,
                strictVersion: options.strictVersion,
                singleton: options.singleton,
                packageName: options.packageName,
                eager: options.eager,
                issuerLayer: options.issuerLayer,
                layer: options.layer,
                request: options.request || key,
                exclude: options.exclude,
                include: options.include,
                allowNodeModulesSuffixMatch: options.allowNodeModulesSuffixMatch,
            },
        }));
        const provides = sharedOptions
            .filter(([, options]) => options.import !== false)
            .map(([key, options]) => ({
            [options.import || key]: {
                shareKey: options.shareKey || key,
                shareScope: options.shareScope,
                version: options.version,
                eager: options.eager,
                requiredVersion: options.requiredVersion,
                strictVersion: options.strictVersion,
                singleton: options.singleton,
                layer: options.layer,
                request: options.request || options.import || key,
                exclude: options.exclude,
                include: options.include,
                allowNodeModulesSuffixMatch: options.allowNodeModulesSuffixMatch,
            },
        }));
        this._shareScope = options.shareScope || 'default';
        this._consumes = consumes;
        this._provides = provides;
    }
    /**
     * Applies the plugin to the webpack compiler instance
     * @param compiler - The webpack compiler instance
     */
    apply(compiler) {
        process.env['FEDERATION_WEBPACK_PATH'] =
            process.env['FEDERATION_WEBPACK_PATH'] || (0, normalize_webpack_path_1.getWebpackPath)(compiler);
        new ConsumeSharedPlugin_1.default({
            shareScope: this._shareScope,
            consumes: this._consumes,
        }).apply(compiler);
        new ProvideSharedPlugin_1.default({
            shareScope: this._shareScope,
            provides: this._provides,
        }).apply(compiler);
    }
}
exports.default = SharePlugin;
//# sourceMappingURL=SharePlugin.js.map