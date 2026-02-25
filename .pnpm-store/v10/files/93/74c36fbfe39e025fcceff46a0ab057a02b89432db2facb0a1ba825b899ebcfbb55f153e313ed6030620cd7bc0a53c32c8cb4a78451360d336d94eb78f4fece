import { Kind, OperationTypeNode, parseConstValue, parseType, specifiedDirectives, visit, visitInParallel, } from "graphql";
import { print } from "../../graphql/printer.js";
import { ArgumentKind } from "../../subgraph/state.js";
export function createSchemaNode(schema) {
    return {
        kind: Kind.SCHEMA_DEFINITION,
        directives: schema.links?.map(createLinkDirectiveNode),
        operationTypes: [].concat(schema.query
            ? {
                kind: Kind.OPERATION_TYPE_DEFINITION,
                operation: OperationTypeNode.QUERY,
                type: createNamedTypeNode(schema.query),
            }
            : [], schema.mutation
            ? {
                kind: Kind.OPERATION_TYPE_DEFINITION,
                operation: OperationTypeNode.MUTATION,
                type: createNamedTypeNode(schema.mutation),
            }
            : [], schema.subscription
            ? {
                kind: Kind.OPERATION_TYPE_DEFINITION,
                operation: OperationTypeNode.SUBSCRIPTION,
                type: createNamedTypeNode(schema.subscription),
            }
            : []),
    };
}
export function createDirectiveNode(directive) {
    return {
        kind: Kind.DIRECTIVE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: directive.name,
        },
        locations: Array.from(directive.locations).map((location) => ({
            kind: Kind.NAME,
            value: location,
        })),
        repeatable: directive.repeatable,
        arguments: directive.arguments.map(createFieldArgumentNode),
    };
}
export function createObjectTypeNode(objectType) {
    return {
        kind: Kind.OBJECT_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: objectType.name,
        },
        directives: applyDirectives(objectType),
        fields: objectType.fields.map(createFieldNode),
        description: objectType.description
            ? createDescriptionNode(objectType.description)
            : undefined,
        interfaces: objectType.interfaces?.map(createNamedTypeNode),
    };
}
export function createInterfaceTypeNode(interfaceType) {
    return {
        kind: Kind.INTERFACE_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: interfaceType.name,
        },
        directives: applyDirectives(interfaceType),
        description: interfaceType.description
            ? createDescriptionNode(interfaceType.description)
            : undefined,
        fields: interfaceType.fields.map(createFieldNode),
        interfaces: interfaceType.interfaces?.map(createNamedTypeNode),
    };
}
export function createInputObjectTypeNode(inputObjectType) {
    return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: inputObjectType.name,
        },
        directives: applyDirectives(inputObjectType),
        fields: inputObjectType.fields.map(createInputFieldNode),
        description: inputObjectType.description
            ? createDescriptionNode(inputObjectType.description)
            : undefined,
    };
}
export function createUnionTypeNode(unionType) {
    return {
        kind: Kind.UNION_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: unionType.name,
        },
        directives: applyDirectives(unionType),
        description: unionType.description
            ? createDescriptionNode(unionType.description)
            : undefined,
        types: unionType.members.map((member) => ({
            kind: Kind.NAMED_TYPE,
            name: {
                kind: Kind.NAME,
                value: member,
            },
        })),
    };
}
export function createEnumTypeNode(enumType) {
    return {
        kind: Kind.ENUM_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: enumType.name,
        },
        directives: applyDirectives(enumType),
        description: enumType.description
            ? createDescriptionNode(enumType.description)
            : undefined,
        values: enumType.values.map(createEnumValueNode),
    };
}
export function createScalarTypeNode(scalarType) {
    return {
        kind: Kind.SCALAR_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: scalarType.name,
        },
        description: scalarType.description
            ? createDescriptionNode(scalarType.description)
            : undefined,
        directives: applyDirectives(scalarType),
    };
}
export function createJoinGraphEnumTypeNode(graphs) {
    return createEnumTypeNode({
        name: "join__Graph",
        cost: null,
        values: graphs.map((graph) => ({
            name: graph.enumValue,
            ast: {
                directives: [createJoinGraphDirectiveNode(graph)],
            },
        })),
    });
}
function createFieldNode(field) {
    return {
        kind: Kind.FIELD_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: field.name,
        },
        type: parseType(field.type),
        directives: applyDirectives(field),
        description: field.description
            ? createDescriptionNode(field.description)
            : undefined,
        arguments: field.arguments?.map(createFieldArgumentNode),
    };
}
function createInputFieldNode(inputField) {
    return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: inputField.name,
        },
        type: parseType(inputField.type),
        directives: applyDirectives(inputField),
        description: inputField.description
            ? createDescriptionNode(inputField.description)
            : undefined,
        defaultValue: typeof inputField.defaultValue === "string"
            ? parseConstValue(inputField.defaultValue)
            : undefined,
    };
}
function createEnumValueNode(enumValue) {
    return {
        kind: Kind.ENUM_VALUE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: enumValue.name,
        },
        directives: applyDirectives(enumValue),
        description: enumValue.description
            ? createDescriptionNode(enumValue.description)
            : undefined,
    };
}
function createDefaultValue(defaultValue, kind) {
    if (typeof defaultValue !== "string") {
        return undefined;
    }
    if (kind === ArgumentKind.ENUM) {
        return {
            kind: Kind.ENUM,
            value: defaultValue.startsWith(`"`) && defaultValue.endsWith(`"`)
                ? defaultValue.substring(1, defaultValue.length - 1)
                : defaultValue,
        };
    }
    return parseConstValue(defaultValue);
}
function createFieldArgumentNode(argument) {
    return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: argument.name,
        },
        defaultValue: createDefaultValue(argument.defaultValue, argument.kind),
        type: parseType(argument.type),
        directives: applyDirectives(argument),
        description: argument.description
            ? createDescriptionNode(argument.description)
            : undefined,
    };
}
function createJoinTypeDirectiveNode(join) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "join__type",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "graph",
                },
                value: {
                    kind: Kind.ENUM,
                    value: join.graph,
                },
            },
            join.key
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "key",
                    },
                    value: {
                        kind: Kind.STRING,
                        value: join.key,
                    },
                }
                : null,
            join.resolvable === false
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "resolvable",
                    },
                    value: {
                        kind: Kind.BOOLEAN,
                        value: false,
                    },
                }
                : null,
            join.isInterfaceObject
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "isInterfaceObject",
                    },
                    value: {
                        kind: Kind.BOOLEAN,
                        value: true,
                    },
                }
                : null,
            join.extension
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "extension",
                    },
                    value: {
                        kind: Kind.BOOLEAN,
                        value: true,
                    },
                }
                : null,
        ].filter(nonEmpty),
    };
}
function createJoinImplementsDirectiveNode(join) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "join__implements",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "graph",
                },
                value: {
                    kind: Kind.ENUM,
                    value: join.graph,
                },
            },
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "interface",
                },
                value: {
                    kind: Kind.STRING,
                    value: join.interface,
                },
            },
        ],
    };
}
function createJoinFieldDirectiveNode(join) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "join__field",
        },
        arguments: [
            join.graph
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "graph",
                    },
                    value: {
                        kind: Kind.ENUM,
                        value: join.graph,
                    },
                }
                : null,
            join.type
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "type",
                    },
                    value: {
                        kind: Kind.STRING,
                        value: join.type,
                    },
                }
                : null,
            join.override
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "override",
                    },
                    value: {
                        kind: Kind.STRING,
                        value: join.override,
                    },
                }
                : null,
            join.overrideLabel
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "overrideLabel",
                    },
                    value: {
                        kind: Kind.STRING,
                        value: join.overrideLabel,
                    },
                }
                : null,
            join.usedOverridden
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "usedOverridden",
                    },
                    value: {
                        kind: Kind.BOOLEAN,
                        value: true,
                    },
                }
                : null,
            join.external
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "external",
                    },
                    value: {
                        kind: Kind.BOOLEAN,
                        value: true,
                    },
                }
                : null,
            join.provides
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "provides",
                    },
                    value: {
                        kind: Kind.STRING,
                        value: join.provides,
                    },
                }
                : null,
            join.requires
                ? {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "requires",
                    },
                    value: {
                        kind: Kind.STRING,
                        value: join.requires,
                    },
                }
                : null,
        ].filter(nonEmpty),
    };
}
function createJoinUnionMemberDirectiveNode(join) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "join__unionMember",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "graph",
                },
                value: {
                    kind: Kind.ENUM,
                    value: join.graph,
                },
            },
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "member",
                },
                value: {
                    kind: Kind.STRING,
                    value: join.member,
                },
            },
        ],
    };
}
function createJoinEnumValueDirectiveNode(join) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "join__enumValue",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "graph",
                },
                value: {
                    kind: Kind.ENUM,
                    value: join.graph,
                },
            },
        ],
    };
}
function createInaccessibleDirectiveNode() {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "inaccessible",
        },
        arguments: [],
    };
}
function createAuthenticatedDirectiveNode() {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "authenticated",
        },
        arguments: [],
    };
}
function createPolicyDirectiveNode(policies) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "policy",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "policies",
                },
                value: {
                    kind: Kind.LIST,
                    values: policies.map((group) => ({
                        kind: Kind.LIST,
                        values: group.map((policy) => ({
                            kind: Kind.STRING,
                            value: policy,
                        })),
                    })),
                },
            },
        ],
    };
}
function createRequiresScopesDirectiveNode(scopes) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "requiresScopes",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "scopes",
                },
                value: {
                    kind: Kind.LIST,
                    values: scopes.map((group) => ({
                        kind: Kind.LIST,
                        values: group.map((scope) => ({
                            kind: Kind.STRING,
                            value: scope,
                        })),
                    })),
                },
            },
        ],
    };
}
function createTagDirectiveNode(name) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "tag",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "name",
                },
                value: {
                    kind: Kind.STRING,
                    value: name,
                },
            },
        ],
    };
}
function createJoinGraphDirectiveNode(join) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "join__graph",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "name",
                },
                value: {
                    kind: Kind.STRING,
                    value: join.name,
                },
            },
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "url",
                },
                value: {
                    kind: Kind.STRING,
                    value: join.url ?? "",
                },
            },
        ],
    };
}
function createDescriptionNode(description) {
    return {
        kind: Kind.STRING,
        value: description.value,
        block: true,
    };
}
function createDeprecatedDirectiveNode(deprecated) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "deprecated",
        },
        arguments: typeof deprecated.reason === "string"
            ? [
                {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "reason",
                    },
                    value: {
                        kind: Kind.STRING,
                        value: deprecated.reason,
                    },
                },
            ]
            : [],
    };
}
function createSpecifiedByDirectiveNode(url) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "specifiedBy",
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "url",
                },
                value: {
                    kind: Kind.STRING,
                    value: url,
                },
            },
        ],
    };
}
function createCostDirectiveNode(input) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: input.directiveName,
        },
        arguments: [
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "weight",
                },
                value: {
                    kind: Kind.INT,
                    value: String(input.cost),
                },
            },
        ],
    };
}
function createListSizeDirectiveNode(input) {
    const args = [];
    if (input.requireOneSlicingArgument === false ||
        input.printRequireOneSlicingArgument === true) {
        args.push({
            kind: Kind.ARGUMENT,
            name: {
                kind: Kind.NAME,
                value: "requireOneSlicingArgument",
            },
            value: {
                kind: Kind.BOOLEAN,
                value: input.requireOneSlicingArgument === true,
            },
        });
    }
    if (typeof input.assumedSize === "number") {
        args.push({
            kind: Kind.ARGUMENT,
            name: {
                kind: Kind.NAME,
                value: "assumedSize",
            },
            value: {
                kind: Kind.INT,
                value: String(input.assumedSize),
            },
        });
    }
    if (Array.isArray(input.slicingArguments)) {
        args.push({
            kind: Kind.ARGUMENT,
            name: {
                kind: Kind.NAME,
                value: "slicingArguments",
            },
            value: {
                kind: Kind.LIST,
                values: input.slicingArguments.map((arg) => ({
                    kind: Kind.STRING,
                    value: arg,
                })),
            },
        });
    }
    if (Array.isArray(input.sizedFields)) {
        args.push({
            kind: Kind.ARGUMENT,
            name: {
                kind: Kind.NAME,
                value: "sizedFields",
            },
            value: {
                kind: Kind.LIST,
                values: input.sizedFields.map((arg) => ({
                    kind: Kind.STRING,
                    value: arg,
                    block: false,
                })),
            },
        });
    }
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: input.directiveName,
        },
        arguments: args,
    };
}
function createLinkDirectiveNode(link) {
    return {
        kind: Kind.DIRECTIVE,
        name: {
            kind: Kind.NAME,
            value: "link",
        },
        arguments: [].concat([
            {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "url",
                },
                value: {
                    kind: Kind.STRING,
                    value: link.url,
                },
            },
        ], link.for
            ? [
                {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "for",
                    },
                    value: {
                        kind: Kind.ENUM,
                        value: link.for,
                    },
                },
            ]
            : [], link.import
            ? [
                {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "import",
                    },
                    value: {
                        kind: Kind.LIST,
                        values: link.import.map((imported) => {
                            if (imported.alias) {
                                return {
                                    kind: Kind.OBJECT,
                                    fields: [
                                        {
                                            kind: Kind.OBJECT_FIELD,
                                            name: {
                                                kind: Kind.NAME,
                                                value: "name",
                                            },
                                            value: {
                                                kind: Kind.STRING,
                                                value: imported.name,
                                            },
                                        },
                                    ],
                                };
                            }
                            return {
                                kind: Kind.STRING,
                                value: imported.name,
                            };
                        }),
                    },
                },
            ]
            : []),
    };
}
function createNamedTypeNode(name) {
    return {
        kind: Kind.NAMED_TYPE,
        name: {
            kind: Kind.NAME,
            value: name,
        },
    };
}
function applyDirectives(common) {
    const deduplicatedDirectives = (common.ast?.directives ?? [])
        .map((directive) => {
        return {
            ast: directive,
            string: print(directive),
        };
    })
        .filter((directive, index, all) => all.findIndex((d) => d.string === directive.string) === index)
        .map((d) => d.ast);
    return [].concat(deduplicatedDirectives, common.join?.type?.map(createJoinTypeDirectiveNode) ?? [], common.join?.implements?.map(createJoinImplementsDirectiveNode) ?? [], common.join?.field?.map(createJoinFieldDirectiveNode) ?? [], common.join?.unionMember?.map(createJoinUnionMemberDirectiveNode) ?? [], common.join?.enumValue?.map(createJoinEnumValueDirectiveNode) ?? [], common.tags?.map(createTagDirectiveNode) ?? [], common.inaccessible ? [createInaccessibleDirectiveNode()] : [], common.authenticated ? [createAuthenticatedDirectiveNode()] : [], common.policies?.length ? [createPolicyDirectiveNode(common.policies)] : [], common.scopes?.length
        ? [createRequiresScopesDirectiveNode(common.scopes)]
        : [], common.cost ? [createCostDirectiveNode(common.cost)] : [], common.listSize ? [createListSizeDirectiveNode(common.listSize)] : [], common.deprecated ? [createDeprecatedDirectiveNode(common.deprecated)] : [], common.specifiedBy
        ? [createSpecifiedByDirectiveNode(common.specifiedBy)]
        : []);
}
function nonEmpty(value) {
    return value != null;
}
const buildInDirectives = new Set(specifiedDirectives.map((directive) => directive.name));
function isBuiltInDirective(directiveName) {
    return buildInDirectives.has(directiveName);
}
function isFederationDirective(name) {
    return (name === "tag" ||
        name === "link" ||
        name.startsWith("join__") ||
        name.startsWith("link__"));
}
function isFederationEnum(name) {
    return name.startsWith("join__") || name.startsWith("link__");
}
function isFederationScalar(name) {
    return name.startsWith("join__") || name.startsWith("link__");
}
export function schemaCoordinate(paths, nodes) {
    let coordinate = "";
    for (let i = 0; i < Math.max(paths.length, nodes.length); i++) {
        const prop = paths[i];
        const current = nodes[i];
        if (typeof prop === "number" && Array.isArray(current)) {
            const node = current[prop];
            if (coordinate.length > 0) {
                coordinate = coordinate + "." + node.name.value;
            }
            else {
                coordinate = node.name.value;
            }
        }
    }
    return coordinate;
}
export function stripFederation(supergraph) {
    const inaccessible = new Set();
    const documentWithoutFederation = visit(supergraph, visitInParallel([
        {
            DirectiveDefinition(node) {
                if (isBuiltInDirective(node.name.value) ||
                    isFederationDirective(node.name.value)) {
                    return null;
                }
            },
            Directive(node) {
                if (isBuiltInDirective(node.name.value) ||
                    isFederationDirective(node.name.value)) {
                    return null;
                }
            },
            EnumTypeDefinition(node) {
                if (isFederationEnum(node.name.value)) {
                    return null;
                }
            },
            ScalarTypeDefinition(node) {
                if (isFederationScalar(node.name.value)) {
                    return null;
                }
            },
        },
        {
            Directive(directive, _, __, paths, nodes) {
                if (directive.name.value === "inaccessible") {
                    inaccessible.add(schemaCoordinate(paths, nodes));
                }
            },
        },
    ]));
    if (inaccessible.size === 0) {
        return documentWithoutFederation;
    }
    function hideByNodeName(node) {
        if (inaccessible.has(node.name.value)) {
            return null;
        }
    }
    function hideObjectOrInterface(node) {
        if (inaccessible.has(node.name.value)) {
            return null;
        }
        const inaccessibleInterfaces = node.interfaces?.filter((i) => inaccessible.has(i.name.value));
        if (inaccessibleInterfaces?.length) {
            return {
                ...node,
                interfaces: node.interfaces?.filter((i) => !inaccessible.has(i.name.value)),
            };
        }
    }
    function hideField(node, _, __, paths, nodes) {
        if (inaccessible.has(schemaCoordinate(paths, nodes) + "." + node.name.value)) {
            return null;
        }
        if (inaccessible.has(namedTypeFromTypeNode(node.type).name.value)) {
            return null;
        }
    }
    return visit(documentWithoutFederation, {
        ObjectTypeDefinition: hideObjectOrInterface,
        InterfaceTypeDefinition: hideObjectOrInterface,
        InputObjectTypeDefinition: hideByNodeName,
        EnumTypeDefinition: hideByNodeName,
        UnionTypeDefinition: hideByNodeName,
        ScalarTypeDefinition: hideByNodeName,
        FieldDefinition: hideField,
        InputValueDefinition: hideField,
        EnumValueDefinition(node, _, __, paths, nodes) {
            if (inaccessible.has(schemaCoordinate(paths, nodes) + "." + node.name.value)) {
                return null;
            }
        },
    });
}
function namedTypeFromTypeNode(type) {
    if (type.kind === Kind.NAMED_TYPE) {
        return type;
    }
    if (type.kind === Kind.LIST_TYPE) {
        return namedTypeFromTypeNode(type.type);
    }
    if (type.kind === Kind.NON_NULL_TYPE) {
        return namedTypeFromTypeNode(type.type);
    }
    throw new Error("Unknown type node: " + type);
}
