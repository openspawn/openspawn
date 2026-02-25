import type { DirectiveNode } from "graphql";
import { FederationVersion } from "../../specifications/federation.cjs";
import { Description, UnionType } from "../../subgraph/state.cjs";
import { type MapByGraph, type TypeBuilder } from "./common.cjs";
export declare function unionTypeBuilder(): TypeBuilder<UnionType, UnionTypeState>;
export type UnionTypeState = {
    kind: "union";
    name: string;
    tags: Set<string>;
    hasDefinition: boolean;
    description?: Description;
    inaccessible: boolean;
    byGraph: MapByGraph<UnionTypeInGraph>;
    members: Set<string>;
    ast: {
        directives: DirectiveNode[];
    };
};
type UnionTypeInGraph = {
    members: Set<string>;
    version: FederationVersion;
};
export {};
//# sourceMappingURL=union-type.d.ts.map