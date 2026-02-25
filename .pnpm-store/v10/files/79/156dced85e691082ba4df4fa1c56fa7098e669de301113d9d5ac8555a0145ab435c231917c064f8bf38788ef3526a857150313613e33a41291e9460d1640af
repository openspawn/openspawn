"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueArgumentNamesRule = UniqueArgumentNamesRule;
const graphql_1 = require("graphql");
function UniqueArgumentNamesRule(context) {
    return {
        Field: checkArgUniqueness,
        Directive: checkArgUniqueness,
    };
    function checkArgUniqueness(parentNode) {
        const argumentNodes = parentNode.arguments ?? [];
        const seenArgs = new Set();
        for (const argumentNode of argumentNodes) {
            if (seenArgs.has(argumentNode.name.value)) {
                context.reportError(new graphql_1.GraphQLError(`There can be only one argument named "${argumentNode.name.value}".`, {
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
            else {
                seenArgs.add(argumentNode.name.value);
            }
        }
    }
}
