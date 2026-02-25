import { DirectiveDefinitionNode, TypeDefinitionNode } from "graphql";
import { Link } from "../specifications/link.js";
import { SubgraphState } from "../subgraph/state.js";
import { DirectiveState } from "./composition/directive.js";
import { EnumTypeState } from "./composition/enum-type.js";
import { InputObjectTypeState } from "./composition/input-object-type.js";
import { InterfaceTypeState } from "./composition/interface-type.js";
import { ObjectTypeState } from "./composition/object-type.js";
import { ScalarTypeState } from "./composition/scalar-type.js";
import { UnionTypeState } from "./composition/union-type.js";
export type SupergraphState = {
    subgraphs: Map<string, SubgraphState>;
    scalarTypes: Map<string, ScalarTypeState>;
    objectTypes: Map<string, ObjectTypeState>;
    interfaceTypes: Map<string, InterfaceTypeState>;
    unionTypes: Map<string, UnionTypeState>;
    enumTypes: Map<string, EnumTypeState>;
    inputObjectTypes: Map<string, InputObjectTypeState>;
    directives: Map<string, DirectiveState>;
    links: Array<Link & {
        graph: string;
    }>;
    specs: {
        tag: boolean;
        cost: {
            used: boolean;
            names: {
                cost: string | null;
                listSize: string | null;
            };
        };
        inaccessible: boolean;
        authenticated: boolean;
        requiresScopes: boolean;
        policy: boolean;
    };
};
export type SupergraphStateBuilder = ReturnType<typeof createSupergraphStateBuilder>;
export declare function createSupergraphStateBuilder(): {
    addSubgraph(subgraph: SubgraphState): void;
    getGraph(id: string): SubgraphState | undefined;
    composeSupergraphState(): void;
    visitSubgraphState(subgraphState: SubgraphState): void;
    getSupergraphState(): SupergraphState;
    getSubgraphState(graphId: string): SubgraphState | undefined;
    links(): readonly {
        name: string | null;
        version: string | null;
        identity: string;
        imports: ({
            readonly kind: "type" | "directive";
            readonly name: string;
            readonly alias?: undefined;
        } | {
            readonly kind: "type" | "directive";
            readonly name: string;
            readonly alias: string;
        })[];
    }[];
    build(): (DirectiveDefinitionNode | TypeDefinitionNode)[];
};
//# sourceMappingURL=state.d.ts.map