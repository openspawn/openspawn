import { GraphQLError } from "graphql";
export function ReservedSubgraphNameRule(context) {
    if (context.getSubgraphName() === "_") {
        context.reportError(new GraphQLError(`Invalid name _ for a subgraph: this name is reserved`, {
            extensions: {
                code: "INVALID_SUBGRAPH_NAME",
            },
        }));
    }
    return {};
}
