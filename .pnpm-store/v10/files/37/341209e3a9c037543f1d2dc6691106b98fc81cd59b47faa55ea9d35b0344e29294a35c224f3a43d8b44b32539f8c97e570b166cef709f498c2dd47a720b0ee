"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyRules = KeyRules;
const graphql_1 = require("graphql");
const printer_js_1 = require("../../../../graphql/printer.js");
const helpers_js_1 = require("../../../helpers.js");
function KeyRules(context) {
    return {
        DirectiveDefinition(node) {
            (0, helpers_js_1.validateDirectiveAgainstOriginal)(node, "key", context);
        },
        Directive(directiveNode) {
            if (!context.isAvailableFederationDirective("key", directiveNode)) {
                return;
            }
            const typeDef = context.typeNodeInfo.getTypeDef();
            if (!typeDef) {
                return;
            }
            const typeCoordinate = typeDef.name.value;
            const usedOnObject = typeDef.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                typeDef.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION;
            const usedOnInterface = typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION ||
                typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_EXTENSION ||
                (usedOnObject &&
                    context.stateBuilder.isInterfaceObject(typeDef.name.value));
            if (!usedOnObject && !usedOnInterface) {
                return;
            }
            if (usedOnInterface &&
                context.satisfiesVersionRange("> v1.0") &&
                context.satisfiesVersionRange("< v2.3")) {
                context.reportError(new graphql_1.GraphQLError(`Cannot use @key on interface "${typeCoordinate}": @key is not yet supported on interfaces`, {
                    nodes: directiveNode,
                    extensions: { code: "KEY_UNSUPPORTED_ON_INTERFACE" },
                }));
                return;
            }
            const fieldsArg = (0, helpers_js_1.getFieldsArgument)(directiveNode);
            if (!fieldsArg) {
                return;
            }
            const printedFieldsValue = (0, printer_js_1.print)(fieldsArg.value);
            if (fieldsArg.value.kind !== graphql_1.Kind.STRING) {
                const isListWithStrings = fieldsArg.value.kind === graphql_1.Kind.LIST &&
                    fieldsArg.value.values.every((value) => value.kind === graphql_1.Kind.STRING);
                if (context.satisfiesVersionRange("> v1.0") || !isListWithStrings) {
                    context.reportError(new graphql_1.GraphQLError(`On type "${typeCoordinate}", for @key(fields: ${printedFieldsValue}): Invalid value for argument "fields": must be a string.`, {
                        nodes: directiveNode,
                        extensions: {
                            code: "KEY_INVALID_FIELDS_TYPE",
                        },
                    }));
                    return;
                }
            }
            let selectionSet;
            let normalizedFieldsArgValue = fieldsArg.value.kind === graphql_1.Kind.STRING
                ? fieldsArg.value
                : {
                    kind: graphql_1.Kind.STRING,
                    value: fieldsArg.value.values
                        .map((v) => {
                        if (v.kind !== graphql_1.Kind.STRING) {
                            throw new Error("Expected fields argument value to be a string");
                        }
                        return v.value;
                    })
                        .join(" "),
                };
            if (normalizedFieldsArgValue.kind !== graphql_1.Kind.STRING) {
                throw new Error("Expected fields argument value to be a string");
            }
            try {
                selectionSet = (0, helpers_js_1.parseFields)(normalizedFieldsArgValue.value);
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError) {
                    context.reportError(new graphql_1.GraphQLError(`On type "${typeCoordinate}", for @key(fields: ${printedFieldsValue}): ${error.message}`, {
                        nodes: directiveNode,
                        extensions: {
                            code: "KEY_INVALID_FIELDS",
                        },
                    }));
                    return;
                }
                throw error;
            }
            if (!selectionSet) {
                return;
            }
            const knownObjectsAndInterfaces = context.getSubgraphObjectOrInterfaceTypes();
            let isValid = true;
            const fieldsUsedInKey = new Set();
            const mergedTypeDef = context
                .getSubgraphObjectOrInterfaceTypes()
                .get(typeDef.name.value);
            if (!mergedTypeDef) {
                throw new Error(`Could not find type "${typeDef.name.value}"`);
            }
            (0, helpers_js_1.visitFields)({
                context,
                selectionSet,
                typeDefinition: mergedTypeDef,
                interceptField(info) {
                    if (info.typeDefinition.name.value === typeDef.name.value) {
                        fieldsUsedInKey.add(info.fieldName);
                    }
                    context.markAsKeyField(`${info.typeDefinition.name.value}.${info.fieldName}`);
                },
                interceptUnknownField(info) {
                    isValid = false;
                    context.reportError(new graphql_1.GraphQLError(`On type "${typeCoordinate}", for @key(fields: ${printedFieldsValue}): Cannot query field "${info.fieldName}" on type "${info.typeDefinition.name.value}" (the field should either be added to this subgraph or, if it should not be resolved by this subgraph, you need to add it to this subgraph with @external).`, {
                        nodes: directiveNode,
                        extensions: { code: "KEY_INVALID_FIELDS" },
                    }));
                },
                interceptDirective(info) {
                    isValid = false;
                    if (info.isKnown) {
                        context.reportError(new graphql_1.GraphQLError(`On type "${typeCoordinate}", for @key(fields: ${printedFieldsValue}): cannot have directive applications in the @key(fields:) argument but found @${info.directiveName}.`, {
                            nodes: directiveNode,
                            extensions: { code: "KEY_DIRECTIVE_IN_FIELDS_ARG" },
                        }));
                    }
                    else {
                        context.reportError(new graphql_1.GraphQLError(`On type "${typeCoordinate}", for @key(fields: ${printedFieldsValue}): Unknown directive "@${info.directiveName}"`, {
                            nodes: directiveNode,
                            extensions: { code: "KEY_INVALID_FIELDS" },
                        }));
                    }
                },
                interceptArguments(info) {
                    isValid = false;
                    context.reportError(new graphql_1.GraphQLError(`On type "${typeCoordinate}", for @key(fields: ${printedFieldsValue}): field ${info.typeDefinition.name.value}.${info.fieldName} cannot be included because it has arguments (fields with argument are not allowed in @key)`, {
                        nodes: directiveNode,
                        extensions: { code: "KEY_FIELDS_HAS_ARGS" },
                    }));
                },
                interceptInterfaceType(info) {
                    isValid = false;
                    context.reportError(new graphql_1.GraphQLError(`On type "${typeCoordinate}", for @key(fields: ${printedFieldsValue}): field "${info.typeDefinition.name.value}.${info.fieldName}" is a Interface type which is not allowed in @key`, {
                        nodes: directiveNode,
                        extensions: { code: "KEY_FIELDS_SELECT_INVALID_TYPE" },
                    }));
                },
            });
            if (usedOnInterface) {
                const expectedFieldsValue = normalizedFieldsArgValue.value;
                knownObjectsAndInterfaces.forEach((def) => {
                    const defIsObjectType = def.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                        def.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION;
                    if (defIsObjectType &&
                        def.interfaces?.some((i) => i.name.value === typeDef.name.value)) {
                        let shouldError = true;
                        const keyDirectives = def.directives?.filter((d) => context.isAvailableFederationDirective("key", d));
                        if (!!keyDirectives?.length) {
                            for (const keyDirective of keyDirectives) {
                                const fieldsArg = (0, helpers_js_1.getFieldsArgument)(keyDirective);
                                if (fieldsArg &&
                                    fieldsArg.value.kind === graphql_1.Kind.STRING &&
                                    fieldsArg.value.value === expectedFieldsValue) {
                                    shouldError = false;
                                }
                            }
                        }
                        if (shouldError && context.satisfiesVersionRange("> v1.0")) {
                            isValid = false;
                            context.reportError(new graphql_1.GraphQLError(`Key @key(fields: ${printedFieldsValue}) on interface type "${typeDef.name.value}" is missing on implementation type "${def.name.value}".`, {
                                nodes: directiveNode,
                                extensions: { code: "INTERFACE_KEY_NOT_ON_IMPLEMENTATION" },
                            }));
                        }
                    }
                });
            }
            if (isValid) {
                const resolvableArgValue = directiveNode.arguments?.find((arg) => arg.name.value === "resolvable" && arg.value.kind === graphql_1.Kind.BOOLEAN)?.value;
                const resolvable = resolvableArgValue?.value ?? true;
                if (usedOnInterface) {
                    context.stateBuilder.interfaceType.setKey(typeDef.name.value, normalizedFieldsArgValue.value, fieldsUsedInKey, resolvable);
                    return;
                }
                context.stateBuilder.objectType.setKey(typeDef.name.value, normalizedFieldsArgValue.value, fieldsUsedInKey, resolvable);
            }
        },
    };
}
