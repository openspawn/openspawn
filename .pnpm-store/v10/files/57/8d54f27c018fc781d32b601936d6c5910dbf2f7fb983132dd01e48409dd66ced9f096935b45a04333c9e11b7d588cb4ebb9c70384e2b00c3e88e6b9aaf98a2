import { Kind, parse, stripIgnoredCharacters, visit, } from "graphql";
import sortBy from "lodash.sortby";
import { print } from "./printer.js";
export function sortSDL(doc) {
    try {
        return visit(doc, {
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
                        arg.value.kind === Kind.STRING) {
                        const parsedFields = parseFields(arg.value.value);
                        if (parsedFields) {
                            const printed = stripIgnoredCharacters(print(parsedFields));
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
    const parsed = parse(fields.trim().startsWith(`{`) ? `query ${fields}` : `query { ${fields} }`).definitions.find((d) => d.kind === Kind.OPERATION_DEFINITION);
    return parsed?.selectionSet;
}
function valueNodeToString(node) {
    if ("name" in node) {
        return node.name.value;
    }
    if ("value" in node) {
        return node.value.toString();
    }
    if (node.kind === Kind.LIST) {
        return node.values.map(valueNodeToString).join(",");
    }
    if (node.kind === Kind.OBJECT) {
        return "OBJECT";
    }
    return "NULL";
}
function sortNodes(nodes) {
    if (nodes) {
        if (nodes.length === 0) {
            return [];
        }
        if (isOfKindList(nodes, Kind.NAMED_TYPE)) {
            return sortBy(nodes, "name.value");
        }
        if (isOfKindList(nodes, Kind.DIRECTIVE)) {
            return sortBy(nodes, (n) => {
                const args = n.arguments
                    ?.map((a) => a.name.value + valueNodeToString(a.value))
                    .sort()
                    .join(";") ?? "";
                return n.name.value + args;
            });
        }
        if (isOfKindList(nodes, Kind.VARIABLE_DEFINITION)) {
            return sortBy(nodes, "variable.name.value");
        }
        if (isOfKindList(nodes, Kind.ARGUMENT)) {
            return sortBy(nodes, "name.value");
        }
        if (isOfKindList(nodes, Kind.ENUM_VALUE_DEFINITION)) {
            return sortBy(nodes, "name.value");
        }
        if (isOfKindList(nodes, Kind.INPUT_VALUE_DEFINITION)) {
            return sortBy(nodes, "name.value");
        }
        if (isOfKindList(nodes, [
            Kind.FIELD,
            Kind.FRAGMENT_SPREAD,
            Kind.INLINE_FRAGMENT,
        ])) {
            return sortBy(nodes, "kind", "name.value");
        }
        if (isOfKindList(nodes, Kind.NAME)) {
            return sortBy(nodes, "value");
        }
        return sortBy(nodes, "kind", "name.value");
    }
    return;
}
function isOfKindList(nodes, kind) {
    return typeof kind === "string"
        ? nodes[0].kind === kind
        : kind.includes(nodes[0].kind);
}
