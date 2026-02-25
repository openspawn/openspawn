"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidFieldSharingRule = InvalidFieldSharingRule;
const graphql_1 = require("graphql");
const format_js_1 = require("../../../utils/format.js");
function InvalidFieldSharingRule(context, supergraphState) {
    return {
        ObjectTypeField(objectTypeState, fieldState) {
            if (Array.from(objectTypeState.byGraph.keys()).some((graph) => context.subgraphStates.get(graph)?.schema.subscriptionType ===
                objectTypeState.name)) {
                if (fieldState.byGraph.size > 1) {
                    context.reportError(new graphql_1.GraphQLError(`Fields on root level subscription object cannot be marked as shareable`, {
                        extensions: {
                            code: "INVALID_FIELD_SHARING",
                        },
                    }));
                }
                return;
            }
            if (fieldState.usedAsKey &&
                Array.from(fieldState.byGraph.values()).every((field) => field.usedAsKey)) {
                return;
            }
            const nonSharableIn = [];
            const resolvableIn = [];
            for (const [graphId, field] of fieldState.byGraph) {
                const fieldIsShareable = field.shareable;
                const fieldIsExternal = field.external;
                const fieldHasOverride = field.override;
                const fieldIsUsedAsKey = field.usedAsKey;
                if (fieldIsExternal) {
                    continue;
                }
                if (fieldHasOverride) {
                    const overrideGraphId = context.graphNameToId(fieldHasOverride);
                    if (overrideGraphId && fieldState.byGraph.has(overrideGraphId)) {
                        continue;
                    }
                }
                const fedV1FieldInExtension = field.version === "v1.0" && field.extension;
                if (fieldIsShareable ||
                    fieldIsUsedAsKey ||
                    (objectTypeState.isEntity && fedV1FieldInExtension)) {
                    resolvableIn.push(graphId);
                    continue;
                }
                nonSharableIn.push(graphId);
                resolvableIn.push(graphId);
            }
            const interfaceObjectFieldIn = [];
            if (nonSharableIn.length > 0) {
                for (const interfaceName of objectTypeState.interfaces) {
                    const interfaceState = supergraphState.interfaceTypes.get(interfaceName);
                    if (!interfaceState || !interfaceState.hasInterfaceObject) {
                        continue;
                    }
                    const interfaceObjectFieldState = interfaceState.fields.get(fieldState.name);
                    if (!interfaceObjectFieldState ||
                        interfaceObjectFieldState.usedAsKey) {
                        continue;
                    }
                    for (const [graphId, field] of interfaceObjectFieldState.byGraph) {
                        const isInterfaceObject = interfaceState.byGraph.get(graphId)?.isInterfaceObject === true;
                        if (!isInterfaceObject) {
                            continue;
                        }
                        const fieldIsShareable = field.shareable;
                        const fieldIsExternal = field.external;
                        const fieldHasOverride = field.override;
                        const fieldIsUsedAsKey = field.usedAsKey;
                        if (fieldIsExternal) {
                            continue;
                        }
                        if (fieldHasOverride) {
                            const overrideGraphId = context.graphNameToId(fieldHasOverride);
                            if (overrideGraphId && fieldState.byGraph.has(overrideGraphId)) {
                                continue;
                            }
                        }
                        interfaceObjectFieldIn.push([graphId, interfaceName]);
                        if (fieldIsShareable || fieldIsUsedAsKey) {
                            resolvableIn.push(graphId);
                            continue;
                        }
                        nonSharableIn.push(graphId);
                        resolvableIn.push(graphId);
                    }
                }
            }
            if (nonSharableIn.length >= 1 && resolvableIn.length > 1) {
                const isNonSharableInAll = resolvableIn.every((graphId) => nonSharableIn.includes(graphId));
                const message = `Non-shareable field "${objectTypeState.name}.${fieldState.name}" is resolved from multiple subgraphs: it is resolved from subgraphs ${(0, format_js_1.andList)(resolvableIn.map((graphId) => {
                    const name = context.graphIdToName(graphId);
                    const interfaceObjectField = interfaceObjectFieldIn.find(([g, _]) => g === graphId);
                    if (!interfaceObjectField) {
                        return `"${name}"`;
                    }
                    return `"${name}" (through @interfaceObject field "${interfaceObjectField[1]}.${fieldState.name}")`;
                }), false)} and defined as non-shareable in ${isNonSharableInAll
                    ? "all of them"
                    : `subgraph${nonSharableIn.length > 1 ? "s" : ""} ${(0, format_js_1.andList)(nonSharableIn.map(context.graphIdToName), true, '"')}`}`;
                context.reportError(new graphql_1.GraphQLError(message, {
                    extensions: {
                        code: "INVALID_FIELD_SHARING",
                    },
                }));
            }
        },
        InterfaceTypeField(interfaceTypeState, fieldState) {
            if (!interfaceTypeState.hasInterfaceObject) {
                return;
            }
            const nonSharableIn = [];
            const resolvableIn = [];
            const interfaceObjectFieldIn = [];
            for (const [graphId, field] of fieldState.byGraph) {
                const isInterfaceObject = interfaceTypeState.byGraph.get(graphId)?.isInterfaceObject === true;
                if (!isInterfaceObject) {
                    continue;
                }
                const fieldIsShareable = field.shareable;
                const fieldIsExternal = field.external;
                const fieldHasOverride = field.override;
                const fieldIsUsedAsKey = field.usedAsKey;
                if (fieldIsExternal) {
                    continue;
                }
                if (fieldHasOverride) {
                    const overrideGraphId = context.graphNameToId(fieldHasOverride);
                    if (overrideGraphId && fieldState.byGraph.has(overrideGraphId)) {
                        continue;
                    }
                }
                if (fieldIsShareable || fieldIsUsedAsKey) {
                    resolvableIn.push(graphId);
                    continue;
                }
                nonSharableIn.push(graphId);
                resolvableIn.push(graphId);
                interfaceObjectFieldIn.push(graphId);
            }
            if (nonSharableIn.length >= 1 && resolvableIn.length > 1) {
                const isNonSharableInAll = resolvableIn.every((graphId) => nonSharableIn.includes(graphId));
                const message = `Non-shareable field "${interfaceTypeState.name}.${fieldState.name}" is resolved from multiple subgraphs: it is resolved from subgraphs ${(0, format_js_1.andList)(resolvableIn.map(context.graphIdToName), false, '"')} and defined as non-shareable in ${isNonSharableInAll
                    ? "all of them"
                    : `subgraph${nonSharableIn.length > 1 ? "s" : ""} ${(0, format_js_1.andList)(nonSharableIn.map(context.graphIdToName), true, '"')}`}`;
                context.reportError(new graphql_1.GraphQLError(message, {
                    extensions: {
                        code: "INVALID_FIELD_SHARING",
                    },
                }));
            }
        },
    };
}
