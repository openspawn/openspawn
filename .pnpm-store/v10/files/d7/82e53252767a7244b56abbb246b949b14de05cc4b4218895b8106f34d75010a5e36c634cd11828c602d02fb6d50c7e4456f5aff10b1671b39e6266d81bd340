"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueDirectiveNamesRule = UniqueDirectiveNamesRule;
const graphql_1 = require("graphql");
function UniqueDirectiveNamesRule(context) {
    const knownDirectiveNameNodes = new Set();
    return {
        DirectiveDefinition(node) {
            const directiveName = node.name.value;
            const existingNameNode = knownDirectiveNameNodes.has(directiveName);
            if (existingNameNode) {
                context.reportError(new graphql_1.GraphQLError(`There can be only one directive named "@${directiveName}".`, {
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
            else {
                knownDirectiveNameNodes.add(directiveName);
            }
        },
    };
}
