import { AbbreviatedManifest, Manifest, Version } from '@verdaccio/types';
import LocalStorage from './local-storage';
export declare function generatePackageTemplate(name: string): Manifest;
/**
 * Normalize package properties, tags, revision id.
 * @param {Object} pkg package reference.
 */
export declare function normalizePackage(pkg: Manifest): Manifest;
export declare function generateRevision(rev: string): string;
export declare function getLatestReadme(pkg: Manifest): string;
export declare function cleanUpReadme(version: Version): Version;
export declare const WHITELIST: string[];
export declare function cleanUpLinksRef(keepUpLinkData: boolean, result: Manifest): Manifest;
/**
 * Check whether a package it is already a local package
 * @param {*} name
 * @param {*} localStorage
 */
export declare function checkPackageLocal(name: string, localStorage: LocalStorage): Promise<void>;
export declare function publishPackage(name: string, metadata: any, localStorage: LocalStorage): Promise<void>;
export declare function checkPackageRemote(name: string, isAllowPublishOffline: boolean, syncMetadata: any): Promise<void>;
export declare function mergeUplinkTimeIntoLocal(cacheManifest: Manifest, remoteManifest: Manifest): any;
export declare function prepareSearchPackage(data: Manifest, time: unknown): any;
/**
 * Check whether the package metadta has enough data to be published
 * @param pkg metadata
 */
export declare function isPublishablePackage(pkg: Manifest): boolean;
export declare function hasInstallScript(version: Version): boolean;
export declare function convertAbbreviatedManifest(manifest: Manifest): AbbreviatedManifest;
