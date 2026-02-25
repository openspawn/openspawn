"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservedSubgraphNameRule = ReservedSubgraphNameRule;
const graphql_1 = require("graphql");
function ReservedSubgraphNameRule(context) {
    if (context.getSubgraphName() === "_") {
        context.reportError(new graphql_1.GraphQLError(`Invalid name _ for a subgraph: this name is reserved`, {
            extensions: {
                code: "INVALID_SUBGRAPH_NAME",
            },
        }));
    }
    return {};
}
