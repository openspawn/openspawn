import { GraphQLError } from "graphql";
export function ContextDirectiveRules(context) {
    if (context.satisfiesVersionRange(">= v2.8")) {
        if (context.federationImports.some((i) => i.name === "@context" && i.kind === "directive")) {
            context.reportError(new GraphQLError("@context directive is not yet supported.", {
                extensions: {
                    code: "UNSUPPORTED_FEATURE",
                },
            }));
        }
    }
    return {};
}
