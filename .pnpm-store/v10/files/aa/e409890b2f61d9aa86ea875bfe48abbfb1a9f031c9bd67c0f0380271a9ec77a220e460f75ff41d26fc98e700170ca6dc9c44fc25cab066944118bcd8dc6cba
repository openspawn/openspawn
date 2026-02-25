"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromContextDirectiveRules = FromContextDirectiveRules;
const graphql_1 = require("graphql");
function FromContextDirectiveRules(context) {
    if (context.satisfiesVersionRange(">= v2.8")) {
        if (context.federationImports.some((i) => i.name === "@fromContext" && i.kind === "directive")) {
            context.reportError(new graphql_1.GraphQLError("@fromContext directive is not yet supported.", {
                extensions: {
                    code: "UNSUPPORTED_FEATURE",
                },
            }));
        }
    }
    return {};
}
