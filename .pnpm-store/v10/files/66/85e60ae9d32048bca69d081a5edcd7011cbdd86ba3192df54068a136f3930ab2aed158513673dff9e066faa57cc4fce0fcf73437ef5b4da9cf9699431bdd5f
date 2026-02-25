import { GraphQLError } from "graphql";
import { TypeKind } from "../../../subgraph/state.js";
const mapIRKindToString = {
    [TypeKind.OBJECT]: "Object",
    [TypeKind.INTERFACE]: "Interface",
    [TypeKind.UNION]: "Union",
    [TypeKind.ENUM]: "Enum",
    [TypeKind.INPUT_OBJECT]: "InputObject",
    [TypeKind.SCALAR]: "Scalar",
    [TypeKind.DIRECTIVE]: "Directive",
};
export function TypesOfTheSameKindRule(context) {
    const typeToKindWithGraphs = new Map();
    const typesWithConflict = new Set();
    for (const [graph, state] of context.subgraphStates) {
        state.types.forEach((type) => {
            const kindToGraphs = typeToKindWithGraphs.get(type.name);
            const isInterfaceObject = type.kind === TypeKind.INTERFACE ? type.isInterfaceObject : false;
            const graphsValue = {
                graphName: context.graphIdToName(graph),
                isInterfaceObject,
            };
            if (kindToGraphs) {
                const graphs = kindToGraphs.get(type.kind);
                if (graphs) {
                    graphs.add(graphsValue);
                }
                else {
                    kindToGraphs.set(type.kind, new Set([graphsValue]));
                }
                if (kindToGraphs.size > 1) {
                    typesWithConflict.add(type.name);
                }
            }
            else {
                typeToKindWithGraphs.set(type.name, new Map([[type.kind, new Set([graphsValue])]]));
            }
        });
    }
    for (const typeName of typesWithConflict) {
        const kindToGraphs = typeToKindWithGraphs.get(typeName);
        if (interfaceObjectConditions(kindToGraphs)) {
            continue;
        }
        const groups = Array.from(kindToGraphs.entries()).map(([kind, graphs]) => {
            const plural = graphs.size > 1 ? "s" : "";
            return `${mapIRKindToString[kind]} Type in subgraph${plural} "${Array.from(graphs)
                .map((typeValidationContext) => typeValidationContext.graphName)
                .join('", "')}"`;
        });
        const [first, second, ...rest] = groups;
        context.reportError(new GraphQLError(`Type "${typeName}" has mismatched kind: it is defined as ${first} but ${second}${rest.length ? ` and ${rest.join(" and ")}` : ""}`, {
            extensions: {
                code: "TYPE_KIND_MISMATCH",
            },
        }));
    }
}
function interfaceObjectConditions(kindToGraphs) {
    const interfaceTypes = kindToGraphs.get(TypeKind.INTERFACE) || [];
    for (const graphTypeValidationContext of interfaceTypes) {
        if (graphTypeValidationContext.isInterfaceObject) {
            return true;
        }
    }
    return false;
}
