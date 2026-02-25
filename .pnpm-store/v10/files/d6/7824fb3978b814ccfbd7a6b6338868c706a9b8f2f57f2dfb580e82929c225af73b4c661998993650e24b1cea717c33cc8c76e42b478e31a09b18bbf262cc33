import { GraphQLError } from "graphql";
import { TypeKind } from "../../../subgraph/state.js";
function stripNonNull(type) {
    return type.replace(/!$/, "");
}
function stripList(type) {
    const startsAt = type.indexOf("[");
    const endsAt = type.lastIndexOf("]");
    return type.slice(startsAt + 1, endsAt);
}
function normalizeOutputTypeStrings({ superType, localType, }) {
    let superTypeNormalized = superType;
    let localTypeNormalized = localType;
    if (!superTypeNormalized.endsWith("!")) {
        localTypeNormalized = stripNonNull(localTypeNormalized);
    }
    if (superTypeNormalized.startsWith("[") &&
        localTypeNormalized.startsWith("[")) {
        const innerSuper = stripList(superTypeNormalized);
        let innerLocal = stripList(localTypeNormalized);
        if (!innerSuper.endsWith("!")) {
            innerLocal = stripNonNull(innerLocal);
        }
        const superSign = superTypeNormalized.endsWith("!") ? "!" : "";
        const localSign = localTypeNormalized.endsWith("!") ? "!" : "";
        superTypeNormalized = `[${innerSuper}]${superSign}`;
        localTypeNormalized = `[${innerLocal}]${localSign}`;
    }
    return {
        superType: superTypeNormalized,
        localType: localTypeNormalized,
    };
}
export function FieldsOfTheSameTypeRule(context) {
    return {
        ObjectTypeField(objectTypeState, fieldState) {
            const typeToGraphs = new Map();
            const typeNameToPossibleTypeNames = new Map();
            fieldState.byGraph.forEach((field, graphName) => {
                const typeName = field.type
                    .replaceAll("!", "")
                    .replaceAll("[", "")
                    .replaceAll("]", "");
                const typeState = context.subgraphStates
                    .get(graphName)
                    ?.types.get(typeName);
                if (typeState?.kind === TypeKind.UNION) {
                    if (!typeNameToPossibleTypeNames.has(typeName)) {
                        typeNameToPossibleTypeNames.set(typeName, new Set());
                    }
                    const list = typeNameToPossibleTypeNames.get(typeName);
                    typeState.members.forEach((member) => {
                        list.add(member);
                    });
                }
                else if (typeState?.kind === TypeKind.INTERFACE) {
                    if (!typeNameToPossibleTypeNames.has(typeName)) {
                        typeNameToPossibleTypeNames.set(typeName, new Set());
                    }
                    const list = typeNameToPossibleTypeNames.get(typeName);
                    typeState.implementedBy.forEach((member) => {
                        list.add(member);
                    });
                }
                const normalizedOutputTypes = normalizeOutputTypeStrings({
                    superType: fieldState.type,
                    localType: field.type,
                });
                const fieldOutputType = normalizedOutputTypes.superType === normalizedOutputTypes.localType
                    ? normalizedOutputTypes.localType
                    : field.type;
                const existing = typeToGraphs.get(fieldOutputType);
                if (existing) {
                    existing.push(graphName);
                }
                else {
                    typeToGraphs.set(fieldOutputType, [graphName]);
                }
            });
            if (typeToGraphs.size > 1) {
                if (typeNameToPossibleTypeNames.size === 1) {
                    const possibleTypeNames = [];
                    typeNameToPossibleTypeNames.forEach((list, unionOrInterfaceName) => {
                        possibleTypeNames.push(unionOrInterfaceName);
                        for (const typeName of list) {
                            possibleTypeNames.push(typeName);
                        }
                    });
                    const outputTypeNames = Array.from(typeToGraphs.keys()).map((t) => t.replaceAll("!", "").replaceAll("[", "").replaceAll("]", ""));
                    if (outputTypeNames.every((t) => possibleTypeNames.includes(t))) {
                        return;
                    }
                }
                const groups = Array.from(typeToGraphs.entries()).map(([outputType, graphs]) => {
                    const plural = graphs.length > 1 ? "s" : "";
                    return `type "${outputType}" in subgraph${plural} "${graphs
                        .map(context.graphIdToName)
                        .join('", "')}"`;
                });
                const [first, second, ...rest] = groups;
                context.reportError(new GraphQLError(`Type of field "${objectTypeState.name}.${fieldState.name}" is incompatible across subgraphs: it has ${first} but ${second}${rest.length ? ` and ${rest.join(" and ")}` : ""}`, {
                    extensions: {
                        code: "FIELD_TYPE_MISMATCH",
                    },
                }));
            }
        },
        InputObjectTypeField(inputObjectTypeState, fieldState) {
            const typeToGraphs = new Map();
            fieldState.byGraph.forEach((field, graphName) => {
                const isNonNullable = field.type.endsWith("!");
                const isNonNullableInSupergraph = fieldState.type.endsWith("!");
                const isMatchingNonNullablePart = fieldState.type.replace(/!$/, "") === field.type.replace(/!$/, "");
                let normalizedOutputType;
                if (isMatchingNonNullablePart) {
                    normalizedOutputType = isNonNullableInSupergraph
                        ? isNonNullable
                            ? field.type
                            : field.type + "!"
                        : field.type;
                }
                else {
                    normalizedOutputType = field.type;
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
                context.reportError(new GraphQLError(`Type of field "${inputObjectTypeState.name}.${fieldState.name}" is incompatible across subgraphs: it has ${first} but ${second}${rest.length ? ` and ${rest.join(" and ")}` : ""}`, {
                    extensions: {
                        code: "FIELD_TYPE_MISMATCH",
                    },
                }));
            }
        },
    };
}
