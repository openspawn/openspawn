import { Router } from 'express';
import { Config } from '@verdaccio/types';
import Auth from '../../../lib/auth';
import Storage from '../../../lib/storage';
import { $NextFunctionVer, $RequestExtend, $ResponseExtend } from '../../../types';
export default function publish(router: Router, auth: Auth, storage: Storage, config: Config): void;
/**
 * Publish a package
 */
export declare function publishPackage(storage: Storage, config: Config, auth: Auth): any;
/**
 * un-publish a package
 */
export declare function unPublishPackage(storage: Storage): (req: $RequestExtend, res: $ResponseExtend, next: $NextFunctionVer) => void;
/**
 * Delete tarball
 */
export declare function removeTarball(storage: Storage): (req: $RequestExtend, res: $ResponseExtend, next: $NextFunctionVer) => void;
/**
 * Adds a new version
 */
export declare function addVersion(storage: Storage): (req: $RequestExtend, res: $ResponseExtend, next: $NextFunctionVer) => void;
/**
 * uploadPackageTarball
 */
export declare function uploadPackageTarball(storage: Storage): (req: $RequestExtend, res: $ResponseExtend, next: $NextFunctionVer) => void;
