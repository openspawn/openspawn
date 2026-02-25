export type SearchMetrics = {
    quality: number;
    popularity: number;
    maintenance: number;
};
export type UnStable = {
    flags?: {
        unstable?: boolean;
    };
};
export type SearchItemPkg = {
    name: string;
    scoped?: string;
    path?: string;
    time?: number | Date;
};
type PrivatePackage = {
    verdaccioPrivate?: boolean;
    verdaccioPkgCached?: boolean;
};
export interface SearchItem extends UnStable, PrivatePackage {
    package: SearchItemPkg;
    score: Score;
}
export type Score = {
    final: number;
    detail: SearchMetrics;
};
export type SearchResults = {
    objects: SearchItemPkg[];
    total: number;
    time: string;
};
type PublisherMaintainer = {
    username: string;
    email: string;
};
export type SearchPackageBody = {
    name: string;
    scope: string;
    description: string;
    author: string | PublisherMaintainer;
    version: string;
    keywords: string | string[] | undefined;
    date: string;
    links?: {
        npm: string;
        homepage?: string;
        repository?: string;
        bugs?: string;
    };
    publisher?: any;
    maintainers?: PublisherMaintainer[];
};
export interface SearchPackageItem extends UnStable, PrivatePackage {
    package: SearchPackageBody;
    score: Score;
    searchScore?: number;
}
export declare const UNSCOPED = "unscoped";
export type SearchQuery = {
    text: string;
    size?: number;
    from?: number;
} & SearchMetrics;
export {};
