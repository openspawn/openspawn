"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextDirectiveRules = ContextDirectiveRules;
const graphql_1 = require("graphql");
function ContextDirectiveRules(context) {
    if (context.satisfiesVersionRange(">= v2.8")) {
        if (context.federationImports.some((i) => i.name === "@context" && i.kind === "directive")) {
            context.reportError(new graphql_1.GraphQLError("@context directive is not yet supported.", {
                extensions: {
                    code: "UNSUPPORTED_FEATURE",
                },
            }));
        }
    }
    return {};
}
