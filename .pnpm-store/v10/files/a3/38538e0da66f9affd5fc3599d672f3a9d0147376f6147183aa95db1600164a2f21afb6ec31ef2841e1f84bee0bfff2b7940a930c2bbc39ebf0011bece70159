import { pluginUtils } from '@verdaccio/core';
export type PluginType<T> = T extends pluginUtils.Plugin<T> ? T : never;
export declare function isValid<T>(plugin: PluginType<T>): boolean;
export declare function isES6<T>(plugin: PluginType<T>): boolean;
/**
 * Requires a module.
 * @param {*} path the module's path
 * @return {Object}
 */
export declare function tryLoad<T>(path: string, onError: any): PluginType<T> | null;
