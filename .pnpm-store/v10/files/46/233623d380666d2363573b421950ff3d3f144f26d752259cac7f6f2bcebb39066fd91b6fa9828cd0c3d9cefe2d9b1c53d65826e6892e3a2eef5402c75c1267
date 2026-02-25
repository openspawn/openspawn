import { GraphQLError } from "graphql";
export function RequiredArgumentMissingInSomeSubgraph(context) {
    return {
        ObjectTypeFieldArg(objectState, fieldState, argState) {
            if (argState.type.endsWith("!")) {
                if (argState.byGraph.size === 1 &&
                    fieldState.byGraph.size === argState.byGraph.size) {
                    return;
                }
                if (fieldState.byGraph.size === argState.byGraph.size) {
                    return;
                }
                const graphsWithRequiredArg = Array.from(argState.byGraph)
                    .filter(([_, arg]) => arg.type.endsWith("!"))
                    .map(([graph]) => graph);
                const graphsWithoutArg = Array.from(fieldState.byGraph.keys()).filter((graph) => !argState.byGraph.has(graph));
                const requiredIn = `subgraph${graphsWithRequiredArg.length > 1 ? "s" : ""} "${graphsWithRequiredArg.map(context.graphIdToName).join('", "')}"`;
                const missingIn = `subgraph${graphsWithoutArg.length > 1 ? "s" : ""} "${graphsWithoutArg
                    .map(context.graphIdToName)
                    .join('", "')}"`;
                context.reportError(new GraphQLError(`Argument "${objectState.name}.${fieldState.name}(${argState.name}:)" is required in some subgraphs but does not appear in all subgraphs: it is required in ${requiredIn} but does not appear in ${missingIn}`, {
                    extensions: {
                        code: "REQUIRED_ARGUMENT_MISSING_IN_SOME_SUBGRAPH",
                    },
                }));
            }
        },
    };
}
