import { DirectiveDefinitionNode, DocumentNode, TypeDefinitionNode } from "graphql";
import { Link, LinkImport } from "./link.cjs";
export type FederationVersion = keyof typeof federationSpecFactory;
export type FederationImports = readonly LinkImport[];
export declare function isFederationVersion(version: string): version is FederationVersion;
export declare function createSpecSchema<T extends FederationVersion & string>(version: T, imports?: readonly LinkImport[]): {
    directives: DirectiveDefinitionNode[];
    types: TypeDefinitionNode[];
};
declare const federationSpecFactory: {
    "v1.0": (prefix: string) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.0": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.1": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.2": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.3": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.4": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.5": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.6": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.7": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.8": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
    "v2.9": (prefix: string, imports?: readonly LinkImport[]) => {
        directives: DirectiveDefinitionNode[];
        types: TypeDefinitionNode[];
    };
};
export declare function getLatestFederationVersion(): FederationVersion;
export declare function isFederationLink(link: Link): boolean;
export declare function detectFederationVersion(typeDefs: DocumentNode): {
    version: FederationVersion;
    imports: ({
        readonly kind: "type" | "directive";
        readonly name: string;
        readonly alias?: undefined;
    } | {
        readonly kind: "type" | "directive";
        readonly name: string;
        readonly alias: string;
    })[];
};
export {};
//# sourceMappingURL=federation.d.ts.map