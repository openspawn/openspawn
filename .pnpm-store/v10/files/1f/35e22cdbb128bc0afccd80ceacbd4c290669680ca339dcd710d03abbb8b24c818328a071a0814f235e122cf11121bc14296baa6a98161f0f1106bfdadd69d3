"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDirectiveAgainstOriginal = validateDirectiveAgainstOriginal;
exports.visitFields = visitFields;
exports.getFieldsArgument = getFieldsArgument;
exports.parseFields = parseFields;
exports.namedTypeFromTypeNode = namedTypeFromTypeNode;
exports.isDirectiveDefinitionNode = isDirectiveDefinitionNode;
exports.printOutputType = printOutputType;
const graphql_1 = require("graphql");
const printer_js_1 = require("../graphql/printer.js");
function validateDirectiveAgainstOriginal(providedDirectiveNode, directiveName, context) {
    if (!context.isAvailableFederationDirective(directiveName, providedDirectiveNode)) {
        return;
    }
    const isFederationV2 = context.satisfiesVersionRange(">= v2.0");
    const federationDirective = context
        .getKnownFederationDirectives()
        .find((d) => context.isAvailableFederationDirective(directiveName, d));
    if (!federationDirective) {
        throw new Error(`Federation directive @${directiveName} not found`);
    }
    const errors = [];
    const original = {
        args: new Map(federationDirective.arguments?.map((arg) => [arg.name.value, arg])),
        locations: federationDirective.locations.map((loc) => loc.value),
    };
    const provided = {
        args: new Map(providedDirectiveNode.arguments?.map((arg) => [arg.name.value, arg])),
        locations: providedDirectiveNode.locations.map((loc) => loc.value),
    };
    for (const [argName, argDef] of original.args.entries()) {
        const providedArgNode = provided.args.get(argName);
        if (isNonNullTypeNode(argDef.type) && !providedArgNode) {
            errors.push(new graphql_1.GraphQLError(`Invalid definition for directive "@${directiveName}": missing required argument "${argName}"`, {
                nodes: providedDirectiveNode,
                extensions: { code: "DIRECTIVE_DEFINITION_INVALID" },
            }));
        }
        if (providedArgNode) {
            const expectedType = (0, printer_js_1.print)(argDef.type);
            const providedType = (0, printer_js_1.print)(providedArgNode.type);
            if (expectedType !== providedType) {
                const isNonNullableString = providedType === "String!";
                const allowedFieldSetTypes = isFederationV2
                    ? ["FieldSet!", "federation__FieldSet!", "_FieldSet!", "[String!]!"]
                    : ["_FieldSet!", "String", "String!"];
                const fieldSetTypesInSpec = isFederationV2
                    ? ["FieldSet!", "federation__FieldSet!", "_FieldSet!", "[String!]!"]
                    : ["_FieldSet!", "FieldSet!", "String"];
                const expectsFieldSet = fieldSetTypesInSpec.includes(expectedType);
                if (!isNonNullableString && expectsFieldSet) {
                    const isOneOfExpected = allowedFieldSetTypes
                        .concat(allowedFieldSetTypes.map((f) => `[${f}]!`))
                        .includes(providedType);
                    if (!isOneOfExpected) {
                        errors.push(new graphql_1.GraphQLError(`Invalid definition for directive "@${directiveName}": argument "${argName}" should have type "${expectedType}" but found type "${providedType}"`, {
                            nodes: providedDirectiveNode,
                            extensions: { code: "DIRECTIVE_DEFINITION_INVALID" },
                        }));
                    }
                }
            }
            if (expectedType === "Boolean" &&
                argDef.defaultValue?.kind === graphql_1.Kind.BOOLEAN) {
                let providedValue = null;
                if (providedArgNode.defaultValue) {
                    if (providedArgNode.defaultValue.kind !== graphql_1.Kind.BOOLEAN) {
                        throw new Error("Expected a Boolean");
                    }
                    providedValue = providedArgNode.defaultValue.value;
                }
                if (argDef.defaultValue?.value !== providedValue) {
                    errors.push(new graphql_1.GraphQLError(`Invalid definition for directive "@${directiveName}": argument "${argName}" should have default value ${argDef.defaultValue ? "true" : "false"} but found default value ${providedValue ?? "null"}`, {
                        nodes: providedDirectiveNode,
                        extensions: { code: "DIRECTIVE_DEFINITION_INVALID" },
                    }));
                }
            }
        }
    }
    const locationIntersection = provided.locations.filter((loc) => original.locations.includes(loc));
    if (!locationIntersection.length) {
        errors.push(new graphql_1.GraphQLError(`Invalid definition for directive "@${directiveName}": "@${directiveName}" should have locations ${Array.from(original.locations).join(", ")}, but found (non-subset) ${Array.from(provided.locations).join(", ")}`, {
            nodes: providedDirectiveNode,
            extensions: { code: "DIRECTIVE_DEFINITION_INVALID" },
        }));
    }
    if (errors.length) {
        for (const error of errors) {
            context.reportError(error);
        }
    }
    else {
        context.markAsFederationDefinitionReplacement(providedDirectiveNode.name.value);
    }
}
function visitFields({ context, selectionSet, typeDefinition, interceptField, interceptArguments, interceptUnknownField, interceptDirective, interceptInterfaceType, interceptExternalField, interceptNonExternalField, interceptFieldWithMissingSelectionSet, }) {
    for (const selection of selectionSet.selections) {
        if (selection.kind === graphql_1.Kind.FRAGMENT_SPREAD) {
            continue;
        }
        if (selection.kind === graphql_1.Kind.INLINE_FRAGMENT) {
            if (!selection.typeCondition) {
                continue;
            }
            const interfaceName = selection.typeCondition.name.value;
            const interfaceDefinition = context
                .getSubgraphObjectOrInterfaceTypes()
                .get(interfaceName);
            if (!interfaceDefinition) {
                continue;
            }
            visitFields({
                context,
                selectionSet: selection.selectionSet,
                typeDefinition: interfaceDefinition,
                interceptArguments,
                interceptUnknownField,
                interceptInterfaceType,
            });
            continue;
        }
        const selectionFieldDef = selection.name.value === "__typename"
            ? {
                kind: graphql_1.Kind.FIELD_DEFINITION,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "__typename",
                },
                type: {
                    kind: graphql_1.Kind.NAMED_TYPE,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "String",
                    },
                },
            }
            : typeDefinition.fields?.find((field) => field.name.value === selection.name.value);
        if (!selectionFieldDef) {
            if (interceptUnknownField) {
                interceptUnknownField({
                    typeDefinition,
                    fieldName: selection.name.value,
                });
            }
            break;
        }
        const isTypename = selection.name.value === "__typename";
        if (!isTypename && interceptDirective && selection.directives?.length) {
            for (const directive of selection.directives) {
                interceptDirective({
                    directiveName: directive.name.value,
                    isKnown: context
                        .getSubgraphDirectiveDefinitions()
                        .has(directive.name.value),
                });
            }
        }
        if (!isTypename) {
            context.markAsUsed("fields", typeDefinition.kind, typeDefinition.name.value, selectionFieldDef.name.value);
        }
        if (!isTypename && interceptField) {
            interceptField({
                typeDefinition,
                fieldName: selection.name.value,
            });
        }
        if (!isTypename &&
            selectionFieldDef.arguments?.length &&
            interceptArguments) {
            interceptArguments({
                typeDefinition,
                fieldName: selection.name.value,
            });
            continue;
        }
        if (!isTypename && (interceptNonExternalField || interceptExternalField)) {
            const isExternal = selectionFieldDef.directives?.some((d) => context.isAvailableFederationDirective("external", d)) ||
                typeDefinition.directives?.some((d) => context.isAvailableFederationDirective("external", d));
            const fieldName = selection.name.value;
            const fieldDef = typeDefinition.fields?.find((field) => field.name.value === fieldName);
            if (!fieldDef) {
                continue;
            }
            const namedType = namedTypeFromTypeNode(fieldDef.type);
            const isLeaf = context.isLeafType(namedType.name.value);
            if (isLeaf) {
                if (isExternal && interceptExternalField) {
                    interceptExternalField({
                        typeDefinition,
                        fieldName,
                    });
                }
                else if (!isExternal && interceptNonExternalField) {
                    interceptNonExternalField({
                        typeDefinition,
                        fieldName,
                    });
                }
            }
        }
        const handleInnerSelection = ((selection, selectionFieldDef) => function handleInnerSelectionImpl(innerTypeDef) {
            if (!isTypename &&
                interceptInterfaceType &&
                (innerTypeDef.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION ||
                    innerTypeDef.kind === graphql_1.Kind.INTERFACE_TYPE_EXTENSION)) {
                interceptInterfaceType({
                    typeDefinition,
                    fieldName: selection.name.value,
                });
            }
            const innerSelection = selection.selectionSet;
            if (!innerSelection) {
                if (interceptFieldWithMissingSelectionSet) {
                    interceptFieldWithMissingSelectionSet({
                        typeDefinition,
                        fieldName: selection.name.value,
                        outputType: (0, printer_js_1.print)(selectionFieldDef.type),
                    });
                }
                return;
            }
            visitFields({
                context,
                selectionSet: innerSelection,
                typeDefinition: innerTypeDef,
                interceptField,
                interceptArguments,
                interceptUnknownField,
                interceptInterfaceType,
                interceptDirective,
                interceptExternalField,
                interceptFieldWithMissingSelectionSet,
            });
        })(selection, selectionFieldDef);
        const outputType = namedTypeFromTypeNode(selectionFieldDef.type).name.value;
        const innerTypeDef = context
            .getSubgraphObjectOrInterfaceTypes()
            .get(outputType);
        if (!innerTypeDef) {
            const unionMemberTypeNames = context
                .getSubgraphUnionTypes()
                .get(outputType);
            if (!unionMemberTypeNames) {
                continue;
            }
            for (const typeName of unionMemberTypeNames) {
                const innerTypeDef = context
                    .getSubgraphObjectOrInterfaceTypes()
                    .get(typeName);
                if (!innerTypeDef) {
                    continue;
                }
                handleInnerSelection(innerTypeDef);
            }
            continue;
        }
        handleInnerSelection(innerTypeDef);
    }
}
function getFieldsArgument(directiveNode) {
    const fieldsArg = directiveNode.arguments?.find((arg) => arg.name.value === "fields");
    if (!fieldsArg) {
        return;
    }
    return fieldsArg;
}
function parseFields(fields) {
    const parsed = (0, graphql_1.parse)(fields.trim().startsWith(`{`) ? `query ${fields}` : `query { ${fields} }`).definitions.find((d) => d.kind === graphql_1.Kind.OPERATION_DEFINITION);
    return parsed?.selectionSet;
}
function namedTypeFromTypeNode(type) {
    if (type.kind === graphql_1.Kind.NAMED_TYPE) {
        return type;
    }
    if (type.kind === graphql_1.Kind.LIST_TYPE) {
        return namedTypeFromTypeNode(type.type);
    }
    if (type.kind === graphql_1.Kind.NON_NULL_TYPE) {
        return namedTypeFromTypeNode(type.type);
    }
    throw new Error("Unknown type node: " + type);
}
function isDirectiveDefinitionNode(node) {
    return node.kind === graphql_1.Kind.DIRECTIVE_DEFINITION;
}
function printOutputType(type) {
    if (type.kind === graphql_1.Kind.NAMED_TYPE) {
        return type.name.value;
    }
    if (type.kind === graphql_1.Kind.LIST_TYPE) {
        return `[${printOutputType(type.type)}]`;
    }
    return `${printOutputType(type.type)}!`;
}
function isNonNullTypeNode(node) {
    return node.kind === graphql_1.Kind.NON_NULL_TYPE;
}
