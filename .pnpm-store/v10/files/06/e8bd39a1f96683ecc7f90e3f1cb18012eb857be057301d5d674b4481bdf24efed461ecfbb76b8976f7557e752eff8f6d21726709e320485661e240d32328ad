import { Author, Manifest, Package } from '@verdaccio/types';
export type AuthorAvatar = Author & {
    avatar?: string;
};
/**
 * From normalize-package-data/lib/fixer.js
 * @param {*} name  the package name
 * @return {Boolean} whether is valid or not
 * @deprecated
 */
export declare function validateName(name: string): boolean;
/**
 * Validate a package.
 * @return {Boolean} whether the package is valid or not
 * @deprecated
 */
export declare function validatePackage(name: string): boolean;
/**
 * Check whether an element is an Object
 * @param {*} obj the element
 * @return {Boolean}
 * @deprecated
 */
export declare function isObject(obj: any): boolean;
export declare function getLatestVersion(pkgInfo: Package): string;
export declare function buildToken(type: string, token: string): string;
export type AuthorFormat = Author | string | null | void;
/**
 * Formats author field for webui.
 * @see https://docs.npmjs.com/files/package.json#author
 * @param {string|object|undefined} author
 * @deprecated use @verdaccio/web
 */
export declare function formatAuthor(author: AuthorFormat): any;
/**
 * Apply whitespaces based on the length
 * @param {*} str the log message
 * @return {String}
 */
export declare function pad(str: any, max: any): string;
/**
 * return a masquerade string with its first and last {charNum} and three dots in between.
 * @param {String} str
 * @param {Number} charNum
 * @returns {String}
 */
export declare function mask(str: string, charNum?: number): string;
export declare function hasDiffOneKey(versions: any): boolean;
export declare function isVersionValid(packageMeta: any, packageVersion: any): boolean;
export declare function addGravatarSupport(pkgInfo: Manifest, online?: boolean): AuthorAvatar;
export declare const GENERIC_AVATAR: string;
/**
 * Generate gravatar url from email address
 * @deprecated use @verdaccio/web
 */
export declare function generateGravatarUrl(email?: string | void, online?: boolean): string;
export declare function normalizeContributors(contributors: Author[]): Author[];
export declare function deleteProperties(propertiesToDelete: string[], objectItem: any): any;
