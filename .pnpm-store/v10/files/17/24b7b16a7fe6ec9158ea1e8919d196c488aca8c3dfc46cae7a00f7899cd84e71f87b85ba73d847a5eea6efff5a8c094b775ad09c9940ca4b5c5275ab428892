import { GraphQLError } from "graphql";
export function SubgraphNameRule(context) {
    for (const [_, subgraph] of context.subgraphStates) {
        const id = subgraph.graph.id;
        if (id.startsWith("__")) {
            context.reportError(new GraphQLError(`Name "${id}" must not begin with "__", which is reserved by GraphQL introspection.`, {
                extensions: {
                    code: "INVALID_GRAPHQL",
                },
            }));
        }
    }
    return {};
}
