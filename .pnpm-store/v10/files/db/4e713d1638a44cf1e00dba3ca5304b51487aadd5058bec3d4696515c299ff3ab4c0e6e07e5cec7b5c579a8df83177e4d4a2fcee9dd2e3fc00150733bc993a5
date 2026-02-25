import type { ConsumeOptions } from '../../declarations/plugins/sharing/ConsumeSharedModule';
import type { InputFileSystem } from 'webpack/lib/util/fs';
import type { Compilation } from 'webpack';
/**
 * @see https://docs.npmjs.com/cli/v7/configuring-npm/package-json#urls-as-dependencies
 * @param {string} versionDesc version to be normalized
 * @returns {string} normalized version
 */
declare function normalizeVersion(versionDesc: string): string;
export { normalizeVersion };
/** @typedef {{ data: Record<string, any>, path: string }} DescriptionFile */
interface DescriptionFile {
    data: Record<string, any>;
    path: string;
}
/**
 *
 * @param {InputFileSystem} fs file system
 * @param {string} directory directory to start looking into
 * @param {string[]} descriptionFiles possible description filenames
 * @param {function((Error | null)=, {data?: DescriptionFile, path?: string}=, (checkedDescriptionFilePaths: string[])=): void} callback callback
 * @param {function({data: DescriptionFile}=): boolean} satisfiesDescriptionFileData file data compliance check
 * @param {Set<string>} [checkedFilePaths] optional set to track checked file paths
 */
declare function getDescriptionFile(fs: InputFileSystem, directory: string, descriptionFiles: string[], callback: (err: Error | null, data?: DescriptionFile, checkedDescriptionFilePaths?: string[]) => void, satisfiesDescriptionFileData?: (data?: DescriptionFile) => boolean, checkedFilePaths?: Set<string>): void;
export { getDescriptionFile };
/**
 * Get required version from description file
 * @param {Record<string, any>} data - The data object
 * @param {string} packageName - The package name
 * @returns {string | undefined} The normalized version
 */
export declare function getRequiredVersionFromDescriptionFile(data: Record<string, any>, packageName: string): string | undefined | void;
export declare function normalizeConsumeShareOptions(consumeOptions: ConsumeOptions): {
    shareConfig: {
        fixedDependencies: boolean;
        requiredVersion: false | import("webpack/lib/util/semver").SemVerRange;
        strictVersion: boolean;
        singleton: boolean;
        eager: boolean;
        layer: string | null | undefined;
    };
    shareScope: string | string[];
    shareKey: string;
};
export declare function addSingletonFilterWarning(compilation: Compilation, shareKey: string, // The shareKey or a relevant identifier for the shared module
filterType: 'include' | 'exclude', filterProperty: 'request' | 'version', filterValue: string | RegExp, moduleRequest: string, // original request that led to this shared module
moduleResource?: string): void;
export declare function testRequestFilters(remainder: string, includeRequest?: string | RegExp, excludeRequest?: string | RegExp): boolean;
export declare function createLookupKeyForSharing(request: string, layer?: string | null): string;
export declare function extractPathAfterNodeModules(filePath: string): string | null;
