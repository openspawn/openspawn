import type { ConstDirectiveNode, DirectiveDefinitionNode, DirectiveNode, TypeDefinitionNode } from "graphql";
import type { FederationVersion } from "../../specifications/federation.cjs";
import { SubgraphState } from "../../subgraph/state.cjs";
import type { SupergraphState } from "../state.cjs";
export type MapByGraph<T> = Map<string, T>;
export interface Key {
    fields: string;
    resolvable: boolean;
}
export interface Graph {
    name: string;
    id: string;
    version: FederationVersion;
    url?: string;
}
export interface TypeBuilder<T, S> {
    visitSubgraphState(graph: Graph, state: Map<string, S>, typeName: string, type: T): void;
    composeSupergraphState?(type: S, graphMap: Map<string, SubgraphState>, helpers: {
        graphNameToId(graphName: string): string | null;
        supergraphState: SupergraphState;
    }): void;
    composeSupergraphNode(type: S, graphMap: Map<string, SubgraphState>, helpers: {
        graphNameToId(graphName: string): string | null;
        supergraphState: SupergraphState;
    }): TypeDefinitionNode | DirectiveDefinitionNode;
}
export declare function convertToConst(nodes: DirectiveNode[]): ConstDirectiveNode[];
//# sourceMappingURL=common.d.ts.map