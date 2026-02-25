import { GraphQLError } from "graphql";
export function UniqueDirectiveNamesRule(context) {
    const knownDirectiveNameNodes = new Set();
    return {
        DirectiveDefinition(node) {
            const directiveName = node.name.value;
            const existingNameNode = knownDirectiveNameNodes.has(directiveName);
            if (existingNameNode) {
                context.reportError(new GraphQLError(`There can be only one directive named "@${directiveName}".`, {
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
