"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalMissingOnBaseRule = ExternalMissingOnBaseRule;
const graphql_1 = require("graphql");
const format_js_1 = require("../../../utils/format.js");
function ExternalMissingOnBaseRule(context, supergraph) {
    return {
        ObjectType(objectTypeState) {
            if (Array.from(objectTypeState.byGraph).every(([_, stateInGraph]) => stateInGraph.external === true)) {
                const subgraphs = objectTypeState.byGraph.size > 1 ? "subgraphs" : "subgraph";
                context.reportError(new graphql_1.GraphQLError(`Type "${objectTypeState.name}" is marked @external on all the subgraphs in which it is listed (${subgraphs} ${((0, format_js_1.andList)(Array.from(objectTypeState.byGraph.keys()).map((graphId) => context.graphIdToName(graphId))),
                    true,
                    '"')}).`, {
                    extensions: {
                        code: "EXTERNAL_MISSING_ON_BASE",
                    },
                }));
            }
        },
        ObjectTypeField(objectState, fieldState) {
            if (Array.from(fieldState.byGraph).every(([graphId, fieldStateInGraph]) => {
                const graphVersion = context.subgraphStates.get(graphId).federation.version;
                if (fieldStateInGraph.usedAsKey) {
                    return (fieldStateInGraph.external &&
                        !objectState.byGraph.get(graphId).extension);
                }
                if (graphVersion === "v1.0") {
                    if (fieldStateInGraph.external === true && fieldStateInGraph.used) {
                        return true;
                    }
                    return false;
                }
                return fieldStateInGraph.external === true;
            })) {
                for (let interfaceName of objectState.interfaces) {
                    let interfaceState = supergraph.interfaceTypes.get(interfaceName);
                    if (!interfaceState) {
                        continue;
                    }
                    if (!interfaceState.hasInterfaceObject) {
                        continue;
                    }
                    for (let [graphId, interfaceStateInGraph] of interfaceState.byGraph) {
                        if (!interfaceStateInGraph.isInterfaceObject) {
                            continue;
                        }
                        let interfaceFieldState = interfaceState.fields.get(fieldState.name);
                        if (!interfaceFieldState) {
                            continue;
                        }
                        let interfaceFieldInGraph = interfaceFieldState.byGraph.get(graphId);
                        if (!interfaceFieldInGraph) {
                            continue;
                        }
                        if (interfaceFieldInGraph.external !== true) {
                            return;
                        }
                    }
                }
                const subgraphs = fieldState.byGraph.size > 1 ? "subgraphs" : "subgraph";
                context.reportError(new graphql_1.GraphQLError(`Field "${objectState.name}.${fieldState.name}" is marked @external on all the subgraphs in which it is listed (${subgraphs} ${(0, format_js_1.andList)(Array.from(fieldState.byGraph.keys()).map(context.graphIdToName), true, '"')}).`, {
                    extensions: {
                        code: "EXTERNAL_MISSING_ON_BASE",
                    },
                }));
            }
        },
    };
}
