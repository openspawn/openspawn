import { GraphQLError, Kind, } from "graphql";
import { print } from "../../../../graphql/printer.js";
import { getFieldsArgument, namedTypeFromTypeNode, parseFields, validateDirectiveAgainstOriginal, visitFields, } from "../../../helpers.js";
export function ProvidesRules(context) {
    return {
        DirectiveDefinition(node) {
            validateDirectiveAgainstOriginal(node, "provides", context);
        },
        Directive(directiveNode) {
            if (!context.isAvailableFederationDirective("provides", directiveNode)) {
                return;
            }
            const annotatedType = context.typeNodeInfo.getTypeDef();
            const annotatedField = context.typeNodeInfo.getFieldDef();
            if (!annotatedType || !annotatedField) {
                return;
            }
            const fieldCoordinate = `${annotatedType.name.value}.${annotatedField.name.value}`;
            const usedOnInterface = annotatedType.kind === Kind.INTERFACE_TYPE_DEFINITION ||
                annotatedType?.kind === Kind.INTERFACE_TYPE_EXTENSION;
            const knownObjectsAndInterfaces = context.getSubgraphObjectOrInterfaceTypes();
            const outputType = namedTypeFromTypeNode(annotatedField.type);
            const targetType = knownObjectsAndInterfaces.get(outputType.name.value);
            const processTargetType = (() => function processTargetTypeImpl(targetType) {
                if (!targetType) {
                    context.reportError(new GraphQLError(`Invalid @provides directive on field "${fieldCoordinate}": field has type "${print(annotatedField.type)}" which is not a Composite Type`, {
                        nodes: directiveNode,
                        extensions: {
                            code: "PROVIDES_ON_NON_OBJECT_FIELD",
                        },
                    }));
                    return;
                }
                if (usedOnInterface) {
                    context.reportError(new GraphQLError(`Cannot use @provides on field "${fieldCoordinate}" of parent type "${annotatedType.name.value}": @provides is not yet supported within interfaces`, {
                        nodes: directiveNode,
                        extensions: { code: "PROVIDES_UNSUPPORTED_ON_INTERFACE" },
                    }));
                    return;
                }
                const fieldsArg = getFieldsArgument(directiveNode);
                if (!fieldsArg) {
                    return;
                }
                const printedFieldsValue = print(fieldsArg.value);
                if (fieldsArg.value.kind !== Kind.STRING) {
                    context.reportError(new GraphQLError(`On field "${fieldCoordinate}", for @provides(fields: ${printedFieldsValue}): Invalid value for argument "fields": must be a string.`, {
                        nodes: directiveNode,
                        extensions: {
                            code: "PROVIDES_INVALID_FIELDS_TYPE",
                        },
                    }));
                    return;
                }
                let selectionSet;
                try {
                    selectionSet = parseFields(fieldsArg.value.value);
                }
                catch (error) {
                    if (error instanceof GraphQLError) {
                        context.reportError(new GraphQLError(`On field "${fieldCoordinate}", for @provides(fields: ${printedFieldsValue}): ${error.message}`, {
                            nodes: directiveNode,
                            extensions: {
                                code: "PROVIDES_INVALID_FIELDS",
                            },
                        }));
                        return;
                    }
                    throw error;
                }
                if (!selectionSet) {
                    return;
                }
                let isValid = true;
                visitFields({
                    context,
                    selectionSet,
                    typeDefinition: targetType,
                    interceptFieldWithMissingSelectionSet(info) {
                        isValid = false;
                        context.reportError(new GraphQLError(`On field "${fieldCoordinate}", for @provides(fields: ${printedFieldsValue}): Invalid empty selection set for field "${info.typeDefinition.name.value}.${info.fieldName}" of non-leaf type ${info.outputType}`, {
                            nodes: directiveNode,
                            extensions: { code: "PROVIDES_INVALID_FIELDS" },
                        }));
                    },
                    interceptUnknownField(info) {
                        isValid = false;
                        context.reportError(new GraphQLError(`On field "${fieldCoordinate}", for @provides(fields: ${printedFieldsValue}): Cannot query field "${info.fieldName}" on type "${info.typeDefinition.name.value}" (if the field is defined in another subgraph, you need to add it to this subgraph with @external).`, {
                            nodes: directiveNode,
                            extensions: { code: "PROVIDES_INVALID_FIELDS" },
                        }));
                    },
                    interceptDirective(info) {
                        isValid = false;
                        if (info.isKnown) {
                            context.reportError(new GraphQLError(`On field "${fieldCoordinate}", for @provides(fields: ${printedFieldsValue}): cannot have directive applications in the @provides(fields:) argument but found @${info.directiveName}.`, {
                                nodes: directiveNode,
                                extensions: { code: "PROVIDES_DIRECTIVE_IN_FIELDS_ARG" },
                            }));
                        }
                        else {
                            context.reportError(new GraphQLError(`On field "${fieldCoordinate}", for @provides(fields: ${printedFieldsValue}): Unknown directive "@${info.directiveName}" in selection`, {
                                nodes: directiveNode,
                                extensions: { code: "PROVIDES_INVALID_FIELDS" },
                            }));
                        }
                    },
                    interceptArguments(info) {
                        isValid = false;
                        context.reportError(new GraphQLError(`On field "${fieldCoordinate}", for @provides(fields: ${printedFieldsValue}): field ${info.typeDefinition.name.value}.${info.fieldName} cannot be included because it has arguments (fields with argument are not allowed in @provides)`, {
                            nodes: directiveNode,
                            extensions: { code: "PROVIDES_FIELDS_HAS_ARGS" },
                        }));
                    },
                    interceptNonExternalField(info) {
                        if (context.satisfiesVersionRange("> v1.0")) {
                            isValid = false;
                            context.reportError(new GraphQLError(`On field "${fieldCoordinate}", for @provides(fields: ${printedFieldsValue}): field "${info.typeDefinition.name.value}.${info.fieldName}" should not be part of a @provides since it is already provided by this subgraph (it is not marked @external)`, {
                                extensions: {
                                    code: "PROVIDES_FIELDS_MISSING_EXTERNAL",
                                },
                            }));
                        }
                    },
                    interceptExternalField(info) {
                        const keyDirectives = info.typeDefinition.directives?.filter((directive) => context.isAvailableFederationDirective("key", directive));
                        if (!keyDirectives?.length) {
                            return;
                        }
                        let interceptedFieldIsPrimaryKeyFromExtension = false;
                        for (const keyDirective of keyDirectives) {
                            if (interceptedFieldIsPrimaryKeyFromExtension) {
                                break;
                            }
                            const fieldsArg = keyDirective.arguments?.find((arg) => arg.name.value === "fields" &&
                                arg.value.kind === Kind.STRING);
                            if (fieldsArg) {
                                const keyFields = parseFields(fieldsArg.value.value);
                                const mergedTypeDef = context
                                    .getSubgraphObjectOrInterfaceTypes()
                                    .get(info.typeDefinition.name.value);
                                if (!mergedTypeDef) {
                                    throw new Error(`Could not find type "${info.typeDefinition.name.value}"`);
                                }
                                if (keyFields) {
                                    visitFields({
                                        context,
                                        selectionSet: keyFields,
                                        typeDefinition: mergedTypeDef,
                                        interceptField(keyFieldInfo) {
                                            if (keyFieldInfo.typeDefinition.name.value ===
                                                info.typeDefinition.name.value &&
                                                keyFieldInfo.fieldName === info.fieldName) {
                                                const isInterfaceType = keyFieldInfo.typeDefinition.kind ===
                                                    Kind.INTERFACE_TYPE_DEFINITION ||
                                                    keyFieldInfo.typeDefinition.kind ===
                                                        Kind.INTERFACE_TYPE_EXTENSION;
                                                if (isInterfaceType) {
                                                    return;
                                                }
                                                const isExtension = keyFieldInfo.typeDefinition.kind ===
                                                    Kind.OBJECT_TYPE_EXTENSION ||
                                                    keyFieldInfo.typeDefinition.kind ===
                                                        Kind.INTERFACE_TYPE_EXTENSION ||
                                                    keyFieldInfo.typeDefinition.directives?.some((directive) => context.isAvailableFederationDirective("extends", directive));
                                                if (isExtension) {
                                                    interceptedFieldIsPrimaryKeyFromExtension = true;
                                                }
                                            }
                                            if (info.typeDefinition.kind ===
                                                Kind.OBJECT_TYPE_DEFINITION ||
                                                info.typeDefinition.kind ===
                                                    Kind.OBJECT_TYPE_EXTENSION) {
                                                if (info.fieldName !== "__typename") {
                                                    context.stateBuilder.objectType.field.markAsProvided(info.typeDefinition.name.value, info.fieldName);
                                                }
                                            }
                                        },
                                    });
                                }
                            }
                        }
                        if (context.satisfiesVersionRange(">= v2.0") &&
                            interceptedFieldIsPrimaryKeyFromExtension) {
                            isValid = false;
                            context.reportError(new GraphQLError(`On field "${fieldCoordinate}", for @provides(fields: ${printedFieldsValue}): field "${info.typeDefinition.name.value}.${info.fieldName}" should not be part of a @provides since it is already "effectively" provided by this subgraph (while it is marked @external, it is a @key field of an extension type, which are not internally considered external for historical/backward compatibility reasons)`, {
                                extensions: {
                                    code: "PROVIDES_FIELDS_MISSING_EXTERNAL",
                                },
                            }));
                        }
                    },
                });
                if (isValid) {
                    context.stateBuilder.objectType.field.setProvides(annotatedType.name.value, annotatedField.name.value, fieldsArg.value.value);
                }
            })();
            if (!targetType) {
                const namedTypes = context
                    .getSubgraphUnionTypes()
                    .get(outputType.name.value);
                if (namedTypes != null) {
                    for (const namedType of namedTypes) {
                        const targetType = knownObjectsAndInterfaces.get(namedType);
                        processTargetType(targetType);
                    }
                    return;
                }
            }
            processTargetType(targetType);
        },
    };
}
