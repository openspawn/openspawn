import { DocumentNode, GraphQLError } from "graphql";
export declare function validateSubgraph(subgraph: {
    name: string;
    url?: string;
    typeDefs: DocumentNode;
}): GraphQLError[];
export declare function validate(subgraphs: ReadonlyArray<{
    name: string;
    url?: string;
    typeDefs: DocumentNode;
}>, __internal?: {
    disableValidationRules?: string[];
}): {
    readonly success: false;
    readonly errors: GraphQLError[];
    readonly supergraph?: undefined;
    links?: undefined;
    readonly specs?: undefined;
    readonly federationVersion?: undefined;
} | {
    readonly success: true;
    readonly supergraph: (import("graphql").DirectiveDefinitionNode | import("graphql").TypeDefinitionNode)[];
    readonly links: readonly {
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
    readonly specs: {
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
    readonly federationVersion: "v1.0" | "v2.0" | "v2.1" | "v2.2" | "v2.3" | "v2.4" | "v2.5" | "v2.6" | "v2.7" | "v2.8" | "v2.9";
    errors?: undefined;
};
//# sourceMappingURL=validate.d.ts.map