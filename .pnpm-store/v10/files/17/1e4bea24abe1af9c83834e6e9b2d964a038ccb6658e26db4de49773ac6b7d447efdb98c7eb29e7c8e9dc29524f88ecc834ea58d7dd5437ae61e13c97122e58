"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidedArgumentsOnDirectivesRule = ProvidedArgumentsOnDirectivesRule;
const graphql_1 = require("graphql");
const printer_js_1 = require("../../../graphql/printer.js");
const helpers_js_1 = require("../../helpers.js");
function ProvidedArgumentsOnDirectivesRule(context) {
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
                            if (argDefinition.type.kind === graphql_1.Kind.NON_NULL_TYPE &&
                                arg.value.kind === graphql_1.Kind.NULL) {
                                continue;
                            }
                            const printedType = printTypeNode(argDefinition.type, context);
                            const printedValue = printValueNode(arg.value);
                            if (!printedType) {
                                continue;
                            }
                            if (printedType !== "Any" && printedType !== printedValue) {
                                if (printedValue === "[]") {
                                    if (argDefinition.type.kind === graphql_1.Kind.LIST_TYPE ||
                                        (argDefinition.type.kind === graphql_1.Kind.NON_NULL_TYPE &&
                                            argDefinition.type.type.kind === graphql_1.Kind.LIST_TYPE)) {
                                        continue;
                                    }
                                }
                                const namedType = (0, helpers_js_1.namedTypeFromTypeNode)(argDefinition.type);
                                const typeName = namedType.name.value;
                                if (printedValue === "Int" && typeName === "Float") {
                                    continue;
                                }
                                context.reportError(new graphql_1.GraphQLError(`Invalid value for "@${directiveName}(${arg.name.value}:)" of type "${(0, printer_js_1.print)(argDefinition.type)}" in application of "@${directiveName}" to "${coordinate}".`, {
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
        case graphql_1.Kind.LIST:
            if (!valueNode.values.length) {
                return "[]";
            }
            return printValueNode(valueNode.values[0]);
        case graphql_1.Kind.ENUM:
            return "Enum";
        case graphql_1.Kind.NULL:
            return "Null";
        case graphql_1.Kind.INT:
            return "Int";
        case graphql_1.Kind.FLOAT:
            return "Float";
        case graphql_1.Kind.STRING:
            return "String";
        case graphql_1.Kind.BOOLEAN:
            return "Boolean";
        case graphql_1.Kind.OBJECT:
            return "Object";
    }
    throw new Error(`Unknown value node kind: ${valueNode}`);
}
function printTypeNode(typeNode, context) {
    if (typeNode.kind === graphql_1.Kind.NAMED_TYPE) {
        const def = context.getKnownTypeDefinition(typeNode.name.value);
        if (!def) {
            const specifiedScalar = graphql_1.specifiedScalarTypes.find((s) => s.name === typeNode.name.value);
            if (specifiedScalar) {
                return specifiedScalar.name;
            }
            return null;
        }
        switch (def.kind) {
            case graphql_1.Kind.SCALAR_TYPE_DEFINITION:
            case graphql_1.Kind.SCALAR_TYPE_EXTENSION:
                return "Any";
            case graphql_1.Kind.ENUM_TYPE_DEFINITION:
            case graphql_1.Kind.ENUM_TYPE_EXTENSION:
                return "Enum";
            case graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION:
            case graphql_1.Kind.INPUT_OBJECT_TYPE_EXTENSION:
            case graphql_1.Kind.OBJECT_TYPE_DEFINITION:
            case graphql_1.Kind.OBJECT_TYPE_EXTENSION:
            case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
            case graphql_1.Kind.INTERFACE_TYPE_EXTENSION:
            case graphql_1.Kind.UNION_TYPE_DEFINITION:
            case graphql_1.Kind.UNION_TYPE_EXTENSION:
                return "Object";
        }
    }
    return printTypeNode(typeNode.type, context);
}
