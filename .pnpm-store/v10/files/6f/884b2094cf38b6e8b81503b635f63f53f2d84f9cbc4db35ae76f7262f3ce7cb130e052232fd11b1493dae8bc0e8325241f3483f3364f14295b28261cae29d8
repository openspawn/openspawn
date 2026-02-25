import { GraphQLError } from "graphql";
export function FromContextDirectiveRules(context) {
    if (context.satisfiesVersionRange(">= v2.8")) {
        if (context.federationImports.some((i) => i.name === "@fromContext" && i.kind === "directive")) {
            context.reportError(new GraphQLError("@fromContext directive is not yet supported.", {
                extensions: {
                    code: "UNSUPPORTED_FEATURE",
                },
            }));
        }
    }
    return {};
}
