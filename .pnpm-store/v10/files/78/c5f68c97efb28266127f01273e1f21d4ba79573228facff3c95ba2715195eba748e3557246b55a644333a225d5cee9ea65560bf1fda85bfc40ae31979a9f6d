import { ConfigYaml } from '@verdaccio/types';
/**
 * Parse a config file from yaml to JSON.
 * @param configPath the absolute path of the configuration file
 */
export declare function parseConfigFile(configPath: string): ConfigYaml & {
    config_path: string;
    configPath: string;
};
export declare function fromJStoYAML(config: Partial<ConfigYaml>): string | null;
/**
 * Parses and returns a configuration object of type `ConfigYaml`.
 *
 * If a string or `undefined` is provided, it is interpreted as a path to a config file
 * (or uses a default location). The config file is then loaded and parsed.
 * If an object is provided, it is assumed to be a pre-parsed configuration.
 * Backward compability: ensures the returned configuration object has a `self_path` property set,
 * either to the config file path or to a property within the object.
 *
 * @param {string | ConfigYaml} [config] - Optional. A path to the configuration file (string),
 *                                         a pre-parsed config object, or `undefined`.
 * @returns {ConfigYaml} The parsed configuration object with a guaranteed `self_path` property.
 * @throws {Error} If the provided config is neither a string, undefined, nor an object.
 */
export declare function getConfigParsed(config?: string | ConfigYaml): ConfigYaml;
