"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalArgumentMissingRule = ExternalArgumentMissingRule;
const graphql_1 = require("graphql");
function ExternalArgumentMissingRule(context) {
    return {
        ObjectTypeFieldArg(objectState, fieldState, argState) {
            if (argState.byGraph.size === 1 &&
                fieldState.byGraph.size === argState.byGraph.size) {
                return;
            }
            if (fieldState.byGraph.size === argState.byGraph.size) {
                return;
            }
            const graphsWithRequiredArg = Array.from(argState.byGraph)
                .filter(([graph, arg]) => fieldState.byGraph.get(graph)
                ?.external !== true)
                .map(([graph]) => graph);
            const externalGraphsWithoutArg = Array.from(fieldState.byGraph.keys()).filter((graph) => !argState.byGraph.has(graph) &&
                fieldState.byGraph.get(graph)?.external === true);
            if (!externalGraphsWithoutArg.length) {
                return;
            }
            const requiredIn = `subgraph${graphsWithRequiredArg.length > 1 ? "s" : ""} "${graphsWithRequiredArg.map(context.graphIdToName).join('", "')}"`;
            const missingIn = `subgraph${externalGraphsWithoutArg.length > 1 ? "s" : ""} "${externalGraphsWithoutArg.map(context.graphIdToName).join('", "')}"`;
            const fieldCoordinate = `${objectState.name}.${fieldState.name}`;
            const argCoordinate = `${objectState.name}.${fieldState.name}(${argState.name}:)`;
            context.reportError(new graphql_1.GraphQLError(`Field "${fieldCoordinate}" is missing argument "${argCoordinate}" in some subgraphs where it is marked @external: argument "${argCoordinate}" is declared in ${requiredIn} but not in ${missingIn} (where "${fieldCoordinate}" is @external)`, {
                extensions: {
                    code: "EXTERNAL_ARGUMENT_MISSING",
                },
            }));
        },
    };
}
