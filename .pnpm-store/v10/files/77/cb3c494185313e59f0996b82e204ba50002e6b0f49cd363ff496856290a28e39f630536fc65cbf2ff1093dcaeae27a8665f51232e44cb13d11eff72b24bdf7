"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypesOfTheSameKindRule = TypesOfTheSameKindRule;
const graphql_1 = require("graphql");
const state_js_1 = require("../../../subgraph/state.js");
const mapIRKindToString = {
    [state_js_1.TypeKind.OBJECT]: "Object",
    [state_js_1.TypeKind.INTERFACE]: "Interface",
    [state_js_1.TypeKind.UNION]: "Union",
    [state_js_1.TypeKind.ENUM]: "Enum",
    [state_js_1.TypeKind.INPUT_OBJECT]: "InputObject",
    [state_js_1.TypeKind.SCALAR]: "Scalar",
    [state_js_1.TypeKind.DIRECTIVE]: "Directive",
};
function TypesOfTheSameKindRule(context) {
    const typeToKindWithGraphs = new Map();
    const typesWithConflict = new Set();
    for (const [graph, state] of context.subgraphStates) {
        state.types.forEach((type) => {
            const kindToGraphs = typeToKindWithGraphs.get(type.name);
            const isInterfaceObject = type.kind === state_js_1.TypeKind.INTERFACE ? type.isInterfaceObject : false;
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
        context.reportError(new graphql_1.GraphQLError(`Type "${typeName}" has mismatched kind: it is defined as ${first} but ${second}${rest.length ? ` and ${rest.join(" and ")}` : ""}`, {
            extensions: {
                code: "TYPE_KIND_MISMATCH",
            },
        }));
    }
}
function interfaceObjectConditions(kindToGraphs) {
    const interfaceTypes = kindToGraphs.get(state_js_1.TypeKind.INTERFACE) || [];
    for (const graphTypeValidationContext of interfaceTypes) {
        if (graphTypeValidationContext.isInterfaceObject) {
            return true;
        }
    }
    return false;
}
