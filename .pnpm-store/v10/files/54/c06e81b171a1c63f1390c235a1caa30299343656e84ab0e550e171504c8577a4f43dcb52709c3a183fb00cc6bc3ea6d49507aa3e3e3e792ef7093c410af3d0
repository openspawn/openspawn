import type { Compiler } from 'webpack';
import type { ProvideSharedPluginOptions, ProvidesConfig } from '../../declarations/plugins/sharing/ProvideSharedPlugin';
export type ResolvedProvideMap = Map<string, {
    config: ProvidesConfig;
    version: string | undefined | false;
    resource?: string;
    layer?: string;
}>;
/**
 * @typedef {Object} ProvideOptions
 * @property {string} shareKey
 * @property {string | string[]} shareScope
 * @property {string | undefined | false} version
 * @property {boolean} eager
 * @property {string} [request] The actual request to use for importing the module
 * @property {{ version?: string; request?: string | RegExp; fallbackVersion?: string }} [exclude] Options for excluding certain versions or requests
 * @property {{ version?: string; request?: string | RegExp; fallbackVersion?: string }} [include] Options for including only certain versions or requests
 */
/** @typedef {Map<string, { config: ProvideOptions, version: string | undefined | false }>} ResolvedProvideMap */
declare class ProvideSharedPlugin {
    private _provides;
    /**
     * @param {ProvideSharedPluginOptions} options options
     */
    constructor(options: ProvideSharedPluginOptions);
    /**
     * Apply the plugin
     * @param {Compiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler: Compiler): void;
    private provideSharedModule;
    private shouldProvideSharedModule;
}
export default ProvideSharedPlugin;
