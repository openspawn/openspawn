import { GraphQLError, Kind, specifiedScalarTypes, } from "graphql";
import { print } from "../../../graphql/printer.js";
import { namedTypeFromTypeNode } from "../../helpers.js";
export function ProvidedArgumentsOnDirectivesRule(context) {
    return {
        Directive: {
            leave(directiveNode, _k, _p, _pp, ancestors) {
                const directiveName = directiveNode.name.value;
                const directiveDefinition = context.getKnownDirectiveDefinition(directiveName);
                if (!directiveDefinition) {
                    return;
                }
                const args = directiveNode.arguments;
                if (args && directiveDefinition.arguments) {
                    const coordinate = context.getSchemaCoordinate(ancestors);
                    for (const arg of args) {
                        const argDefinition = directiveDefinition.arguments.find((a) => a.name.value === arg.name.value);
                        if (argDefinition && arg.value) {
                            if (argDefinition.type.kind === Kind.NON_NULL_TYPE &&
                                arg.value.kind === Kind.NULL) {
                                continue;
                            }
                            const printedType = printTypeNode(argDefinition.type, context);
                            const printedValue = printValueNode(arg.value);
                            if (!printedType) {
                                continue;
                            }
                            if (printedType !== "Any" && printedType !== printedValue) {
                                if (printedValue === "[]") {
                                    if (argDefinition.type.kind === Kind.LIST_TYPE ||
                                        (argDefinition.type.kind === Kind.NON_NULL_TYPE &&
                                            argDefinition.type.type.kind === Kind.LIST_TYPE)) {
                                        continue;
                                    }
                                }
                                const namedType = namedTypeFromTypeNode(argDefinition.type);
                                const typeName = namedType.name.value;
                                if (printedValue === "Int" && typeName === "Float") {
                                    continue;
                                }
                                context.reportError(new GraphQLError(`Invalid value for "@${directiveName}(${arg.name.value}:)" of type "${print(argDefinition.type)}" in application of "@${directiveName}" to "${coordinate}".`, {
                                    nodes: arg,
                                    extensions: {
                                        code: "INVALID_GRAPHQL",
                                    },
                                }));
                            }
                        }
                    }
                }
            },
        },
    };
}
function printValueNode(valueNode) {
    switch (valueNode.kind) {
        case Kind.LIST:
            if (!valueNode.values.length) {
                return "[]";
            }
            return printValueNode(valueNode.values[0]);
        case Kind.ENUM:
            return "Enum";
        case Kind.NULL:
            return "Null";
        case Kind.INT:
            return "Int";
        case Kind.FLOAT:
            return "Float";
        case Kind.STRING:
            return "String";
        case Kind.BOOLEAN:
            return "Boolean";
        case Kind.OBJECT:
            return "Object";
    }
    throw new Error(`Unknown value node kind: ${valueNode}`);
}
function printTypeNode(typeNode, context) {
    if (typeNode.kind === Kind.NAMED_TYPE) {
        const def = context.getKnownTypeDefinition(typeNode.name.value);
        if (!def) {
            const specifiedScalar = specifiedScalarTypes.find((s) => s.name === typeNode.name.value);
            if (specifiedScalar) {
                return specifiedScalar.name;
            }
            return null;
        }
        switch (def.kind) {
            case Kind.SCALAR_TYPE_DEFINITION:
            case Kind.SCALAR_TYPE_EXTENSION:
                return "Any";
            case Kind.ENUM_TYPE_DEFINITION:
            case Kind.ENUM_TYPE_EXTENSION:
                return "Enum";
            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
            case Kind.INPUT_OBJECT_TYPE_EXTENSION:
            case Kind.OBJECT_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_EXTENSION:
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.INTERFACE_TYPE_EXTENSION:
            case Kind.UNION_TYPE_DEFINITION:
            case Kind.UNION_TYPE_EXTENSION:
                return "Object";
        }
    }
    return printTypeNode(typeNode.type, context);
}
