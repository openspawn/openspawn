import { DirectiveNode } from "graphql";
import { FederationVersion } from "../../specifications/federation.cjs";
import type { ArgumentKind, Directive } from "../../subgraph/state.cjs";
import { MapByGraph, TypeBuilder } from "./common.cjs";
export declare function directiveBuilder(): TypeBuilder<Directive, DirectiveState>;
export type DirectiveState = {
    kind: "directive";
    name: string;
    byGraph: MapByGraph<DirectiveStateInGraph>;
    isExecutable: boolean;
    composed: boolean;
    locations: Set<string>;
    repeatable: boolean;
    args: Map<string, DirectiveArgState>;
};
type DirectiveStateInGraph = {
    locations: Set<string>;
    repeatable: boolean;
    version: FederationVersion;
};
export type DirectiveArgState = {
    name: string;
    type: string;
    kind: ArgumentKind;
    tags: Set<string>;
    inaccessible: boolean;
    defaultValue?: string;
    byGraph: MapByGraph<ArgStateInGraph>;
    ast: {
        directives: DirectiveNode[];
    };
};
type ArgStateInGraph = {
    type: string;
    kind: ArgumentKind;
    defaultValue?: string;
    version: FederationVersion;
};
export declare function isArgumentTypeIdenticalInEverySubgraph(directiveArgState: DirectiveArgState, totalSubgraphSize: number): boolean;
export {};
//# sourceMappingURL=directive.d.ts.map