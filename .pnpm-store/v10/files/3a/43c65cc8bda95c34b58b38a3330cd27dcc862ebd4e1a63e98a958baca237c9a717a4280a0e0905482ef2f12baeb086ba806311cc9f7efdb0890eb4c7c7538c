import { Manifest } from '@verdaccio/types';
/**
 * Function filters out bad semver versions and sorts the array.
 * @return {Array} sorted Array
 */
export declare function semverSort(listVersions: string[]): string[];
/**
 * Sanitize a version string to a valid semver version.
 * @param version - The version string to sanitize.
 * @returns The sanitized version string.
 */
export declare function semverSanitize(version: string): string;
/**
 * Get the latest publihsed version of a package.
 * @param package metadata
 **/
export declare function getLatest(pkg: Manifest): string;
/**
 * Function gets a local info and an info from uplinks and tries to merge it
 exported for unit tests only.
  * @param {*} local
  * @param {*} upstream
  * @param {*} config sds
  * @deprecated use @verdaccio/storage mergeVersions method
  */
export declare function mergeVersions(local: Manifest, upstream: Manifest): void;
