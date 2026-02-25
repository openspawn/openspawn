import { pluginUtils } from '@verdaccio/core';
import { PluginType } from './utils';
/**
 * The plugin loader find recursively plugins, if one plugin fails is ignored and report the error to the logger.
 *
 * The loader follows the order:
 * - If the at the `config.yaml` file the  `plugins: ./plugins` is defined
 *   - If is absolute will use the provided path
 *   - If is relative, will use the base path of the config file. eg: /root/config.yaml the plugins folder should be
 *     hosted at /root/plugins
 * - The next step is find at the node_modules or global based on the `require` native algorithm.
 * - If the package is scoped eg: @scope/foo, try to load the package `@scope/foo`
 * - If the package is not scoped, will use the default prefix: verdaccio-foo ("verdaccio-theme-" prefix for theme ui plugins).
 * - If a custom prefix is provided, the verdaccio- is replaced by the config.server.pluginPrefix.
 *
 * The `sanityCheck` is the validation for the required methods to load the plugin, if the validation fails the plugin won't be loaded.
 * The `params` is an object that contains the global configuration and the logger.
 *
 * @param {*} pluginConfigs the custom plugin section
 * @param {*} pluginOptions a set of options to initialize the plugin
 * @param {*} sanityCheck callback that check the shape that should fulfill the plugin
 * @param {*} prefix by default is verdaccio but can be override with config.server.pluginPrefix
 * @param {*} pluginCategory the category of the plugin, eg: auth, storage, middleware
 * @return {Array} list of plugins
 */
export declare function asyncLoadPlugin<T extends pluginUtils.Plugin<T>>(pluginConfigs: any, pluginOptions: pluginUtils.PluginOptions, sanityCheck: (plugin: PluginType<T>) => boolean, legacyMergeConfigs?: boolean, prefix?: string, pluginCategory?: string): Promise<PluginType<T>[]>;
export declare function executePlugin<T>(plugin: PluginType<T>, pluginConfig: unknown, pluginOptions: pluginUtils.PluginOptions, legacyMergeConfigs?: boolean): PluginType<T>;
