"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceFieldNoImplementationRule = InterfaceFieldNoImplementationRule;
const graphql_1 = require("graphql");
function InterfaceFieldNoImplementationRule(context, supergraph) {
    return {
        ObjectType(objectTypeState) {
            if (objectTypeState.interfaces.size === 0) {
                return;
            }
            for (const interfaceName of objectTypeState.interfaces) {
                const interfaceTypeState = getTypeFromSupergraph(supergraph, interfaceName);
                if (!interfaceTypeState) {
                    throw new Error(`Expected an interface to exist in supergraph state`);
                }
                if (interfaceTypeState.kind !== "interface") {
                    return;
                }
                const nonRequiredFields = [];
                for (const [graph, interfaceStateInGraph,] of interfaceTypeState.byGraph) {
                    if (!interfaceStateInGraph.isInterfaceObject) {
                        continue;
                    }
                    for (const [fieldName, interfaceFieldState,] of interfaceTypeState.fields) {
                        const interfaceFieldStateInGraph = interfaceFieldState.byGraph.get(graph);
                        if (!interfaceFieldStateInGraph) {
                            continue;
                        }
                        if (interfaceFieldStateInGraph.external) {
                            continue;
                        }
                        nonRequiredFields.push(fieldName);
                    }
                }
                for (const [fieldName, interfaceFieldState,] of interfaceTypeState.fields) {
                    if (nonRequiredFields.includes(fieldName)) {
                        continue;
                    }
                    if (objectTypeState.fields.has(fieldName) &&
                        objectTypeState.isEntity) {
                        continue;
                    }
                    for (const [graph, objectTypeInGraph] of objectTypeState.byGraph) {
                        if (!objectTypeInGraph.interfaces.has(interfaceName)) {
                            continue;
                        }
                        const objectFieldState = objectTypeState.fields.get(fieldName);
                        if (!objectFieldState) {
                            const interfaceFieldDefinedInGraphs = Array.from(interfaceFieldState.byGraph.keys()).map(context.graphIdToName);
                            const declaredIn = interfaceFieldDefinedInGraphs.length === 1
                                ? `subgraph "${interfaceFieldDefinedInGraphs[0]}"`
                                : `subgraphs ${interfaceFieldDefinedInGraphs.map((g) => `"${g}"`).join(", ")}`;
                            context.reportError(new graphql_1.GraphQLError(`Interface field "${interfaceName}.${fieldName}" is declared in ${declaredIn} but type "${objectTypeState.name}", which implements "${interfaceName}" in subgraph "${context.graphIdToName(graph)}" does not have field "${fieldName}".`, {
                                extensions: {
                                    code: "INTERFACE_FIELD_NO_IMPLEM",
                                },
                            }));
                        }
                    }
                }
            }
        },
    };
}
function getTypeFromSupergraph(state, name) {
    return (state.objectTypes.get(name) ??
        state.interfaceTypes.get(name) ??
        state.unionTypes.get(name));
}
