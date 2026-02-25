"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchemaNode = createSchemaNode;
exports.createDirectiveNode = createDirectiveNode;
exports.createObjectTypeNode = createObjectTypeNode;
exports.createInterfaceTypeNode = createInterfaceTypeNode;
exports.createInputObjectTypeNode = createInputObjectTypeNode;
exports.createUnionTypeNode = createUnionTypeNode;
exports.createEnumTypeNode = createEnumTypeNode;
exports.createScalarTypeNode = createScalarTypeNode;
exports.createJoinGraphEnumTypeNode = createJoinGraphEnumTypeNode;
exports.schemaCoordinate = schemaCoordinate;
exports.stripFederation = stripFederation;
const graphql_1 = require("graphql");
const printer_js_1 = require("../../graphql/printer.js");
const state_js_1 = require("../../subgraph/state.js");
function createSchemaNode(schema) {
    return {
        kind: graphql_1.Kind.SCHEMA_DEFINITION,
        directives: schema.links?.map(createLinkDirectiveNode),
        operationTypes: [].concat(schema.query
            ? {
                kind: graphql_1.Kind.OPERATION_TYPE_DEFINITION,
                operation: graphql_1.OperationTypeNode.QUERY,
                type: createNamedTypeNode(schema.query),
            }
            : [], schema.mutation
            ? {
                kind: graphql_1.Kind.OPERATION_TYPE_DEFINITION,
                operation: graphql_1.OperationTypeNode.MUTATION,
                type: createNamedTypeNode(schema.mutation),
            }
            : [], schema.subscription
            ? {
                kind: graphql_1.Kind.OPERATION_TYPE_DEFINITION,
                operation: graphql_1.OperationTypeNode.SUBSCRIPTION,
                type: createNamedTypeNode(schema.subscription),
            }
            : []),
    };
}
function createDirectiveNode(directive) {
    return {
        kind: graphql_1.Kind.DIRECTIVE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
            value: directive.name,
        },
        locations: Array.from(directive.locations).map((location) => ({
            kind: graphql_1.Kind.NAME,
            value: location,
        })),
        repeatable: directive.repeatable,
        arguments: directive.arguments.map(createFieldArgumentNode),
    };
}
function createObjectTypeNode(objectType) {
    return {
        kind: graphql_1.Kind.OBJECT_TYPE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
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
function createInterfaceTypeNode(interfaceType) {
    return {
        kind: graphql_1.Kind.INTERFACE_TYPE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
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
function createInputObjectTypeNode(inputObjectType) {
    return {
        kind: graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
            value: inputObjectType.name,
        },
        directives: applyDirectives(inputObjectType),
        fields: inputObjectType.fields.map(createInputFieldNode),
        description: inputObjectType.description
            ? createDescriptionNode(inputObjectType.description)
            : undefined,
    };
}
function createUnionTypeNode(unionType) {
    return {
        kind: graphql_1.Kind.UNION_TYPE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
            value: unionType.name,
        },
        directives: applyDirectives(unionType),
        description: unionType.description
            ? createDescriptionNode(unionType.description)
            : undefined,
        types: unionType.members.map((member) => ({
            kind: graphql_1.Kind.NAMED_TYPE,
            name: {
                kind: graphql_1.Kind.NAME,
                value: member,
            },
        })),
    };
}
function createEnumTypeNode(enumType) {
    return {
        kind: graphql_1.Kind.ENUM_TYPE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
            value: enumType.name,
        },
        directives: applyDirectives(enumType),
        description: enumType.description
            ? createDescriptionNode(enumType.description)
            : undefined,
        values: enumType.values.map(createEnumValueNode),
    };
}
function createScalarTypeNode(scalarType) {
    return {
        kind: graphql_1.Kind.SCALAR_TYPE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
            value: scalarType.name,
        },
        description: scalarType.description
            ? createDescriptionNode(scalarType.description)
            : undefined,
        directives: applyDirectives(scalarType),
    };
}
function createJoinGraphEnumTypeNode(graphs) {
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
        kind: graphql_1.Kind.FIELD_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
            value: field.name,
        },
        type: (0, graphql_1.parseType)(field.type),
        directives: applyDirectives(field),
        description: field.description
            ? createDescriptionNode(field.description)
            : undefined,
        arguments: field.arguments?.map(createFieldArgumentNode),
    };
}
function createInputFieldNode(inputField) {
    return {
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
            value: inputField.name,
        },
        type: (0, graphql_1.parseType)(inputField.type),
        directives: applyDirectives(inputField),
        description: inputField.description
            ? createDescriptionNode(inputField.description)
            : undefined,
        defaultValue: typeof inputField.defaultValue === "string"
            ? (0, graphql_1.parseConstValue)(inputField.defaultValue)
            : undefined,
    };
}
function createEnumValueNode(enumValue) {
    return {
        kind: graphql_1.Kind.ENUM_VALUE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
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
    if (kind === state_js_1.ArgumentKind.ENUM) {
        return {
            kind: graphql_1.Kind.ENUM,
            value: defaultValue.startsWith(`"`) && defaultValue.endsWith(`"`)
                ? defaultValue.substring(1, defaultValue.length - 1)
                : defaultValue,
        };
    }
    return (0, graphql_1.parseConstValue)(defaultValue);
}
function createFieldArgumentNode(argument) {
    return {
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
            value: argument.name,
        },
        defaultValue: createDefaultValue(argument.defaultValue, argument.kind),
        type: (0, graphql_1.parseType)(argument.type),
        directives: applyDirectives(argument),
        description: argument.description
            ? createDescriptionNode(argument.description)
            : undefined,
    };
}
function createJoinTypeDirectiveNode(join) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "join__type",
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "graph",
                },
                value: {
                    kind: graphql_1.Kind.ENUM,
                    value: join.graph,
                },
            },
            join.key
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "key",
                    },
                    value: {
                        kind: graphql_1.Kind.STRING,
                        value: join.key,
                    },
                }
                : null,
            join.resolvable === false
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "resolvable",
                    },
                    value: {
                        kind: graphql_1.Kind.BOOLEAN,
                        value: false,
                    },
                }
                : null,
            join.isInterfaceObject
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "isInterfaceObject",
                    },
                    value: {
                        kind: graphql_1.Kind.BOOLEAN,
                        value: true,
                    },
                }
                : null,
            join.extension
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "extension",
                    },
                    value: {
                        kind: graphql_1.Kind.BOOLEAN,
                        value: true,
                    },
                }
                : null,
        ].filter(nonEmpty),
    };
}
function createJoinImplementsDirectiveNode(join) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "join__implements",
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "graph",
                },
                value: {
                    kind: graphql_1.Kind.ENUM,
                    value: join.graph,
                },
            },
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "interface",
                },
                value: {
                    kind: graphql_1.Kind.STRING,
                    value: join.interface,
                },
            },
        ],
    };
}
function createJoinFieldDirectiveNode(join) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "join__field",
        },
        arguments: [
            join.graph
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "graph",
                    },
                    value: {
                        kind: graphql_1.Kind.ENUM,
                        value: join.graph,
                    },
                }
                : null,
            join.type
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "type",
                    },
                    value: {
                        kind: graphql_1.Kind.STRING,
                        value: join.type,
                    },
                }
                : null,
            join.override
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "override",
                    },
                    value: {
                        kind: graphql_1.Kind.STRING,
                        value: join.override,
                    },
                }
                : null,
            join.overrideLabel
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "overrideLabel",
                    },
                    value: {
                        kind: graphql_1.Kind.STRING,
                        value: join.overrideLabel,
                    },
                }
                : null,
            join.usedOverridden
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "usedOverridden",
                    },
                    value: {
                        kind: graphql_1.Kind.BOOLEAN,
                        value: true,
                    },
                }
                : null,
            join.external
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "external",
                    },
                    value: {
                        kind: graphql_1.Kind.BOOLEAN,
                        value: true,
                    },
                }
                : null,
            join.provides
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "provides",
                    },
                    value: {
                        kind: graphql_1.Kind.STRING,
                        value: join.provides,
                    },
                }
                : null,
            join.requires
                ? {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "requires",
                    },
                    value: {
                        kind: graphql_1.Kind.STRING,
                        value: join.requires,
                    },
                }
                : null,
        ].filter(nonEmpty),
    };
}
function createJoinUnionMemberDirectiveNode(join) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "join__unionMember",
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "graph",
                },
                value: {
                    kind: graphql_1.Kind.ENUM,
                    value: join.graph,
                },
            },
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "member",
                },
                value: {
                    kind: graphql_1.Kind.STRING,
                    value: join.member,
                },
            },
        ],
    };
}
function createJoinEnumValueDirectiveNode(join) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "join__enumValue",
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "graph",
                },
                value: {
                    kind: graphql_1.Kind.ENUM,
                    value: join.graph,
                },
            },
        ],
    };
}
function createInaccessibleDirectiveNode() {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "inaccessible",
        },
        arguments: [],
    };
}
function createAuthenticatedDirectiveNode() {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "authenticated",
        },
        arguments: [],
    };
}
function createPolicyDirectiveNode(policies) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "policy",
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "policies",
                },
                value: {
                    kind: graphql_1.Kind.LIST,
                    values: policies.map((group) => ({
                        kind: graphql_1.Kind.LIST,
                        values: group.map((policy) => ({
                            kind: graphql_1.Kind.STRING,
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
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "requiresScopes",
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "scopes",
                },
                value: {
                    kind: graphql_1.Kind.LIST,
                    values: scopes.map((group) => ({
                        kind: graphql_1.Kind.LIST,
                        values: group.map((scope) => ({
                            kind: graphql_1.Kind.STRING,
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
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "tag",
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "name",
                },
                value: {
                    kind: graphql_1.Kind.STRING,
                    value: name,
                },
            },
        ],
    };
}
function createJoinGraphDirectiveNode(join) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "join__graph",
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "name",
                },
                value: {
                    kind: graphql_1.Kind.STRING,
                    value: join.name,
                },
            },
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "url",
                },
                value: {
                    kind: graphql_1.Kind.STRING,
                    value: join.url ?? "",
                },
            },
        ],
    };
}
function createDescriptionNode(description) {
    return {
        kind: graphql_1.Kind.STRING,
        value: description.value,
        block: true,
    };
}
function createDeprecatedDirectiveNode(deprecated) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "deprecated",
        },
        arguments: typeof deprecated.reason === "string"
            ? [
                {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "reason",
                    },
                    value: {
                        kind: graphql_1.Kind.STRING,
                        value: deprecated.reason,
                    },
                },
            ]
            : [],
    };
}
function createSpecifiedByDirectiveNode(url) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "specifiedBy",
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "url",
                },
                value: {
                    kind: graphql_1.Kind.STRING,
                    value: url,
                },
            },
        ],
    };
}
function createCostDirectiveNode(input) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: input.directiveName,
        },
        arguments: [
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "weight",
                },
                value: {
                    kind: graphql_1.Kind.INT,
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
            kind: graphql_1.Kind.ARGUMENT,
            name: {
                kind: graphql_1.Kind.NAME,
                value: "requireOneSlicingArgument",
            },
            value: {
                kind: graphql_1.Kind.BOOLEAN,
                value: input.requireOneSlicingArgument === true,
            },
        });
    }
    if (typeof input.assumedSize === "number") {
        args.push({
            kind: graphql_1.Kind.ARGUMENT,
            name: {
                kind: graphql_1.Kind.NAME,
                value: "assumedSize",
            },
            value: {
                kind: graphql_1.Kind.INT,
                value: String(input.assumedSize),
            },
        });
    }
    if (Array.isArray(input.slicingArguments)) {
        args.push({
            kind: graphql_1.Kind.ARGUMENT,
            name: {
                kind: graphql_1.Kind.NAME,
                value: "slicingArguments",
            },
            value: {
                kind: graphql_1.Kind.LIST,
                values: input.slicingArguments.map((arg) => ({
                    kind: graphql_1.Kind.STRING,
                    value: arg,
                })),
            },
        });
    }
    if (Array.isArray(input.sizedFields)) {
        args.push({
            kind: graphql_1.Kind.ARGUMENT,
            name: {
                kind: graphql_1.Kind.NAME,
                value: "sizedFields",
            },
            value: {
                kind: graphql_1.Kind.LIST,
                values: input.sizedFields.map((arg) => ({
                    kind: graphql_1.Kind.STRING,
                    value: arg,
                    block: false,
                })),
            },
        });
    }
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: input.directiveName,
        },
        arguments: args,
    };
}
function createLinkDirectiveNode(link) {
    return {
        kind: graphql_1.Kind.DIRECTIVE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: "link",
        },
        arguments: [].concat([
            {
                kind: graphql_1.Kind.ARGUMENT,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: "url",
                },
                value: {
                    kind: graphql_1.Kind.STRING,
                    value: link.url,
                },
            },
        ], link.for
            ? [
                {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "for",
                    },
                    value: {
                        kind: graphql_1.Kind.ENUM,
                        value: link.for,
                    },
                },
            ]
            : [], link.import
            ? [
                {
                    kind: graphql_1.Kind.ARGUMENT,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: "import",
                    },
                    value: {
                        kind: graphql_1.Kind.LIST,
                        values: link.import.map((imported) => {
                            if (imported.alias) {
                                return {
                                    kind: graphql_1.Kind.OBJECT,
                                    fields: [
                                        {
                                            kind: graphql_1.Kind.OBJECT_FIELD,
                                            name: {
                                                kind: graphql_1.Kind.NAME,
                                                value: "name",
                                            },
                                            value: {
                                                kind: graphql_1.Kind.STRING,
                                                value: imported.name,
                                            },
                                        },
                                    ],
                                };
                            }
                            return {
                                kind: graphql_1.Kind.STRING,
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
        kind: graphql_1.Kind.NAMED_TYPE,
        name: {
            kind: graphql_1.Kind.NAME,
            value: name,
        },
    };
}
function applyDirectives(common) {
    const deduplicatedDirectives = (common.ast?.directives ?? [])
        .map((directive) => {
        return {
            ast: directive,
            string: (0, printer_js_1.print)(directive),
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
const buildInDirectives = new Set(graphql_1.specifiedDirectives.map((directive) => directive.name));
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
function schemaCoordinate(paths, nodes) {
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
function stripFederation(supergraph) {
    const inaccessible = new Set();
    const documentWithoutFederation = (0, graphql_1.visit)(supergraph, (0, graphql_1.visitInParallel)([
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
    return (0, graphql_1.visit)(documentWithoutFederation, {
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
