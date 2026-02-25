"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiredQueryRule = RequiredQueryRule;
const graphql_1 = require("graphql");
function RequiredQueryRule(context) {
    if (Array.from(context.subgraphStates.values()).every((subgraph) => typeof subgraph.schema.queryType === "undefined")) {
        context.reportError(new graphql_1.GraphQLError(`No queries found in any subgraph: a supergraph must have a query root type.`, {
            extensions: {
                code: "NO_QUERIES",
            },
        }));
    }
}
