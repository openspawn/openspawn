"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubgraphNameRule = SubgraphNameRule;
const graphql_1 = require("graphql");
function SubgraphNameRule(context) {
    for (const [_, subgraph] of context.subgraphStates) {
        const id = subgraph.graph.id;
        if (id.startsWith("__")) {
            context.reportError(new graphql_1.GraphQLError(`Name "${id}" must not begin with "__", which is reserved by GraphQL introspection.`, {
                extensions: {
                    code: "INVALID_GRAPHQL",
                },
            }));
        }
    }
    return {};
}
