import { DocumentNode, GraphQLError } from "graphql";
import { FederationVersion } from "../../specifications/federation.js";
import { LinkImport } from "../../specifications/link.js";
import { SubgraphStateBuilder } from "../state.js";
export declare function assertUniqueSubgraphNames(subgraphs: ReadonlyArray<{
    name: string;
}>): asserts subgraphs is Array<{
    name: string;
}>;
export declare function validateSubgraphCore(subgraph: {
    name: string;
    typeDefs: DocumentNode;
}): {
    errors: GraphQLError[];
    links?: undefined;
} | {
    links: {
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
    errors?: undefined;
};
export declare function validateSubgraph(subgraph: {
    name: string;
    typeDefs: DocumentNode;
    id: string;
}, stateBuilder: SubgraphStateBuilder, federation: {
    version: FederationVersion;
    imports: readonly LinkImport[];
}, __internal?: {
    disableValidationRules?: string[];
}): GraphQLError[];
//# sourceMappingURL=validate-subgraph.d.ts.map