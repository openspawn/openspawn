"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortSDL = sortSDL;
const graphql_1 = require("graphql");
const lodash_sortby_1 = __importDefault(require("lodash.sortby"));
const printer_js_1 = require("./printer.js");
function sortSDL(doc) {
    try {
        return (0, graphql_1.visit)(doc, {
            Document(node) {
                return {
                    ...node,
                    definitions: sortNodes(node.definitions),
                };
            },
            SchemaDefinition(node) {
                return {
                    ...node,
                    directives: sortNodes(node.directives),
                };
            },
            ScalarTypeDefinition(node) {
                return {
                    ...node,
                    directives: sortNodes(node.directives),
                };
            },
            ObjectTypeDefinition(node) {
                return {
                    ...node,
                    directives: sortNodes(node.directives),
                    fields: sortNodes(node.fields),
                    interfaces: sortNodes(node.interfaces),
                };
            },
            InterfaceTypeDefinition(node) {
                return {
                    ...node,
                    directives: sortNodes(node.directives),
                    fields: sortNodes(node.fields),
                };
            },
            InputObjectTypeDefinition(node) {
                return {
                    ...node,
                    directives: sortNodes(node.directives),
                    fields: sortNodes(node.fields),
                };
            },
            EnumTypeDefinition(node) {
                return {
                    ...node,
                    directives: sortNodes(node.directives),
                    values: sortNodes(node.values),
                };
            },
            EnumValueDefinition(node) {
                return {
                    ...node,
                    directives: sortNodes(node.directives),
                };
            },
            UnionTypeDefinition(node) {
                return {
                    ...node,
                    types: sortNodes(node.types),
                    directives: sortNodes(node.directives),
                };
            },
            FieldDefinition(node) {
                return {
                    ...node,
                    directives: sortNodes(node.directives),
                };
            },
            DirectiveDefinition(node) {
                return {
                    ...node,
                    locations: sortNodes(node.locations),
                };
            },
            Directive(node) {
                for (const arg of node.arguments ?? []) {
                    if (["requires", "provides"].includes(arg.name.value) &&
                        arg.value.kind === graphql_1.Kind.STRING) {
                        const parsedFields = parseFields(arg.value.value);
                        if (parsedFields) {
                            const printed = (0, graphql_1.stripIgnoredCharacters)((0, printer_js_1.print)(parsedFields));
                            arg.value.value = printed
                                .replace(/^\{/, "")
                                .replace(/\}$/, "");
                        }
                    }
                }
                return {
                    ...node,
                    arguments: sortNodes(node.arguments),
                };
            },
            StringValue(node) {
                return {
                    ...node,
                    value: node.value.trim(),
                };
            },
        });
    }
    catch (error) {
        console.log("Failed to parse", doc.loc?.source.name);
        throw error;
    }
}
function parseFields(fields) {
    const parsed = (0, graphql_1.parse)(fields.trim().startsWith(`{`) ? `query ${fields}` : `query { ${fields} }`).definitions.find((d) => d.kind === graphql_1.Kind.OPERATION_DEFINITION);
    return parsed?.selectionSet;
}
function valueNodeToString(node) {
    if ("name" in node) {
        return node.name.value;
    }
    if ("value" in node) {
        return node.value.toString();
    }
    if (node.kind === graphql_1.Kind.LIST) {
        return node.values.map(valueNodeToString).join(",");
    }
    if (node.kind === graphql_1.Kind.OBJECT) {
        return "OBJECT";
    }
    return "NULL";
}
function sortNodes(nodes) {
    if (nodes) {
        if (nodes.length === 0) {
            return [];
        }
        if (isOfKindList(nodes, graphql_1.Kind.NAMED_TYPE)) {
            return (0, lodash_sortby_1.default)(nodes, "name.value");
        }
        if (isOfKindList(nodes, graphql_1.Kind.DIRECTIVE)) {
            return (0, lodash_sortby_1.default)(nodes, (n) => {
                const args = n.arguments
                    ?.map((a) => a.name.value + valueNodeToString(a.value))
                    .sort()
                    .join(";") ?? "";
                return n.name.value + args;
            });
        }
        if (isOfKindList(nodes, graphql_1.Kind.VARIABLE_DEFINITION)) {
            return (0, lodash_sortby_1.default)(nodes, "variable.name.value");
        }
        if (isOfKindList(nodes, graphql_1.Kind.ARGUMENT)) {
            return (0, lodash_sortby_1.default)(nodes, "name.value");
        }
        if (isOfKindList(nodes, graphql_1.Kind.ENUM_VALUE_DEFINITION)) {
            return (0, lodash_sortby_1.default)(nodes, "name.value");
        }
        if (isOfKindList(nodes, graphql_1.Kind.INPUT_VALUE_DEFINITION)) {
            return (0, lodash_sortby_1.default)(nodes, "name.value");
        }
        if (isOfKindList(nodes, [
            graphql_1.Kind.FIELD,
            graphql_1.Kind.FRAGMENT_SPREAD,
            graphql_1.Kind.INLINE_FRAGMENT,
        ])) {
            return (0, lodash_sortby_1.default)(nodes, "kind", "name.value");
        }
        if (isOfKindList(nodes, graphql_1.Kind.NAME)) {
            return (0, lodash_sortby_1.default)(nodes, "value");
        }
        return (0, lodash_sortby_1.default)(nodes, "kind", "name.value");
    }
    return;
}
function isOfKindList(nodes, kind) {
    return typeof kind === "string"
        ? nodes[0].kind === kind
        : kind.includes(nodes[0].kind);
}
