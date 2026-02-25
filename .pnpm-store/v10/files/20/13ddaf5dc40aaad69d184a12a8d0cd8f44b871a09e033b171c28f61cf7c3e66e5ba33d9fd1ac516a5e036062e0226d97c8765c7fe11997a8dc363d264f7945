import { GraphQLError } from "graphql";
export function FieldArgumentDefaultMismatchRule(context) {
    return {
        ObjectTypeFieldArg(objectState, fieldState, argState) {
            if (typeof argState.defaultValue !== "string") {
                return;
            }
            const defaultValueToGraphs = new Map();
            argState.byGraph.forEach((arg, graphName) => {
                if (typeof arg.defaultValue === "string") {
                    const existing = defaultValueToGraphs.get(arg.defaultValue);
                    if (existing) {
                        existing.push(graphName);
                    }
                    else {
                        defaultValueToGraphs.set(arg.defaultValue, [graphName]);
                    }
                }
            });
            if (defaultValueToGraphs.size > 1) {
                const groups = Array.from(defaultValueToGraphs.entries()).map(([defaultValue, graphs]) => {
                    const plural = graphs.length > 1 ? "s" : "";
                    return `default value ${defaultValue} in subgraph${plural} "${graphs
                        .map(context.graphIdToName)
                        .join('", "')}"`;
                });
                const [first, second, ...rest] = groups;
                context.reportError(new GraphQLError(`Argument "${objectState.name}.${fieldState.name}(${argState.name}:)" has incompatible default values across subgraphs: it has ${first} but ${second}${rest.length ? ` and ${rest.join(" and ")}` : ""}`, {
                    extensions: {
                        code: "FIELD_ARGUMENT_DEFAULT_MISMATCH",
                    },
                }));
            }
        },
    };
}
