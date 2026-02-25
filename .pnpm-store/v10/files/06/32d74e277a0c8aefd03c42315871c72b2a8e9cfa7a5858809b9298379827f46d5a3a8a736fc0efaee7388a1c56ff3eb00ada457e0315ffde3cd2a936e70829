/// <reference types="node" />
import { PackageAccess, PackageList } from '@verdaccio/types';
export interface CookieSessionToken {
    expires: Date;
}
export declare function createSessionToken(): CookieSessionToken;
export declare function getAuthenticatedMessage(user: string): string;
export declare function buildUserBuffer(name: string, password: string): Buffer;
export declare function buildToken(type: string, token: string): string;
export declare function getMatchedPackagesSpec(pkgName: string, packages: PackageList): PackageAccess | void;
