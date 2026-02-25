import { Manifest, Version } from '@verdaccio/types';
import { RequestOptions } from '@verdaccio/url';
/**
 * Iterate a packages's versions and filter each original tarball url.
 * @param {*} pkg
 * @param {*} request
 * @param {*} urlPrefix
 * @return {String} a filtered package
 */
export declare function convertDistRemoteToLocalTarballUrls(pkg: Manifest, request: RequestOptions, urlPrefix: string | void): Manifest;
/**
 * Convert single Version disst tarball
 * @param name
 * @param version
 * @param request
 * @param urlPrefix
 * @returns
 */
export declare function convertDistVersionToLocalTarballsUrl(name: string, version: Version, request: RequestOptions, urlPrefix: string | void): Version;
