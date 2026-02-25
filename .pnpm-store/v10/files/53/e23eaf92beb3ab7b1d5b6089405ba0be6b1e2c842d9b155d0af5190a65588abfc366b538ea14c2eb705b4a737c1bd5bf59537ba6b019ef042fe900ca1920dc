"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scalarTypeBuilder = scalarTypeBuilder;
const helpers_js_1 = require("../../utils/helpers.js");
const ast_js_1 = require("./ast.js");
const common_js_1 = require("./common.js");
const auth_js_1 = require("../../utils/auth.js");
function scalarTypeBuilder() {
    return {
        visitSubgraphState(graph, state, typeName, type) {
            const scalarTypeState = getOrCreateScalarType(state, typeName);
            type.tags.forEach((tag) => scalarTypeState.tags.add(tag));
            if (type.inaccessible) {
                scalarTypeState.inaccessible = true;
            }
            if (type.authenticated) {
                scalarTypeState.authenticated = true;
            }
            if (type.policies) {
                scalarTypeState.policies = (0, auth_js_1.mergeScopePolicies)(scalarTypeState.policies, type.policies);
            }
            if (type.scopes) {
                scalarTypeState.scopes = (0, auth_js_1.mergeScopePolicies)(scalarTypeState.scopes, type.scopes);
            }
            if (type.cost !== null) {
                scalarTypeState.cost = (0, helpers_js_1.mathMax)(type.cost, scalarTypeState.cost);
            }
            if (type.description && !scalarTypeState.description) {
                scalarTypeState.description = type.description;
            }
            if (type.specifiedBy && !scalarTypeState.specifiedBy) {
                scalarTypeState.specifiedBy = type.specifiedBy;
            }
            type.ast.directives.forEach((directive) => {
                scalarTypeState.ast.directives.push(directive);
            });
            scalarTypeState.byGraph.set(graph.id, {
                inaccessible: type.inaccessible,
                version: graph.version,
            });
        },
        composeSupergraphNode(scalarType, _graph, { supergraphState }) {
            return (0, ast_js_1.createScalarTypeNode)({
                name: scalarType.name,
                tags: Array.from(scalarType.tags),
                inaccessible: scalarType.inaccessible,
                authenticated: scalarType.authenticated,
                policies: scalarType.policies,
                scopes: scalarType.scopes,
                cost: scalarType.cost !== null
                    ? {
                        cost: scalarType.cost,
                        directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
                    }
                    : null,
                description: scalarType.description,
                specifiedBy: scalarType.specifiedBy,
                join: {
                    type: Array.from(scalarType.byGraph.keys()).map((graphName) => ({
                        graph: graphName.toUpperCase(),
                    })),
                },
                ast: {
                    directives: (0, common_js_1.convertToConst)(scalarType.ast.directives),
                },
            });
        },
    };
}
function getOrCreateScalarType(state, typeName) {
    const existing = state.get(typeName);
    if (existing) {
        return existing;
    }
    const def = {
        kind: "scalar",
        name: typeName,
        tags: new Set(),
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        cost: null,
        byGraph: new Map(),
        ast: {
            directives: [],
        },
    };
    state.set(typeName, def);
    return def;
}
