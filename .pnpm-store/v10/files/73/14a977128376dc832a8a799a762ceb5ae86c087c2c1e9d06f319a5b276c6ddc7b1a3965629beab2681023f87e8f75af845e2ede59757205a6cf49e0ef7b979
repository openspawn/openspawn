import { GraphQLError } from "graphql";
export function ExtensionWithBaseRule(context) {
    return {
        ObjectType(objectTypeState) {
            if (objectTypeState.name === "Query" ||
                objectTypeState.name === "Mutation" ||
                objectTypeState.name === "Subscription") {
                return;
            }
            if (!objectTypeState.hasDefinition) {
                if (objectTypeState.byGraph.size > 1 &&
                    Array.from(objectTypeState.byGraph).every(([graphId, meta]) => context.subgraphStates.get(graphId).federation.version === "v1.0"
                        ? meta.extensionType === "@extends"
                        : false)) {
                    return;
                }
                objectTypeState.byGraph.forEach((_, graph) => {
                    context.reportError(new GraphQLError(`[${context.graphIdToName(graph)}] Type "${objectTypeState.name}" is an extension type, but there is no type definition for "${objectTypeState.name}" in any subgraph.`, {
                        extensions: {
                            code: "EXTENSION_WITH_NO_BASE",
                        },
                    }));
                });
            }
        },
    };
}
