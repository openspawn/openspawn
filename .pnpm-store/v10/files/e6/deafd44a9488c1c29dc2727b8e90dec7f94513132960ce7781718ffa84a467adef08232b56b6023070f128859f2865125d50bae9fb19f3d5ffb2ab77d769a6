import { DirectiveNode } from "graphql";
import { FederationVersion } from "../../specifications/federation.cjs";
import { Description, ScalarType } from "../../subgraph/state.cjs";
import { MapByGraph, TypeBuilder } from "./common.cjs";
export declare function scalarTypeBuilder(): TypeBuilder<ScalarType, ScalarTypeState>;
export type ScalarTypeState = {
    kind: "scalar";
    name: string;
    tags: Set<string>;
    inaccessible: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    cost: number | null;
    byGraph: MapByGraph<ScalarTypeStateInGraph>;
    description?: Description;
    specifiedBy?: string;
    ast: {
        directives: DirectiveNode[];
    };
};
type ScalarTypeStateInGraph = {
    inaccessible: boolean;
    version: FederationVersion;
};
export {};
//# sourceMappingURL=scalar-type.d.ts.map