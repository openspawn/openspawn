import { DirectiveNode } from "graphql";
import type { FederationVersion } from "../../specifications/federation.js";
import { ArgumentKind, Deprecated, Description, ListSize, ObjectType } from "../../subgraph/state.js";
import type { Key, MapByGraph, TypeBuilder } from "./common.js";
export declare function isRealExtension(meta: ObjectTypeStateInGraph, version: FederationVersion): boolean;
export declare function objectTypeBuilder(): TypeBuilder<ObjectType, ObjectTypeState>;
export type ObjectTypeState = {
    kind: "object";
    name: string;
    tags: Set<string>;
    inaccessible: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    cost: number | null;
    hasDefinition: boolean;
    byGraph: MapByGraph<ObjectTypeStateInGraph>;
    interfaces: Set<string>;
    fields: Map<string, ObjectTypeFieldState>;
    isEntity: boolean;
    description?: Description;
    ast: {
        directives: DirectiveNode[];
    };
};
export type ObjectTypeFieldState = {
    name: string;
    type: string;
    tags: Set<string>;
    inaccessible: boolean;
    isLeaf: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    cost: number | null;
    listSize: ListSize | null;
    usedAsKey: boolean;
    override: string | null;
    overrideLabel: string | null;
    byGraph: MapByGraph<FieldStateInGraph>;
    args: Map<string, ObjectTypeFieldArgState>;
    description?: Description;
    deprecated?: Deprecated;
    ast: {
        directives: DirectiveNode[];
    };
    internal: {
        seenNonExternal: boolean;
    };
};
export type ObjectTypeFieldArgState = {
    name: string;
    type: string;
    kind: ArgumentKind;
    tags: Set<string>;
    inaccessible: boolean;
    cost: number | null;
    defaultValue?: string;
    byGraph: MapByGraph<ArgStateInGraph>;
    description?: Description;
    deprecated?: Deprecated;
    ast: {
        directives: DirectiveNode[];
    };
};
export type ObjectTypeStateInGraph = {
    hasDefinition: boolean;
    extension: boolean;
    extensionType?: "@extends" | "extend";
    external: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    keys: Key[];
    interfaces: Set<string>;
    inaccessible: boolean;
    shareable: boolean;
    version: FederationVersion;
};
type FieldStateInGraph = {
    type: string;
    external: boolean;
    description: Description | null;
    inaccessible: boolean;
    used: boolean;
    override: string | null;
    overrideLabel: string | null;
    provides: string | null;
    requires: string | null;
    provided: boolean;
    required: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    shareable: boolean;
    usedAsKey: boolean;
    extension: boolean;
    version: FederationVersion;
};
type ArgStateInGraph = {
    type: string;
    kind: ArgumentKind;
    inaccessible: boolean;
    defaultValue?: string;
    version: FederationVersion;
};
export {};
//# sourceMappingURL=object-type.d.ts.map