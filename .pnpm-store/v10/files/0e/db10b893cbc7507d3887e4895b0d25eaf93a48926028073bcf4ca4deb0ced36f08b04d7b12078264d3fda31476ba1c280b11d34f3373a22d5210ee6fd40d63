import { Kind, OperationTypeNode, specifiedScalarTypes, DirectiveLocation, } from "graphql";
import { print } from "../graphql/printer.js";
import { isFederationLink, } from "../specifications/federation.js";
import { printOutputType } from "./helpers.js";
import { mergeScopePolicies } from "../utils/auth.js";
export var TypeKind;
(function (TypeKind) {
    TypeKind["OBJECT"] = "OBJECT";
    TypeKind["INTERFACE"] = "INTERFACE";
    TypeKind["ENUM"] = "ENUM";
    TypeKind["UNION"] = "UNION";
    TypeKind["SCALAR"] = "SCALAR";
    TypeKind["INPUT_OBJECT"] = "INPUT_OBJECT";
    TypeKind["DIRECTIVE"] = "DIRECTIVE";
})(TypeKind || (TypeKind = {}));
export var ArgumentKind;
(function (ArgumentKind) {
    ArgumentKind["SCALAR"] = "SCALAR";
    ArgumentKind["OBJECT"] = "OBJECT";
    ArgumentKind["ENUM"] = "ENUM";
})(ArgumentKind || (ArgumentKind = {}));
const MISSING = "MISSING";
export function createSubgraphStateBuilder(graph, typeDefs, version, links) {
    const federationLink = links.find(isFederationLink);
    const linksWithDirective = links.filter((link) => !isFederationLink(link) &&
        link.imports.some((im) => im.kind === "directive"));
    const isLinkSpecManuallyProvided = typeDefs.definitions.some((def) => def.kind === Kind.DIRECTIVE_DEFINITION &&
        def.name.value === "link" &&
        def.locations.every((loc) => loc.value === "SCHEMA"));
    const specifiedScalars = specifiedScalarTypes.map((type) => type.name);
    const state = {
        graph: {
            ...graph,
            version,
        },
        types: new Map(),
        schema: {},
        links: linksWithDirective,
        specs: {
            tag: false,
            cost: {
                used: false,
                names: {
                    cost: null,
                    listSize: null,
                },
            },
            inaccessible: false,
            authenticated: false,
            requiresScopes: false,
            policy: false,
            link: isLinkSpecManuallyProvided,
        },
        federation: {
            version,
            imports: federationLink?.imports ?? [],
        },
    };
    const schemaDef = typeDefs.definitions.find(isSchemaDefinition);
    const leafTypeNames = new Set(specifiedScalars);
    const enumTypeNames = new Set();
    const inputObjectTypeNames = new Set();
    for (const typeDef of typeDefs.definitions) {
        if (typeDef.kind === Kind.ENUM_TYPE_DEFINITION ||
            typeDef.kind === Kind.ENUM_TYPE_EXTENSION) {
            enumTypeNames.add(typeDef.name.value);
            leafTypeNames.add(typeDef.name.value);
        }
        else if (typeDef.kind === Kind.SCALAR_TYPE_DEFINITION ||
            typeDef.kind === Kind.SCALAR_TYPE_EXTENSION) {
            leafTypeNames.add(typeDef.name.value);
        }
        else if (typeDef.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ||
            typeDef.kind === Kind.INPUT_OBJECT_TYPE_EXTENSION) {
            inputObjectTypeNames.add(typeDef.name.value);
        }
    }
    const expectedQueryTypeName = decideOnRootTypeName(schemaDef, OperationTypeNode.QUERY, "Query");
    const expectedMutationTypeName = decideOnRootTypeName(schemaDef, OperationTypeNode.MUTATION, "Mutation");
    const expectedSubscriptionTypeName = decideOnRootTypeName(schemaDef, OperationTypeNode.SUBSCRIPTION, "Subscription");
    const composedDirectives = new Set();
    const directiveBuilder = directiveFactory(state);
    const scalarTypeBuilder = scalarTypeFactory(state);
    const interfaceTypeBuilder = interfaceTypeFactory(state);
    const objectTypeBuilder = objectTypeFactory(state, renameObjectType, interfaceTypeBuilder, isInterfaceObject);
    const inputObjectTypeBuilder = inputObjectTypeFactory(state);
    const unionTypeBuilder = unionTypeFactory(state);
    const enumTypeBuilder = enumTypeFactory(state);
    function resolveArgumentKind(typeName) {
        if (enumTypeNames.has(typeName)) {
            return ArgumentKind.ENUM;
        }
        if (inputObjectTypeNames.has(typeName)) {
            return ArgumentKind.OBJECT;
        }
        return ArgumentKind.SCALAR;
    }
    function renameObjectType(typeName) {
        if (typeName === expectedQueryTypeName) {
            return "Query";
        }
        if (typeName === expectedMutationTypeName) {
            return "Mutation";
        }
        if (typeName === expectedSubscriptionTypeName) {
            return "Subscription";
        }
        return typeName;
    }
    function isInterfaceObject(typeName) {
        const found = state.types.get(typeName);
        if (!found) {
            return false;
        }
        if (found.kind !== TypeKind.INTERFACE) {
            return false;
        }
        return found.isInterfaceObject;
    }
    return {
        isInterfaceObject,
        directive: directiveBuilder,
        scalarType: scalarTypeBuilder,
        objectType: objectTypeBuilder,
        interfaceType: interfaceTypeBuilder,
        inputObjectType: inputObjectTypeBuilder,
        unionType: unionTypeBuilder,
        enumType: enumTypeBuilder,
        composedDirectives,
        state,
        markCostSpecAsUsed(directive, name) {
            state.specs.cost.used = true;
            state.specs.cost.names[directive] = name;
        },
        markSpecAsUsed(specName) {
            state.specs[specName] = true;
        },
        visitor(typeNodeInfo) {
            const enumTypes = typeDefs.definitions.filter(isEnumType);
            const enumTypesByName = new Set(enumTypes ? enumTypes.map((enumType) => enumType.name.value) : []);
            return {
                FieldDefinition(node) {
                    const typeDef = typeNodeInfo.getTypeDef();
                    if (!typeDef) {
                        throw new Error(`Expected to find a type definition or extension`);
                    }
                    const isInterfaceType = typeDef.kind === Kind.INTERFACE_TYPE_DEFINITION ||
                        typeDef.kind === Kind.INTERFACE_TYPE_EXTENSION;
                    const isObjectType = typeDef.kind === Kind.OBJECT_TYPE_DEFINITION ||
                        typeDef.kind === Kind.OBJECT_TYPE_EXTENSION;
                    const outputTypeName = resolveTypeName(node.type);
                    const isLeaf = leafTypeNames.has(outputTypeName);
                    const referencesEnumType = enumTypesByName.has(outputTypeName);
                    if (referencesEnumType) {
                        enumTypeBuilder.setReferencedByOutputType(outputTypeName, `${typeDef.name.value}.${node.name.value}`);
                    }
                    if (isInterfaceType || isInterfaceObject(typeDef.name.value)) {
                        interfaceTypeBuilder.field.setType(typeDef.name.value, node.name.value, printOutputType(node.type));
                        interfaceTypeBuilder.field.setUsed(typeDef.name.value, node.name.value);
                        if (isLeaf) {
                            interfaceTypeBuilder.field.setLeaf(typeDef.name.value, node.name.value);
                        }
                        return;
                    }
                    if (!isObjectType) {
                        throw new Error(`Expected to find an object type`);
                    }
                    objectTypeBuilder.field.setType(typeDef.name.value, node.name.value, printOutputType(node.type));
                    if (isLeaf) {
                        objectTypeBuilder.field.setLeaf(typeDef.name.value, node.name.value);
                    }
                    if (typeDef.kind ===
                        Kind.OBJECT_TYPE_EXTENSION) {
                        objectTypeBuilder.field.setExtension(typeDef.name.value, node.name.value);
                    }
                    if (version === "v1.0" &&
                        (typeDef.kind === Kind.OBJECT_TYPE_DEFINITION ||
                            typeDef.name.value === expectedQueryTypeName ||
                            typeDef.name.value === expectedMutationTypeName ||
                            typeDef.name.value === expectedSubscriptionTypeName)) {
                        objectTypeBuilder.field.setShareable(typeDef.name.value, node.name.value);
                    }
                },
                InputValueDefinition(node) {
                    const typeDef = typeNodeInfo.getTypeDef();
                    const fieldDef = typeNodeInfo.getFieldDef();
                    if (!typeDef) {
                        return;
                    }
                    const isInputObjectType = typeDef.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ||
                        typeDef.kind === Kind.INPUT_OBJECT_TYPE_EXTENSION;
                    const isObjectType = typeDef.kind === Kind.OBJECT_TYPE_DEFINITION ||
                        typeDef.kind === Kind.OBJECT_TYPE_EXTENSION;
                    const isInterfaceType = typeDef.kind === Kind.INTERFACE_TYPE_DEFINITION ||
                        typeDef.kind === Kind.INTERFACE_TYPE_EXTENSION;
                    const outputTypeName = resolveTypeName(node.type);
                    const referencesEnumType = enumTypesByName.has(outputTypeName);
                    if (isInputObjectType) {
                        inputObjectTypeBuilder.field.setType(typeDef.name.value, node.name.value, printOutputType(node.type));
                        inputObjectTypeBuilder.field.setKind(typeDef.name.value, node.name.value, resolveArgumentKind(outputTypeName));
                        if (referencesEnumType) {
                            enumTypeBuilder.setReferencedByInputType(outputTypeName, `${typeDef.name.value}.${node.name.value}`);
                        }
                        if (node.defaultValue) {
                            inputObjectTypeBuilder.field.setDefaultValue(typeDef.name.value, node.name.value, print(node.defaultValue));
                        }
                    }
                    if (isObjectType && fieldDef) {
                        objectTypeBuilder.field.arg.setType(typeDef.name.value, fieldDef.name.value, node.name.value, printOutputType(node.type));
                        objectTypeBuilder.field.arg.setKind(typeDef.name.value, fieldDef.name.value, node.name.value, resolveArgumentKind(outputTypeName));
                        if (node.defaultValue) {
                            objectTypeBuilder.field.arg.setDefaultValue(typeDef.name.value, fieldDef.name.value, node.name.value, print(node.defaultValue));
                        }
                        if (referencesEnumType) {
                            enumTypeBuilder.setReferencedByInputType(outputTypeName, `${typeDef.name.value}.${fieldDef.name.value}(${node.name.value}:)`);
                        }
                    }
                    if (isInterfaceType && fieldDef) {
                        interfaceTypeBuilder.field.arg.setType(typeDef.name.value, fieldDef.name.value, node.name.value, printOutputType(node.type));
                        interfaceTypeBuilder.field.arg.setKind(typeDef.name.value, fieldDef.name.value, node.name.value, resolveArgumentKind(outputTypeName));
                        if (node.defaultValue) {
                            interfaceTypeBuilder.field.arg.setDefaultValue(typeDef.name.value, fieldDef.name.value, node.name.value, print(node.defaultValue));
                        }
                    }
                },
                ObjectTypeDefinition(node) {
                    if (hasInterfaceObjectDirective(node)) {
                        interfaceTypeBuilder.setDefinition(node.name.value);
                        interfaceTypeBuilder.setInterfaceObject(node.name.value);
                        if (node.interfaces) {
                            for (const interfaceNode of node.interfaces) {
                                interfaceTypeBuilder.setInterface(node.name.value, interfaceNode.name.value);
                            }
                        }
                        return;
                    }
                    objectTypeBuilder.setDefinition(node.name.value);
                    if (node.name.value === expectedQueryTypeName) {
                        state.schema.queryType = renameObjectType(node.name.value);
                    }
                    else if (node.name.value === expectedMutationTypeName) {
                        state.schema.mutationType = renameObjectType(node.name.value);
                    }
                    else if (node.name.value === expectedSubscriptionTypeName) {
                        state.schema.subscriptionType = renameObjectType(node.name.value);
                    }
                    if (node.interfaces) {
                        for (const interfaceNode of node.interfaces) {
                            objectTypeBuilder.setInterface(node.name.value, interfaceNode.name.value);
                        }
                    }
                },
                ObjectTypeExtension(node) {
                    if (hasInterfaceObjectDirective(node)) {
                    }
                    if (node.name.value === expectedQueryTypeName) {
                        state.schema.queryType = renameObjectType(node.name.value);
                    }
                    else if (node.name.value === expectedMutationTypeName) {
                        state.schema.mutationType = renameObjectType(node.name.value);
                    }
                    else if (node.name.value === expectedSubscriptionTypeName) {
                        state.schema.subscriptionType = renameObjectType(node.name.value);
                    }
                    objectTypeBuilder.setExtension(node.name.value, "extend");
                    if (node.interfaces) {
                        for (const interfaceNode of node.interfaces) {
                            objectTypeBuilder.setInterface(node.name.value, interfaceNode.name.value);
                        }
                    }
                },
                InterfaceTypeDefinition(node) {
                    interfaceTypeBuilder.setDefinition(node.name.value);
                    if (node.interfaces) {
                        for (const interfaceNode of node.interfaces) {
                            interfaceTypeBuilder.setInterface(node.name.value, interfaceNode.name.value);
                        }
                    }
                },
                InterfaceTypeExtension(node) {
                    if (version !== "v1.0") {
                        interfaceTypeBuilder.setExtension(node.name.value);
                    }
                    if (node.interfaces) {
                        for (const interfaceNode of node.interfaces) {
                            interfaceTypeBuilder.setInterface(node.name.value, interfaceNode.name.value);
                        }
                    }
                },
                UnionTypeDefinition(node) {
                    unionTypeBuilder.setDefinition(node.name.value);
                    if (node.types) {
                        for (const member of node.types) {
                            unionTypeBuilder.setMember(node.name.value, member.name.value);
                        }
                    }
                },
                UnionTypeExtension(node) {
                    if (node.types) {
                        for (const member of node.types) {
                            unionTypeBuilder.setMember(node.name.value, member.name.value);
                        }
                    }
                },
                EnumTypeDefinition(node) {
                    enumTypeBuilder.setDefinition(node.name.value);
                },
                EnumValueDefinition(node) {
                    const typeDef = typeNodeInfo.getTypeDef();
                    if (!typeDef) {
                        return;
                    }
                    enumTypeBuilder.value.setValue(typeDef.name.value, node.name.value);
                },
                InputObjectTypeDefinition(node) {
                    inputObjectTypeBuilder.setDefinition(node.name.value);
                },
                ScalarTypeDefinition(node) {
                    if (!specifiedScalars.includes(node.name.value)) {
                        scalarTypeBuilder.setDefinition(node.name.value);
                    }
                },
                ScalarTypeExtension() {
                },
                Directive(node) {
                    if (composedDirectives.has(node.name.value)) {
                        const typeDef = typeNodeInfo.getTypeDef();
                        const fieldDef = typeNodeInfo.getFieldDef();
                        const enumValueDef = typeNodeInfo.getValueDef();
                        const argDef = typeNodeInfo.getArgumentDef();
                        if (!typeDef) {
                            return;
                        }
                        switch (typeDef.kind) {
                            case Kind.OBJECT_TYPE_DEFINITION:
                            case Kind.OBJECT_TYPE_EXTENSION:
                                if (argDef) {
                                    objectTypeBuilder.field.arg.setDirective(typeDef.name.value, fieldDef.name.value, argDef.name.value, node);
                                }
                                else if (fieldDef) {
                                    objectTypeBuilder.field.setDirective(typeDef.name.value, fieldDef.name.value, node);
                                }
                                else {
                                    objectTypeBuilder.setDirective(typeDef.name.value, node);
                                }
                                break;
                            case Kind.INTERFACE_TYPE_DEFINITION:
                            case Kind.INTERFACE_TYPE_EXTENSION:
                                if (argDef) {
                                    interfaceTypeBuilder.field.arg.setDirective(typeDef.name.value, fieldDef.name.value, argDef.name.value, node);
                                }
                                else if (fieldDef) {
                                    interfaceTypeBuilder.field.setDirective(typeDef.name.value, fieldDef.name.value, node);
                                }
                                else {
                                    interfaceTypeBuilder.setDirective(typeDef.name.value, node);
                                }
                                break;
                            case Kind.SCALAR_TYPE_DEFINITION:
                            case Kind.SCALAR_TYPE_EXTENSION: {
                                scalarTypeBuilder.setDirective(typeDef.name.value, node);
                                break;
                            }
                            case Kind.DIRECTIVE_DEFINITION: {
                                if (fieldDef) {
                                    directiveBuilder.arg.setDirective(typeDef.name.value, fieldDef.name.value, node);
                                }
                                break;
                            }
                            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                            case Kind.INPUT_OBJECT_TYPE_EXTENSION: {
                                if (fieldDef) {
                                    inputObjectTypeBuilder.field.setDirective(typeDef.name.value, fieldDef.name.value, node);
                                }
                                else {
                                    inputObjectTypeBuilder.setDirective(typeDef.name.value, node);
                                }
                                break;
                            }
                            case Kind.ENUM_TYPE_DEFINITION:
                            case Kind.ENUM_TYPE_EXTENSION: {
                                if (enumValueDef) {
                                    enumTypeBuilder.value.setDirective(typeDef.name.value, enumValueDef.name.value, node);
                                }
                                else {
                                    enumTypeBuilder.setDirective(typeDef.name.value, node);
                                }
                                break;
                            }
                            case Kind.UNION_TYPE_DEFINITION:
                            case Kind.UNION_TYPE_EXTENSION: {
                                unionTypeBuilder.setDirective(typeDef.name.value, node);
                                break;
                            }
                            default:
                                throw new Error(`Directives on "${typeof typeDef === "object" && typeDef !== null && "kind" in typeDef ? typeDef.kind : typeDef}" types are not supported yet`);
                        }
                    }
                    else if (node.name.value === "specifiedBy") {
                        const typeDef = typeNodeInfo.getTypeDef();
                        if (typeDef &&
                            (typeDef.kind === Kind.SCALAR_TYPE_DEFINITION ||
                                typeDef.kind === Kind.SCALAR_TYPE_EXTENSION)) {
                            const urlValue = node.arguments?.find((arg) => arg.name.value === "url")?.value;
                            if (urlValue?.kind === Kind.STRING) {
                                scalarTypeBuilder.setSpecifiedBy(typeDef.name.value, urlValue.value);
                            }
                        }
                    }
                    else if (node.name.value === "deprecated") {
                        const typeDef = typeNodeInfo.getTypeDef();
                        const fieldDef = typeNodeInfo.getFieldDef();
                        const argDef = typeNodeInfo.getArgumentDef();
                        if (!typeDef) {
                            return;
                        }
                        const reasonValue = node.arguments?.find((arg) => arg.name.value === "reason")?.value;
                        const reason = reasonValue?.kind === Kind.STRING ? reasonValue.value : undefined;
                        switch (typeDef.kind) {
                            case Kind.OBJECT_TYPE_DEFINITION:
                            case Kind.OBJECT_TYPE_EXTENSION: {
                                if (!fieldDef) {
                                    return;
                                }
                                if (argDef) {
                                    objectTypeBuilder.field.arg.setDeprecated(typeDef.name.value, fieldDef.name.value, argDef.name.value, reason);
                                }
                                else {
                                    objectTypeBuilder.field.setDeprecated(typeDef.name.value, fieldDef.name.value, reason);
                                }
                                break;
                            }
                            case Kind.INTERFACE_TYPE_DEFINITION:
                            case Kind.INTERFACE_TYPE_EXTENSION: {
                                if (!fieldDef) {
                                    return;
                                }
                                if (argDef) {
                                    interfaceTypeBuilder.field.arg.setDeprecated(typeDef.name.value, fieldDef.name.value, argDef.name.value, reason);
                                }
                                else {
                                    interfaceTypeBuilder.field.setDeprecated(typeDef.name.value, fieldDef.name.value, reason);
                                }
                                break;
                            }
                            case Kind.ENUM_TYPE_DEFINITION:
                            case Kind.ENUM_TYPE_EXTENSION: {
                                const valueDef = typeNodeInfo.getValueDef();
                                if (!valueDef) {
                                    return;
                                }
                                enumTypeBuilder.value.setDeprecated(typeDef.name.value, valueDef.name.value, reason);
                                break;
                            }
                            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                            case Kind.INPUT_OBJECT_TYPE_EXTENSION: {
                                if (!fieldDef) {
                                    return;
                                }
                                inputObjectTypeBuilder.field.setDeprecated(typeDef.name.value, fieldDef.name.value, reason);
                                break;
                            }
                        }
                    }
                },
                DirectiveDefinition(node) {
                    const directiveName = node.name.value;
                    if (node.repeatable) {
                        directiveBuilder.setRepeatable(directiveName);
                    }
                    if (node.locations) {
                        for (const location of node.locations) {
                            directiveBuilder.setLocation(directiveName, location.value);
                        }
                    }
                    if (node.arguments?.length) {
                        for (const arg of node.arguments) {
                            directiveBuilder.arg.setType(directiveName, arg.name.value, printOutputType(arg.type));
                            const outputTypeName = resolveTypeName(arg.type);
                            directiveBuilder.arg.setKind(directiveName, arg.name.value, resolveArgumentKind(outputTypeName));
                            if (typeof arg.defaultValue !== "undefined") {
                                directiveBuilder.arg.setDefaultValue(directiveName, arg.name.value, print(arg.defaultValue));
                            }
                        }
                    }
                },
                StringValue(node, _, parent) {
                    const typeDef = typeNodeInfo.getTypeDef();
                    const fieldDef = typeNodeInfo.getFieldDef();
                    const argDef = typeNodeInfo.getArgumentDef();
                    const description = {
                        value: node.value,
                        block: node.block === true,
                    };
                    if (parent && "kind" in parent) {
                        if (parent.kind === Kind.SCALAR_TYPE_DEFINITION ||
                            parent.kind === Kind.SCALAR_TYPE_EXTENSION) {
                            scalarTypeBuilder.setDescription(parent.name.value, description);
                        }
                        if (parent.kind === Kind.INPUT_VALUE_DEFINITION &&
                            parent.defaultValue?.kind === Kind.STRING &&
                            parent.defaultValue === node) {
                            return;
                        }
                    }
                    if (!typeDef) {
                        return;
                    }
                    function matchesParent(node) {
                        return node === parent;
                    }
                    switch (typeDef.kind) {
                        case Kind.OBJECT_TYPE_DEFINITION:
                        case Kind.OBJECT_TYPE_EXTENSION: {
                            if (argDef && matchesParent(argDef)) {
                                objectTypeBuilder.field.arg.setDescription(typeDef.name.value, fieldDef.name.value, argDef.name.value, description);
                            }
                            else if (fieldDef && matchesParent(fieldDef)) {
                                objectTypeBuilder.field.setDescription(typeDef.name.value, fieldDef.name.value, description);
                            }
                            else if (matchesParent(typeDef)) {
                                objectTypeBuilder.setDescription(typeDef.name.value, description);
                            }
                            break;
                        }
                        case Kind.INTERFACE_TYPE_DEFINITION:
                        case Kind.INTERFACE_TYPE_EXTENSION: {
                            if (argDef && matchesParent(argDef)) {
                                interfaceTypeBuilder.field.arg.setDescription(typeDef.name.value, fieldDef.name.value, argDef.name.value, description);
                            }
                            else if (fieldDef && matchesParent(fieldDef)) {
                                interfaceTypeBuilder.field.setDescription(typeDef.name.value, fieldDef.name.value, description);
                            }
                            else if (matchesParent(typeDef)) {
                                interfaceTypeBuilder.setDescription(typeDef.name.value, description);
                            }
                            break;
                        }
                        case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                        case Kind.INPUT_OBJECT_TYPE_EXTENSION: {
                            if (fieldDef && matchesParent(fieldDef)) {
                                inputObjectTypeBuilder.field.setDescription(typeDef.name.value, fieldDef.name.value, description);
                            }
                            else if (matchesParent(typeDef)) {
                                inputObjectTypeBuilder.setDescription(typeDef.name.value, description);
                            }
                            break;
                        }
                        case Kind.ENUM_TYPE_DEFINITION:
                        case Kind.ENUM_TYPE_EXTENSION: {
                            if (parent &&
                                "kind" in parent &&
                                parent.kind === Kind.ENUM_VALUE_DEFINITION) {
                                enumTypeBuilder.value.setDescription(typeDef.name.value, parent.name.value, description);
                            }
                            else if (matchesParent(typeDef)) {
                                enumTypeBuilder.setDescription(typeDef.name.value, description);
                            }
                            break;
                        }
                        case Kind.UNION_TYPE_DEFINITION:
                        case Kind.UNION_TYPE_EXTENSION: {
                            if (matchesParent(typeDef)) {
                                unionTypeBuilder.setDescription(typeDef.name.value, description);
                            }
                            break;
                        }
                    }
                },
            };
        },
    };
}
function directiveFactory(state) {
    return {
        setComposed(directiveName) {
            getOrCreateDirective(state, directiveName).composed = true;
        },
        setLocation(directiveName, location) {
            getOrCreateDirective(state, directiveName).locations.add(location);
        },
        setRepeatable(directiveName) {
            getOrCreateDirective(state, directiveName).repeatable = true;
        },
        arg: {
            setTag(directiveName, argName, tag) {
                getOrCreateDirectiveArg(state, directiveName, argName).tags.add(tag);
            },
            setType(directiveName, argName, argType) {
                getOrCreateDirectiveArg(state, directiveName, argName).type = argType;
            },
            setKind(directiveName, argName, argKind) {
                getOrCreateDirectiveArg(state, directiveName, argName).kind = argKind;
            },
            setDirective(typeName, argName, directive) {
                getOrCreateDirectiveArg(state, typeName, argName).ast.directives.push(directive);
            },
            setDefaultValue(typeName, argName, defaultValue) {
                getOrCreateDirectiveArg(state, typeName, argName).defaultValue =
                    defaultValue;
            },
            setInaccessible(typeName, argName) {
                getOrCreateDirectiveArg(state, typeName, argName).inaccessible = true;
            },
        },
    };
}
export function cleanSubgraphStateFromFederationSpec(state) {
    state.types.delete("_FieldSet");
    state.types.delete("federation__FieldSet");
    state.types.delete("federation__Policy");
    state.types.delete("federation__Scope");
    return state;
}
export function cleanSubgraphStateFromLinkSpec(state) {
    state.types.delete("link__Import");
    state.types.delete("link__Purpose");
    state.types.delete("link__Import");
    state.types.delete("link");
    return state;
}
function scalarTypeFactory(state) {
    return {
        setDefinition(typeName) {
            getOrCreateScalarType(state, typeName);
        },
        setInaccessible(typeName) {
            getOrCreateScalarType(state, typeName).inaccessible = true;
        },
        setAuthenticated(typeName) {
            getOrCreateScalarType(state, typeName).authenticated = true;
        },
        setPolicies(typeName, policies) {
            const existing = getOrCreateScalarType(state, typeName);
            existing.policies = mergeScopePolicies(existing.policies, policies);
        },
        setScopes(typeName, scopes) {
            const existing = getOrCreateScalarType(state, typeName);
            existing.scopes = mergeScopePolicies(existing.scopes, scopes);
        },
        setCost(typeName, cost) {
            getOrCreateScalarType(state, typeName).cost = cost;
        },
        setTag(typeName, tag) {
            getOrCreateScalarType(state, typeName).tags.add(tag);
        },
        setDirective(typeName, directive) {
            getOrCreateScalarType(state, typeName).ast.directives.push(directive);
        },
        setDescription(typeName, description) {
            getOrCreateScalarType(state, typeName).description = description;
        },
        setSpecifiedBy(typeName, url) {
            getOrCreateScalarType(state, typeName).specifiedBy = url;
        },
    };
}
function objectTypeFactory(state, renameObject, interfaceTypeBuilder, isInterfaceObject) {
    return {
        setDefinition(typeName) {
            if (isInterfaceObject(typeName)) {
                return interfaceTypeBuilder.setDefinition(typeName);
            }
            getOrCreateObjectType(state, renameObject, typeName).isDefinition = true;
        },
        setExtension(typeName, extensionType) {
            if (isInterfaceObject(typeName)) {
                return interfaceTypeBuilder.setExtension(typeName);
            }
            const objectType = getOrCreateObjectType(state, renameObject, typeName);
            objectType.extension = true;
            if (objectType.extensionType !== "@extends") {
                objectType.extensionType = extensionType;
            }
        },
        setDescription(typeName, description) {
            if (isInterfaceObject(typeName)) {
                return interfaceTypeBuilder.setDescription(typeName, description);
            }
            getOrCreateObjectType(state, renameObject, typeName).description =
                description;
        },
        setExternal(typeName) {
            if (isInterfaceObject(typeName)) {
                return;
            }
            const objectType = getOrCreateObjectType(state, renameObject, typeName);
            objectType.external = true;
            for (const field of objectType.fields.values()) {
                field.external = true;
            }
        },
        setInterface(typeName, interfaceName) {
            if (isInterfaceObject(typeName)) {
                return interfaceTypeBuilder.setInterface(typeName, interfaceName);
            }
            getOrCreateObjectType(state, renameObject, typeName).interfaces.add(interfaceName);
            getOrCreateInterfaceType(state, interfaceName).implementedBy.add(typeName);
        },
        setKey(typeName, fields, fieldsUsedInKey, resolvable) {
            if (isInterfaceObject(typeName)) {
                return interfaceTypeBuilder.setKey(typeName, fields, fieldsUsedInKey, resolvable);
            }
            const objectType = getOrCreateObjectType(state, renameObject, typeName);
            objectType.keys.push({ fields, resolvable });
            for (const field of fieldsUsedInKey) {
                objectType.fieldsUsedAsKeys.add(field);
            }
        },
        setInaccessible(typeName) {
            if (isInterfaceObject(typeName)) {
                return interfaceTypeBuilder.setInaccessible(typeName);
            }
            const objectType = getOrCreateObjectType(state, renameObject, typeName);
            objectType.inaccessible = true;
        },
        setAuthenticated(typeName) {
            const objectType = getOrCreateObjectType(state, renameObject, typeName);
            objectType.authenticated = true;
        },
        setPolicies(typeName, policies) {
            const existing = getOrCreateObjectType(state, renameObject, typeName);
            existing.policies = mergeScopePolicies(existing.policies, policies);
        },
        setScopes(typeName, scopes) {
            const existing = getOrCreateObjectType(state, renameObject, typeName);
            existing.scopes = mergeScopePolicies(existing.scopes, scopes);
        },
        setCost(typeName, cost) {
            if (isInterfaceObject(typeName)) {
                return;
            }
            getOrCreateObjectType(state, renameObject, typeName).cost = cost;
        },
        setShareable(typeName) {
            if (isInterfaceObject(typeName)) {
                return;
            }
            getOrCreateObjectType(state, renameObject, typeName).shareable = true;
        },
        setTag(typeName, tag) {
            if (isInterfaceObject(typeName)) {
                return interfaceTypeBuilder.setTag(typeName, tag);
            }
            getOrCreateObjectType(state, renameObject, typeName).tags.add(tag);
        },
        setDirective(typeName, directive) {
            if (isInterfaceObject(typeName)) {
                return interfaceTypeBuilder.setDirective(typeName, directive);
            }
            getOrCreateObjectType(state, renameObject, typeName).ast.directives.push(directive);
        },
        field: {
            setType(typeName, fieldName, fieldType) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setType(typeName, fieldName, fieldType);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).type =
                    fieldType;
            },
            setLeaf(typeName, fieldName) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setLeaf(typeName, fieldName);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).isLeaf = true;
            },
            setExtension(typeName, fieldName) {
                if (isInterfaceObject(typeName)) {
                    return;
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).extension = true;
            },
            setDirective(typeName, fieldName, directive) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setDirective(typeName, fieldName, directive);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).ast.directives.push(directive);
            },
            setDescription(typeName, fieldName, description) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setDescription(typeName, fieldName, description);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).description = description;
            },
            setDeprecated(typeName, fieldName, reason) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setDeprecated(typeName, fieldName, reason);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).deprecated = {
                    reason,
                    deprecated: true,
                };
            },
            setAuthenticated(typeName, fieldName) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setAuthenticated(typeName, fieldName);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).authenticated = true;
            },
            setPolicies(typeName, fieldName, policies) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setPolicies(typeName, fieldName, policies);
                }
                let existing = getOrCreateObjectField(state, renameObject, typeName, fieldName);
                existing.policies = mergeScopePolicies(existing.policies, policies);
            },
            setScopes(typeName, fieldName, scopes) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setScopes(typeName, fieldName, scopes);
                }
                let existing = getOrCreateObjectField(state, renameObject, typeName, fieldName);
                existing.scopes = mergeScopePolicies(existing.scopes, scopes);
            },
            setCost(typeName, fieldName, cost) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setCost(typeName, fieldName, cost);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).cost =
                    cost;
            },
            setListSize(typeName, fieldName, listSize) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setListSize(typeName, fieldName, listSize);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).listSize = listSize;
            },
            setExternal(typeName, fieldName) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setExternal(typeName, fieldName);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).external = true;
            },
            setInaccessible(typeName, fieldName) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setInaccessible(typeName, fieldName);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).inaccessible = true;
            },
            setOverride(typeName, fieldName, override, label) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setOverride(typeName, fieldName, override, label);
                }
                const field = getOrCreateObjectField(state, renameObject, typeName, fieldName);
                field.override = override;
                field.overrideLabel = label;
            },
            setProvides(typeName, fieldName, provides) {
                if (isInterfaceObject(typeName)) {
                    return;
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).provides = provides;
            },
            setRequires(typeName, fieldName, requires) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setRequires(typeName, fieldName, requires);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).requires = requires;
            },
            markAsProvided(typeName, fieldName) {
                if (isInterfaceObject(typeName)) {
                    return;
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).provided = true;
            },
            markedAsRequired(typeName, fieldName) {
                if (isInterfaceObject(typeName)) {
                    return;
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).required = true;
            },
            setShareable(typeName, fieldName) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setShareable(typeName, fieldName);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).shareable = true;
            },
            setTag(typeName, fieldName, tag) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setTag(typeName, fieldName, tag);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).tags.add(tag);
            },
            setUsed(typeName, fieldName) {
                if (isInterfaceObject(typeName)) {
                    return interfaceTypeBuilder.field.setUsed(typeName, fieldName);
                }
                getOrCreateObjectField(state, renameObject, typeName, fieldName).used =
                    true;
            },
            arg: {
                setType(typeName, fieldName, argName, argType) {
                    if (isInterfaceObject(typeName)) {
                        return interfaceTypeBuilder.field.arg.setType(typeName, fieldName, argName, argType);
                    }
                    getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName).type = argType;
                },
                setKind(typeName, fieldName, argName, argKind) {
                    if (isInterfaceObject(typeName)) {
                        return interfaceTypeBuilder.field.arg.setKind(typeName, fieldName, argName, argKind);
                    }
                    getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName).kind = argKind;
                },
                setDescription(typeName, fieldName, argName, description) {
                    if (isInterfaceObject(typeName)) {
                        return interfaceTypeBuilder.field.arg.setDescription(typeName, fieldName, argName, description);
                    }
                    getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName).description = description;
                },
                setDeprecated(typeName, fieldName, argName, reason) {
                    if (isInterfaceObject(typeName)) {
                        return interfaceTypeBuilder.field.arg.setDeprecated(typeName, fieldName, argName, reason);
                    }
                    getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName).deprecated = {
                        reason,
                        deprecated: true,
                    };
                },
                setDirective(typeName, fieldName, argName, directive) {
                    if (isInterfaceObject(typeName)) {
                        return interfaceTypeBuilder.field.arg.setDirective(typeName, fieldName, argName, directive);
                    }
                    getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName).ast.directives.push(directive);
                },
                setDefaultValue(typeName, fieldName, argName, defaultValue) {
                    if (isInterfaceObject(typeName)) {
                        return interfaceTypeBuilder.field.arg.setDefaultValue(typeName, fieldName, argName, defaultValue);
                    }
                    getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName).defaultValue = defaultValue;
                },
                setInaccessible(typeName, fieldName, argName) {
                    if (isInterfaceObject(typeName)) {
                        return interfaceTypeBuilder.field.arg.setInaccessible(typeName, fieldName, argName);
                    }
                    getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName).inaccessible = true;
                },
                setTag(typeName, fieldName, argName, tag) {
                    if (isInterfaceObject(typeName)) {
                        return interfaceTypeBuilder.field.arg.setTag(typeName, fieldName, argName, tag);
                    }
                    getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName).tags.add(tag);
                },
                setCost(typeName, fieldName, argName, cost) {
                    if (isInterfaceObject(typeName)) {
                        return interfaceTypeBuilder.field.arg.setCost(typeName, fieldName, argName, cost);
                    }
                    getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName).cost = cost;
                },
            },
        },
    };
}
function interfaceTypeFactory(state) {
    return {
        setDefinition(typeName) {
            getOrCreateInterfaceType(state, typeName).isDefinition = true;
        },
        setExtension(typeName) {
            getOrCreateInterfaceType(state, typeName).extension = true;
        },
        setInterface(typeName, interfaceName) {
            getOrCreateInterfaceType(state, typeName).interfaces.add(interfaceName);
        },
        setInterfaceObject(typeName) {
            getOrCreateInterfaceType(state, typeName).isInterfaceObject = true;
        },
        setKey(typeName, fields, fieldsUsedInKey, resolvable) {
            const interfaceType = getOrCreateInterfaceType(state, typeName);
            interfaceType.keys.push({ fields, resolvable });
            for (const field of fieldsUsedInKey) {
                interfaceType.fieldsUsedAsKeys.add(field);
            }
        },
        setInaccessible(typeName) {
            const objectType = getOrCreateInterfaceType(state, typeName);
            objectType.inaccessible = true;
        },
        setTag(typeName, tag) {
            getOrCreateInterfaceType(state, typeName).tags.add(tag);
        },
        setDirective(typeName, directive) {
            getOrCreateInterfaceType(state, typeName).ast.directives.push(directive);
        },
        setDescription(typeName, description) {
            getOrCreateInterfaceType(state, typeName).description = description;
        },
        field: {
            setType(typeName, fieldName, fieldType) {
                getOrCreateInterfaceField(state, typeName, fieldName).type = fieldType;
            },
            setLeaf(typeName, fieldName) {
                getOrCreateInterfaceField(state, typeName, fieldName).isLeaf = true;
            },
            setExternal(typeName, fieldName) {
                getOrCreateInterfaceField(state, typeName, fieldName).external = true;
            },
            setInaccessible(typeName, fieldName) {
                getOrCreateInterfaceField(state, typeName, fieldName).inaccessible =
                    true;
            },
            setAuthenticated(typeName, fieldName) {
                getOrCreateInterfaceField(state, typeName, fieldName).authenticated =
                    true;
            },
            setPolicies(typeName, fieldName, policies) {
                const existing = getOrCreateInterfaceField(state, typeName, fieldName);
                existing.policies = mergeScopePolicies(existing.policies, policies);
            },
            setScopes(typeName, fieldName, scopes) {
                const existing = getOrCreateInterfaceField(state, typeName, fieldName);
                existing.scopes = mergeScopePolicies(existing.scopes, scopes);
            },
            setCost(typeName, fieldName, cost) {
                getOrCreateInterfaceField(state, typeName, fieldName).cost = cost;
            },
            setListSize(typeName, fieldName, listSize) {
                getOrCreateInterfaceField(state, typeName, fieldName).listSize =
                    listSize;
            },
            setOverride(typeName, fieldName, override, label) {
                const field = getOrCreateInterfaceField(state, typeName, fieldName);
                field.override = override;
                field.overrideLabel = label;
            },
            setRequires(typeName, fieldName, requires) {
                getOrCreateInterfaceField(state, typeName, fieldName).requires =
                    requires;
            },
            setShareable(typeName, fieldName) {
                getOrCreateInterfaceField(state, typeName, fieldName).shareable = true;
            },
            setTag(typeName, fieldName, tag) {
                getOrCreateInterfaceField(state, typeName, fieldName).tags.add(tag);
            },
            setUsed(typeName, fieldName) {
                getOrCreateInterfaceField(state, typeName, fieldName).used = true;
            },
            setDirective(typeName, fieldName, directive) {
                getOrCreateInterfaceField(state, typeName, fieldName).ast.directives.push(directive);
            },
            setDescription(typeName, fieldName, description) {
                getOrCreateInterfaceField(state, typeName, fieldName).description =
                    description;
            },
            setDeprecated(typeName, fieldName, reason) {
                getOrCreateInterfaceField(state, typeName, fieldName).deprecated = {
                    reason,
                    deprecated: true,
                };
            },
            arg: {
                setType(typeName, fieldName, argName, argType) {
                    getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName).type = argType;
                },
                setKind(typeName, fieldName, argName, argKind) {
                    getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName).kind = argKind;
                },
                setDefaultValue(typeName, fieldName, argName, defaultValue) {
                    getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName).defaultValue = defaultValue;
                },
                setDeprecated(typeName, fieldName, argName, reason) {
                    getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName).deprecated = {
                        reason,
                        deprecated: true,
                    };
                },
                setDescription(typeName, fieldName, argName, description) {
                    getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName).description = description;
                },
                setTag(typeName, fieldName, argName, tag) {
                    getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName).tags.add(tag);
                },
                setInaccessible(typeName, fieldName, argName) {
                    getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName).inaccessible = true;
                },
                setCost(typeName, fieldName, argName, cost) {
                    getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName).cost = cost;
                },
                setDirective(typeName, fieldName, argName, directive) {
                    getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName).ast.directives.push(directive);
                },
            },
        },
    };
}
function inputObjectTypeFactory(state) {
    return {
        setDefinition(typeName) {
            getOrCreateInputObjectType(state, typeName).isDefinition = true;
        },
        setExtension(typeName) {
            getOrCreateInputObjectType(state, typeName).extension = true;
        },
        setDescription(typeName, description) {
            getOrCreateInputObjectType(state, typeName).description = description;
        },
        setInaccessible(typeName) {
            const inputObjectType = getOrCreateInputObjectType(state, typeName);
            inputObjectType.inaccessible = true;
            for (const field of inputObjectType.fields.values()) {
                field.inaccessible = true;
            }
        },
        setDirective(typeName, directive) {
            getOrCreateInputObjectType(state, typeName).ast.directives.push(directive);
        },
        setTag(typeName, tag) {
            getOrCreateInputObjectType(state, typeName).tags.add(tag);
        },
        field: {
            setType(typeName, fieldName, fieldType) {
                getOrCreateInputObjectField(state, typeName, fieldName).type =
                    fieldType;
            },
            setKind(typeName, fieldName, fieldKind) {
                getOrCreateInputObjectField(state, typeName, fieldName).kind =
                    fieldKind;
            },
            setDescription(typeName, fieldName, description) {
                getOrCreateInputObjectField(state, typeName, fieldName).description =
                    description;
            },
            setDeprecated(typeName, fieldName, reason) {
                getOrCreateInputObjectField(state, typeName, fieldName).deprecated = {
                    reason,
                    deprecated: true,
                };
            },
            setDefaultValue(typeName, fieldName, defaultValue) {
                getOrCreateInputObjectField(state, typeName, fieldName).defaultValue =
                    defaultValue;
            },
            setInaccessible(typeName, fieldName) {
                getOrCreateInputObjectField(state, typeName, fieldName).inaccessible =
                    true;
            },
            setTag(typeName, fieldName, tag) {
                getOrCreateInputObjectField(state, typeName, fieldName).tags.add(tag);
            },
            setDirective(typeName, fieldName, directive) {
                getOrCreateInputObjectField(state, typeName, fieldName).ast.directives.push(directive);
            },
            setCost(typeName, fieldName, cost) {
                getOrCreateInputObjectField(state, typeName, fieldName).cost = cost;
            },
        },
    };
}
function unionTypeFactory(state) {
    return {
        setDefinition(typeName) {
            getOrCreateUnionType(state, typeName).isDefinition = true;
        },
        setInaccessible(typeName) {
            getOrCreateUnionType(state, typeName).inaccessible = true;
        },
        setTag(typeName, tag) {
            getOrCreateUnionType(state, typeName).tags.add(tag);
        },
        setDescription(typeName, description) {
            getOrCreateUnionType(state, typeName).description = description;
        },
        setMember(typeName, member) {
            getOrCreateUnionType(state, typeName).members.add(member);
        },
        setDirective(typeName, directive) {
            getOrCreateUnionType(state, typeName).ast.directives.push(directive);
        },
    };
}
function enumTypeFactory(state) {
    return {
        setDefinition(typeName) {
            getOrCreateEnumType(state, typeName).isDefinition = true;
        },
        setInaccessible(typeName) {
            getOrCreateEnumType(state, typeName).inaccessible = true;
        },
        setAuthenticated(typeName) {
            getOrCreateEnumType(state, typeName).authenticated = true;
        },
        setPolicies(typeName, policies) {
            const existing = getOrCreateEnumType(state, typeName);
            existing.policies = mergeScopePolicies(existing.policies, policies);
        },
        setScopes(typeName, scopes) {
            const existing = getOrCreateEnumType(state, typeName);
            existing.scopes = mergeScopePolicies(existing.scopes, scopes);
        },
        setCost(typeName, cost) {
            getOrCreateEnumType(state, typeName).cost = cost;
        },
        setDescription(typeName, description) {
            getOrCreateEnumType(state, typeName).description = description;
        },
        setTag(typeName, tag) {
            getOrCreateEnumType(state, typeName).tags.add(tag);
        },
        setReferencedByInputType(typeName, schemaCoordinate) {
            getOrCreateEnumType(state, typeName).referencedByInputType = true;
            getOrCreateEnumType(state, typeName).inputTypeReferences.add(schemaCoordinate);
        },
        setReferencedByOutputType(typeName, schemaCoordinate) {
            getOrCreateEnumType(state, typeName).referencedByOutputType = true;
            getOrCreateEnumType(state, typeName).outputTypeReferences.add(schemaCoordinate);
        },
        setDirective(typeName, directive) {
            getOrCreateEnumType(state, typeName).ast.directives.push(directive);
        },
        value: {
            setValue(typeName, valueName) {
                getOrCreateEnumValue(state, typeName, valueName);
            },
            setDescription(typeName, valueName, description) {
                getOrCreateEnumValue(state, typeName, valueName).description =
                    description;
            },
            setDirective(typeName, valueName, directive) {
                getOrCreateEnumValue(state, typeName, valueName).ast.directives.push(directive);
            },
            setInaccessible(typeName, valueName) {
                getOrCreateEnumValue(state, typeName, valueName).inaccessible = true;
            },
            setTag(typeName, valueName, tag) {
                getOrCreateEnumValue(state, typeName, valueName).tags.add(tag);
            },
            setDeprecated(typeName, valueName, reason) {
                getOrCreateEnumValue(state, typeName, valueName).deprecated = {
                    reason,
                    deprecated: true,
                };
            },
        },
    };
}
const executableDirectiveLocations = new Set([
    DirectiveLocation.FIELD,
    DirectiveLocation.FRAGMENT_DEFINITION,
    DirectiveLocation.INLINE_FRAGMENT,
    DirectiveLocation.FRAGMENT_SPREAD,
    DirectiveLocation.VARIABLE_DEFINITION,
    DirectiveLocation.QUERY,
    DirectiveLocation.MUTATION,
    DirectiveLocation.SUBSCRIPTION,
]);
export function isExecutableDirectiveLocation(location) {
    return executableDirectiveLocations.has(location);
}
function getOrCreateDirective(state, directiveName) {
    const existing = state.types.get(directiveName);
    if (existing) {
        if (existing.kind !== TypeKind.DIRECTIVE) {
            throw new Error(`Expected ${directiveName} to be a directive`);
        }
        return existing;
    }
    const directive = {
        kind: TypeKind.DIRECTIVE,
        name: directiveName,
        locations: new Set(),
        repeatable: false,
        composed: false,
        get isExecutable() {
            return Array.from(this.locations).some((location) => isExecutableDirectiveLocation(location));
        },
        args: new Map(),
    };
    state.types.set(directiveName, directive);
    return directive;
}
function getOrCreateDirectiveArg(state, directiveName, argName) {
    const directive = getOrCreateDirective(state, directiveName);
    const existing = directive.args.get(argName);
    if (existing) {
        return existing;
    }
    const arg = {
        name: argName,
        type: MISSING,
        kind: ArgumentKind.SCALAR,
        inaccessible: false,
        tags: new Set(),
        cost: null,
        ast: {
            directives: [],
        },
    };
    directive.args.set(argName, arg);
    return arg;
}
function getOrCreateScalarType(state, typeName) {
    const existing = state.types.get(typeName);
    if (existing) {
        if (existing.kind !== TypeKind.SCALAR) {
            throw new Error(`Expected ${typeName} to be a scalar type`);
        }
        return existing;
    }
    const scalarType = {
        kind: TypeKind.SCALAR,
        name: typeName,
        tags: new Set(),
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        cost: null,
        ast: {
            directives: [],
        },
    };
    state.types.set(typeName, scalarType);
    return scalarType;
}
function getOrCreateObjectType(state, renameObject, typeName) {
    typeName = renameObject(typeName);
    const existing = state.types.get(typeName);
    if (existing) {
        if (existing.kind !== TypeKind.OBJECT) {
            throw new Error(`Expected ${typeName} to be an object type`);
        }
        return existing;
    }
    const objectType = {
        kind: TypeKind.OBJECT,
        name: typeName,
        fields: new Map(),
        fieldsUsedAsKeys: new Set(),
        extension: false,
        external: false,
        keys: [],
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        cost: null,
        shareable: false,
        tags: new Set(),
        interfaces: new Set(),
        isDefinition: false,
        ast: {
            directives: [],
        },
    };
    state.types.set(typeName, objectType);
    return objectType;
}
function getOrCreateInterfaceType(state, typeName) {
    const existing = state.types.get(typeName);
    if (existing) {
        if (existing.kind !== TypeKind.INTERFACE) {
            throw new Error(`Expected ${typeName} to be an interface type`);
        }
        return existing;
    }
    const interfaceType = {
        kind: TypeKind.INTERFACE,
        name: typeName,
        fields: new Map(),
        fieldsUsedAsKeys: new Set(),
        extension: false,
        keys: [],
        inaccessible: false,
        tags: new Set(),
        interfaces: new Set(),
        implementedBy: new Set(),
        isDefinition: false,
        isInterfaceObject: false,
        ast: {
            directives: [],
        },
    };
    state.types.set(typeName, interfaceType);
    return interfaceType;
}
function getOrCreateInputObjectType(state, typeName) {
    const existing = state.types.get(typeName);
    if (existing) {
        if (existing.kind !== TypeKind.INPUT_OBJECT) {
            throw new Error(`Expected ${typeName} to be an input object type`);
        }
        return existing;
    }
    const inputObjectType = {
        kind: TypeKind.INPUT_OBJECT,
        name: typeName,
        fields: new Map(),
        extension: false,
        inaccessible: false,
        tags: new Set(),
        isDefinition: false,
        ast: {
            directives: [],
        },
    };
    state.types.set(typeName, inputObjectType);
    return inputObjectType;
}
function getOrCreateEnumType(state, typeName) {
    const existing = state.types.get(typeName);
    if (existing) {
        if (existing.kind !== TypeKind.ENUM) {
            throw new Error(`Expected ${typeName} to be an enum type`);
        }
        return existing;
    }
    const enumType = {
        kind: TypeKind.ENUM,
        name: typeName,
        values: new Map(),
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        cost: null,
        tags: new Set(),
        isDefinition: false,
        referencedByInputType: false,
        referencedByOutputType: false,
        inputTypeReferences: new Set(),
        outputTypeReferences: new Set(),
        ast: {
            directives: [],
        },
    };
    state.types.set(typeName, enumType);
    return enumType;
}
function getOrCreateUnionType(state, typeName) {
    const existing = state.types.get(typeName);
    if (existing) {
        if (existing.kind !== TypeKind.UNION) {
            throw new Error(`Expected ${typeName} to be a union type`);
        }
        return existing;
    }
    const unionType = {
        kind: TypeKind.UNION,
        name: typeName,
        members: new Set(),
        inaccessible: false,
        tags: new Set(),
        isDefinition: false,
        ast: {
            directives: [],
        },
    };
    state.types.set(typeName, unionType);
    return unionType;
}
function getOrCreateObjectField(state, renameObject, typeName, fieldName) {
    const objectType = getOrCreateObjectType(state, renameObject, typeName);
    const existing = objectType.fields.get(fieldName);
    if (existing) {
        return existing;
    }
    const field = {
        name: fieldName,
        type: MISSING,
        usedAsKey: false,
        isLeaf: false,
        external: false,
        inaccessible: false,
        authenticated: false,
        extension: false,
        policies: [],
        scopes: [],
        cost: null,
        listSize: null,
        used: false,
        required: false,
        provided: false,
        override: null,
        overrideLabel: null,
        provides: null,
        requires: null,
        shareable: false,
        tags: new Set(),
        args: new Map(),
        ast: {
            directives: [],
        },
    };
    objectType.fields.set(fieldName, field);
    return field;
}
function getOrCreateInterfaceField(state, typeName, fieldName) {
    const interfaceType = getOrCreateInterfaceType(state, typeName);
    const existing = interfaceType.fields.get(fieldName);
    if (existing) {
        return existing;
    }
    const field = {
        name: fieldName,
        usedAsKey: false,
        isLeaf: false,
        type: MISSING,
        external: false,
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        cost: null,
        listSize: null,
        used: false,
        override: null,
        overrideLabel: null,
        provides: null,
        requires: null,
        required: false,
        provided: false,
        shareable: false,
        extension: false,
        tags: new Set(),
        args: new Map(),
        ast: {
            directives: [],
        },
    };
    interfaceType.fields.set(fieldName, field);
    return field;
}
function getOrCreateInputObjectField(state, typeName, fieldName) {
    const inputObjectType = getOrCreateInputObjectType(state, typeName);
    const existing = inputObjectType.fields.get(fieldName);
    if (existing) {
        return existing;
    }
    const field = {
        name: fieldName,
        type: MISSING,
        kind: ArgumentKind.SCALAR,
        inaccessible: false,
        cost: null,
        tags: new Set(),
        ast: {
            directives: [],
        },
    };
    inputObjectType.fields.set(fieldName, field);
    return field;
}
function getOrCreateEnumValue(state, typeName, enumValueName) {
    const enumType = getOrCreateEnumType(state, typeName);
    const existing = enumType.values.get(enumValueName);
    if (existing) {
        return existing;
    }
    const enumValue = {
        name: enumValueName,
        inaccessible: false,
        tags: new Set(),
        ast: {
            directives: [],
        },
    };
    enumType.values.set(enumValueName, enumValue);
    return enumValue;
}
function getOrCreateObjectFieldArgument(state, renameObject, typeName, fieldName, argName) {
    const fieldState = getOrCreateObjectField(state, renameObject, typeName, fieldName);
    const existing = fieldState.args.get(argName);
    if (existing) {
        return existing;
    }
    const arg = {
        name: argName,
        type: MISSING,
        kind: ArgumentKind.SCALAR,
        inaccessible: false,
        tags: new Set(),
        cost: null,
        ast: {
            directives: [],
        },
    };
    fieldState.args.set(argName, arg);
    return arg;
}
function getOrCreateInterfaceFieldArgument(state, typeName, fieldName, argName) {
    const fieldState = getOrCreateInterfaceField(state, typeName, fieldName);
    const existing = fieldState.args.get(argName);
    if (existing) {
        return existing;
    }
    const arg = {
        name: argName,
        type: MISSING,
        kind: ArgumentKind.SCALAR,
        inaccessible: false,
        tags: new Set(),
        cost: null,
        ast: {
            directives: [],
        },
    };
    fieldState.args.set(argName, arg);
    return arg;
}
function isSchemaDefinition(node) {
    return node.kind === Kind.SCHEMA_DEFINITION;
}
function resolveTypeName(node) {
    switch (node.kind) {
        case Kind.NAMED_TYPE:
            return node.name.value;
        case Kind.LIST_TYPE:
            return resolveTypeName(node.type);
        case Kind.NON_NULL_TYPE:
            return resolveTypeName(node.type);
        default:
            throw new Error(`Unexpected type node: ${node}`);
    }
}
function isEnumType(node) {
    return (node.kind === Kind.ENUM_TYPE_DEFINITION ||
        node.kind === Kind.ENUM_TYPE_EXTENSION);
}
function decideOnRootTypeName(schemaDef, kind, defaultName) {
    return (schemaDef?.operationTypes?.find((operationType) => operationType.operation === kind)?.type.name.value ?? defaultName);
}
function hasInterfaceObjectDirective(node) {
    return node.directives?.some((d) => d.name.value === "interfaceObject");
}
