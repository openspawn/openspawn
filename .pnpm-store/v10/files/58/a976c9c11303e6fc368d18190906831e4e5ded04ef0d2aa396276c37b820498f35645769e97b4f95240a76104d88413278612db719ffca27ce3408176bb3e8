"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumTypeBuilder = enumTypeBuilder;
const helpers_js_1 = require("../../utils/helpers.js");
const ast_js_1 = require("./ast.js");
const common_js_1 = require("./common.js");
const auth_js_1 = require("../../utils/auth.js");
function enumTypeBuilder() {
    return {
        visitSubgraphState(graph, state, typeName, type) {
            const enumTypeState = getOrCreateEnumType(state, typeName);
            type.tags.forEach((tag) => enumTypeState.tags.add(tag));
            if (type.inaccessible) {
                enumTypeState.inaccessible = true;
            }
            if (type.authenticated) {
                enumTypeState.authenticated = true;
            }
            if (type.policies) {
                enumTypeState.policies = (0, auth_js_1.mergeScopePolicies)(enumTypeState.policies, type.policies);
            }
            if (type.scopes) {
                enumTypeState.scopes = (0, auth_js_1.mergeScopePolicies)(enumTypeState.scopes, type.scopes);
            }
            if (type.cost !== null) {
                enumTypeState.cost = (0, helpers_js_1.mathMax)(type.cost, enumTypeState.cost);
            }
            if (type.isDefinition) {
                enumTypeState.hasDefinition = true;
            }
            if (type.description && !enumTypeState.description) {
                enumTypeState.description = type.description;
            }
            if (type.referencedByInputType) {
                enumTypeState.referencedByInputType = true;
                type.inputTypeReferences.forEach((ref) => {
                    enumTypeState.inputTypeReferences.add(ref);
                });
            }
            if (type.referencedByOutputType) {
                enumTypeState.referencedByOutputType = true;
                type.outputTypeReferences.forEach((ref) => {
                    enumTypeState.outputTypeReferences.add(ref);
                });
            }
            type.ast.directives.forEach((directive) => {
                enumTypeState.ast.directives.push(directive);
            });
            enumTypeState.byGraph.set(graph.id, {
                inaccessible: type.inaccessible,
                version: graph.version,
            });
            for (const value of type.values.values()) {
                const valueState = getOrCreateEnumValue(enumTypeState, value.name);
                value.tags.forEach((tag) => valueState.tags.add(tag));
                if (value.inaccessible) {
                    valueState.inaccessible = true;
                }
                if (value.deprecated && !valueState.deprecated) {
                    valueState.deprecated = value.deprecated;
                }
                if (value.description && !valueState.description) {
                    valueState.description = value.description;
                }
                value.ast.directives.forEach((directive) => {
                    valueState.ast.directives.push(directive);
                });
                valueState.byGraph.set(graph.id, {
                    inaccessible: value.inaccessible,
                    version: graph.version,
                });
            }
        },
        composeSupergraphNode(enumType, _graph, { supergraphState }) {
            const mergeMethod = decideOnEnumMergeStrategy(enumType.referencedByInputType, enumType.referencedByOutputType);
            const values = mergeMethod === "intersection"
                ? intersectionOfEnumValues(enumType)
                : Array.from(enumType.values);
            return (0, ast_js_1.createEnumTypeNode)({
                name: enumType.name,
                cost: enumType.cost !== null
                    ? {
                        cost: enumType.cost,
                        directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
                    }
                    : null,
                values: values.map(([_, value]) => ({
                    name: value.name,
                    join: {
                        enumValue: Array.from(value.byGraph.keys()).map((graph) => ({
                            graph: graph.toUpperCase(),
                        })),
                    },
                    tags: Array.from(value.tags),
                    inaccessible: value.inaccessible,
                    description: value.description,
                    deprecated: value.deprecated,
                    ast: {
                        directives: (0, common_js_1.convertToConst)(value.ast.directives),
                    },
                })),
                tags: Array.from(enumType.tags),
                inaccessible: enumType.inaccessible,
                authenticated: enumType.authenticated,
                policies: enumType.policies,
                scopes: enumType.scopes,
                description: enumType.description,
                join: {
                    type: Array.from(enumType.byGraph.keys()).map((graphName) => ({
                        graph: graphName.toUpperCase(),
                    })),
                },
                ast: {
                    directives: (0, common_js_1.convertToConst)(enumType.ast.directives),
                },
            });
        },
    };
}
function decideOnEnumMergeStrategy(referencedByInputType, referencedByOutputType) {
    if (referencedByInputType === referencedByOutputType) {
        return "equal";
    }
    if (referencedByInputType) {
        return "intersection";
    }
    if (referencedByOutputType) {
        return "union";
    }
    return "equal";
}
function intersectionOfEnumValues(enumType) {
    const numberOfGraphs = enumType.byGraph.size;
    return Array.from(enumType.values).filter(([_, value]) => value.byGraph.size === numberOfGraphs);
}
function getOrCreateEnumType(state, typeName) {
    const existing = state.get(typeName);
    if (existing) {
        return existing;
    }
    const def = {
        kind: "enum",
        name: typeName,
        values: new Map(),
        tags: new Set(),
        hasDefinition: false,
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        cost: null,
        referencedByInputType: false,
        referencedByOutputType: false,
        inputTypeReferences: new Set(),
        outputTypeReferences: new Set(),
        byGraph: new Map(),
        ast: {
            directives: [],
        },
    };
    state.set(typeName, def);
    return def;
}
function getOrCreateEnumValue(enumTypeState, enumValueName) {
    const existing = enumTypeState.values.get(enumValueName);
    if (existing) {
        return existing;
    }
    const def = {
        name: enumValueName,
        tags: new Set(),
        inaccessible: false,
        byGraph: new Map(),
        ast: {
            directives: [],
        },
    };
    enumTypeState.values.set(enumValueName, def);
    return def;
}
