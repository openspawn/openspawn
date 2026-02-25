import type { DirectiveNode } from "graphql";
import { FederationVersion } from "../../specifications/federation.cjs";
import { Deprecated, Description, EnumType } from "../../subgraph/state.cjs";
import { type MapByGraph, type TypeBuilder } from "./common.cjs";
export declare function enumTypeBuilder(): TypeBuilder<EnumType, EnumTypeState>;
export type EnumTypeState = {
    kind: "enum";
    name: string;
    tags: Set<string>;
    inaccessible: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    cost: number | null;
    hasDefinition: boolean;
    description?: Description;
    byGraph: MapByGraph<EnumTypeStateInGraph>;
    referencedByInputType: boolean;
    referencedByOutputType: boolean;
    inputTypeReferences: Set<string>;
    outputTypeReferences: Set<string>;
    values: Map<string, EnumValueState>;
    ast: {
        directives: DirectiveNode[];
    };
};
type EnumValueState = {
    name: string;
    tags: Set<string>;
    inaccessible: boolean;
    deprecated?: Deprecated;
    description?: Description;
    ast: {
        directives: DirectiveNode[];
    };
    byGraph: MapByGraph<EnumValueStateInGraph>;
};
type EnumTypeStateInGraph = {
    inaccessible: boolean;
    version: FederationVersion;
};
type EnumValueStateInGraph = {
    inaccessible: boolean;
    version: FederationVersion;
};
export {};
//# sourceMappingURL=enum-type.d.ts.map