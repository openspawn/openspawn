import { parseConfigFile } from '@verdaccio/config';
import { errorUtils, validationUtils } from '@verdaccio/core';
import { ConfigYaml, StringValue } from '@verdaccio/types';
import { Config, Manifest, Version } from '@verdaccio/types';
import { buildToken as buildTokenUtil } from '@verdaccio/utils';
export declare function initLogger(logConfig: ConfigYaml): void;
export declare function addScope(scope: string, packageName: string): string;
/**
 * Check whether an element is an Object
 * @param {*} obj the element
 * @return {Boolean}
 */
export declare const isObject: typeof validationUtils.isObject;
/**
 * @deprecated not used un v6
 */
export declare function isObjectOrArray(obj: any): boolean;
export declare function tagVersion(data: Manifest, version: string, tag: StringValue): boolean;
/**
 * Gets version from a package object taking into account semver weirdness.
 * @return {String} return the semantic version of a package
 */
export declare function getVersion(pkg: Manifest, version: any): Version | void;
/**
 * Flatten arrays of tags.
 * @param {*} data
 */
export declare function normalizeDistTags(pkg: Manifest): void;
/**
 * Parse an internal string to number
 * @param {*} interval
 * @return {Number}
 */
export declare function parseInterval(interval: any): number;
export declare const ErrorCode: {
    getConflict: typeof errorUtils.getConflict;
    getBadData: typeof errorUtils.getBadData;
    getBadRequest: typeof errorUtils.getBadRequest;
    getInternalError: typeof errorUtils.getInternalError;
    getUnauthorized: typeof errorUtils.getUnauthorized;
    getForbidden: typeof errorUtils.getForbidden;
    getServiceUnavailable: typeof errorUtils.getServiceUnavailable;
    getNotFound: typeof errorUtils.getNotFound;
    getCode: typeof errorUtils.getCode;
};
export declare function sortByName(packages: any[], orderAscending?: boolean | void): string[];
export declare function deleteProperties(propertiesToDelete: string[], objectItem: any): any;
/**
 * parse package readme - markdown/ascii
 * @param {String} packageName name of package
 * @param {String} readme package readme

 * @return {String} converted html template
 */
export declare function parseReadme(packageName: string, readme: string): string | void;
export declare function encodeScopedUri(packageName: any): string;
export declare function hasDiffOneKey(versions: any): boolean;
export declare function isVersionValid(packageMeta: any, packageVersion: any): boolean;
export declare function isRelatedToDeprecation(pkgInfo: Manifest): boolean;
export declare const resolveConfigPath: (storageLocation: string, file: string) => string;
export declare function logHTTPSWarning(storageLocation: any): void;
export declare function hasLogin(config: Config): boolean;
export { buildTokenUtil as buildToken, parseConfigFile };
