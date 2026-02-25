"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputObjectTypeBuilder = inputObjectTypeBuilder;
const helpers_js_1 = require("../../utils/helpers.js");
const ast_js_1 = require("./ast.js");
const common_js_1 = require("./common.js");
function inputObjectTypeBuilder() {
    return {
        visitSubgraphState(graph, state, typeName, type) {
            const inputObjectTypeState = getOrCreateInputObjectType(state, typeName);
            type.tags.forEach((tag) => inputObjectTypeState.tags.add(tag));
            if (type.inaccessible) {
                inputObjectTypeState.inaccessible = true;
            }
            if (type.description && !inputObjectTypeState.description) {
                inputObjectTypeState.description = type.description;
            }
            if (type.isDefinition) {
                inputObjectTypeState.hasDefinition = true;
            }
            if (type.ast.directives) {
                type.ast.directives.forEach((directive) => {
                    inputObjectTypeState.ast.directives.push(directive);
                });
            }
            inputObjectTypeState.byGraph.set(graph.id, {
                inaccessible: type.inaccessible,
                version: graph.version,
            });
            for (const field of type.fields.values()) {
                const fieldState = getOrCreateField(inputObjectTypeState, field.name, field.type, field.kind);
                field.tags.forEach((tag) => fieldState.tags.add(tag));
                if (field.type.endsWith("!") && !fieldState.type.endsWith("!")) {
                    fieldState.type = field.type;
                }
                if (field.inaccessible) {
                    fieldState.inaccessible = true;
                }
                if (field.cost !== null) {
                    fieldState.cost = (0, helpers_js_1.mathMax)(field.cost, fieldState.cost);
                }
                if (field.description && !fieldState.description) {
                    fieldState.description = field.description;
                }
                if (field.deprecated && !fieldState.deprecated) {
                    fieldState.deprecated = field.deprecated;
                }
                if (typeof field.defaultValue !== "undefined") {
                    fieldState.defaultValue = field.defaultValue;
                }
                fieldState.kind = field.kind;
                field.ast.directives.forEach((directive) => {
                    fieldState.ast.directives.push(directive);
                });
                fieldState.byGraph.set(graph.id, {
                    type: field.type,
                    inaccessible: field.inaccessible,
                    defaultValue: field.defaultValue,
                    version: graph.version,
                });
            }
        },
        composeSupergraphNode(inputObjectType, _graph, { supergraphState }) {
            return (0, ast_js_1.createInputObjectTypeNode)({
                name: inputObjectType.name,
                tags: Array.from(inputObjectType.tags),
                inaccessible: inputObjectType.inaccessible,
                description: inputObjectType.description,
                ast: {
                    directives: (0, common_js_1.convertToConst)(inputObjectType.ast.directives),
                },
                fields: Array.from(inputObjectType.fields.values())
                    .filter((field) => {
                    if (field.byGraph.size !== inputObjectType.byGraph.size) {
                        return false;
                    }
                    return true;
                })
                    .map((field) => {
                    const fieldStateInGraphs = Array.from(field.byGraph.values());
                    const hasDifferentType = fieldStateInGraphs.some((f) => f.type !== field.type);
                    return {
                        name: field.name,
                        type: field.type,
                        tags: Array.from(field.tags),
                        inaccessible: field.inaccessible,
                        cost: field.cost !== null
                            ? {
                                cost: field.cost,
                                directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
                            }
                            : null,
                        defaultValue: fieldStateInGraphs.every((f) => typeof f.defaultValue !== "undefined")
                            ? field.defaultValue
                            : undefined,
                        description: field.description,
                        deprecated: field.deprecated,
                        ast: {
                            directives: (0, common_js_1.convertToConst)(field.ast.directives),
                        },
                        join: {
                            field: hasDifferentType
                                ? Array.from(field.byGraph).map(([graph, fieldByGraph]) => ({
                                    graph,
                                    type: fieldByGraph.type,
                                }))
                                : [],
                        },
                    };
                }),
                join: {
                    type: Array.from(inputObjectType.byGraph.keys()).map((graph) => ({
                        graph,
                    })),
                },
            });
        },
    };
}
function getOrCreateInputObjectType(state, typeName) {
    const existing = state.get(typeName);
    if (existing) {
        return existing;
    }
    const def = {
        kind: "input",
        name: typeName,
        tags: new Set(),
        hasDefinition: false,
        inaccessible: false,
        byGraph: new Map(),
        fields: new Map(),
        ast: {
            directives: [],
        },
    };
    state.set(typeName, def);
    return def;
}
function getOrCreateField(objectTypeState, fieldName, fieldType, fieldKind) {
    const existing = objectTypeState.fields.get(fieldName);
    if (existing) {
        return existing;
    }
    const def = {
        name: fieldName,
        type: fieldType,
        kind: fieldKind,
        tags: new Set(),
        inaccessible: false,
        cost: null,
        byGraph: new Map(),
        ast: {
            directives: [],
        },
    };
    objectTypeState.fields.set(fieldName, def);
    return def;
}
