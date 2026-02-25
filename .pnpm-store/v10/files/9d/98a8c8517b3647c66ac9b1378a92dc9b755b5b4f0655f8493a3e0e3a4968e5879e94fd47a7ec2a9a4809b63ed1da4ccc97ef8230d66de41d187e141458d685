import { GraphQLError } from "graphql";
export function FieldArgumentsOfTheSameTypeRule(context) {
    return {
        ObjectTypeFieldArg(objectTypeState, fieldState, argState) {
            const typeToGraphs = new Map();
            argState.byGraph.forEach((arg, graphName) => {
                const isNonNullable = arg.type.endsWith("!");
                const isNonNullableInSupergraph = argState.type.endsWith("!");
                const isMatchingNonNullablePart = argState.type.replace(/!$/, "") === arg.type.replace(/!$/, "");
                let normalizedOutputType;
                if (isMatchingNonNullablePart) {
                    normalizedOutputType = isNonNullableInSupergraph
                        ? isNonNullable
                            ? arg.type
                            : arg.type + "!"
                        : arg.type;
                }
                else {
                    normalizedOutputType = arg.type;
                }
                const existing = typeToGraphs.get(normalizedOutputType);
                if (existing) {
                    existing.push(graphName);
                }
                else {
                    typeToGraphs.set(normalizedOutputType, [graphName]);
                }
            });
            if (typeToGraphs.size > 1) {
                const groups = Array.from(typeToGraphs.entries()).map(([outputType, graphs]) => {
                    const plural = graphs.length > 1 ? "s" : "";
                    return `type "${outputType}" in subgraph${plural} "${graphs
                        .map(context.graphIdToName)
                        .join('", "')}"`;
                });
                const [first, second, ...rest] = groups;
                context.reportError(new GraphQLError(`Type of argument "${objectTypeState.name}.${fieldState.name}(${argState.name}:)" is incompatible across subgraphs: it has ${first} but ${second}${rest.length ? ` and ${rest.join(" and ")}` : ""}`, {
                    extensions: {
                        code: "FIELD_ARGUMENT_TYPE_MISMATCH",
                    },
                }));
            }
        },
        DirectiveFieldArg(directiveState, argState) {
            if (directiveState.isExecutable === false) {
                return;
            }
            if (argState.byGraph.size !== context.subgraphStates.size) {
                return;
            }
            const typesPerSubgraph = new Map();
            function collectSubgraphType(typeName, subgraphName) {
                let subgraphNames = typesPerSubgraph.get(typeName);
                if (subgraphNames === undefined) {
                    subgraphNames = new Set();
                    typesPerSubgraph.set(typeName, subgraphNames);
                }
                subgraphNames.add(subgraphName);
            }
            argState.byGraph.forEach((arg, graphName) => {
                collectSubgraphType(arg.type, graphName);
            });
            if (typesPerSubgraph.size === 1) {
                return;
            }
            const groups = Array.from(typesPerSubgraph.entries()).map(([outputType, graphs]) => {
                const plural = graphs.size > 1 ? "s" : "";
                return `type "${outputType}" in subgraph${plural} ${joinItems(Array.from(graphs).map(context.graphIdToName))}`;
            });
            const [first, ...rest] = groups;
            context.reportError(new GraphQLError(`Type of argument "@${directiveState.name}(${argState.name}:)" is incompatible across subgraphs: it has ${first} but ${rest.join(" and ")}`, {
                extensions: {
                    code: "FIELD_ARGUMENT_TYPE_MISMATCH",
                },
            }));
        },
    };
}
function joinItems(items) {
    if (items.length === 0) {
        return "";
    }
    else if (items.length === 1) {
        return `"${items[0]}"`;
    }
    else if (items.length === 2) {
        return `"${items[0]}" and "${items[1]}"`;
    }
    else {
        return `"${items.slice(0, -1).join(`", "`)}", and "${items[items.length - 1]}"`;
    }
}
