import type { DocumentNode } from "graphql";
import { FederatedLink } from "./link.js";
export declare const FEDERATION_V1: unique symbol;
export type LinkVersion = string | {
    major: number;
    minor: number;
} | null | typeof FEDERATION_V1;
export declare function extractLinkImplementations(typeDefs: DocumentNode): {
    links: FederatedLink[];
    resolveImportName: (identity: string, name: string) => string;
    matchesImplementation: (identity: string, version: LinkVersion) => boolean;
};
//# sourceMappingURL=index.d.ts.map