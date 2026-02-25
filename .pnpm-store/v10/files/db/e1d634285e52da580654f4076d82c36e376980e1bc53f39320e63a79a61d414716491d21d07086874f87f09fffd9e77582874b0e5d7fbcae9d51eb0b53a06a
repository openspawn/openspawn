import { DirectiveNode } from "graphql";
import { FederationVersion } from "../../specifications/federation.cjs";
import { ArgumentKind, Deprecated, Description, InterfaceType, ListSize } from "../../subgraph/state.cjs";
import type { Key, MapByGraph, TypeBuilder } from "./common.cjs";
export declare function interfaceTypeBuilder(): TypeBuilder<InterfaceType, InterfaceTypeState>;
export type InterfaceTypeState = {
    kind: "interface";
    name: string;
    tags: Set<string>;
    inaccessible: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    hasDefinition: boolean;
    description?: Description;
    byGraph: MapByGraph<InterfaceTypeInGraph>;
    interfaces: Set<string>;
    implementedBy: Set<string>;
    fields: Map<string, InterfaceTypeFieldState>;
    hasInterfaceObject: boolean;
    isEntity: boolean;
    ast: {
        directives: DirectiveNode[];
    };
};
export type InterfaceTypeFieldState = {
    name: string;
    type: string;
    isLeaf: boolean;
    tags: Set<string>;
    inaccessible: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    cost: number | null;
    listSize: ListSize | null;
    deprecated?: Deprecated;
    description?: Description;
    usedAsKey: boolean;
    byGraph: MapByGraph<FieldStateInGraph>;
    args: Map<string, InterfaceTypeFieldArgState>;
    ast: {
        directives: DirectiveNode[];
    };
};
export type InterfaceTypeFieldArgState = {
    name: string;
    type: string;
    kind: ArgumentKind;
    tags: Set<string>;
    defaultValue?: string;
    cost: number | null;
    description?: Description;
    deprecated?: Deprecated;
    byGraph: MapByGraph<ArgStateInGraph>;
    ast: {
        directives: DirectiveNode[];
    };
};
type InterfaceTypeInGraph = {
    extension: boolean;
    keys: Key[];
    interfaces: Set<string>;
    implementedBy: Set<string>;
    isInterfaceObject: boolean;
    version: FederationVersion;
};
type FieldStateInGraph = {
    type: string;
    override: string | null;
    overrideLabel: string | null;
    provides: string | null;
    shareable: boolean;
    usedAsKey: boolean;
    external: boolean;
    requires: string | null;
    version: FederationVersion;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
};
type ArgStateInGraph = {
    type: string;
    kind: ArgumentKind;
    defaultValue?: string;
    version: FederationVersion;
};
export {};
//# sourceMappingURL=interface-type.d.ts.map