import { ensureValue, mathMax } from "../../utils/helpers.js";
import { createScalarTypeNode } from "./ast.js";
import { convertToConst } from "./common.js";
import { mergeScopePolicies } from "../../utils/auth.js";
export function scalarTypeBuilder() {
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
                scalarTypeState.policies = mergeScopePolicies(scalarTypeState.policies, type.policies);
            }
            if (type.scopes) {
                scalarTypeState.scopes = mergeScopePolicies(scalarTypeState.scopes, type.scopes);
            }
            if (type.cost !== null) {
                scalarTypeState.cost = mathMax(type.cost, scalarTypeState.cost);
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
            return createScalarTypeNode({
                name: scalarType.name,
                tags: Array.from(scalarType.tags),
                inaccessible: scalarType.inaccessible,
                authenticated: scalarType.authenticated,
                policies: scalarType.policies,
                scopes: scalarType.scopes,
                cost: scalarType.cost !== null
                    ? {
                        cost: scalarType.cost,
                        directiveName: ensureValue(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
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
                    directives: convertToConst(scalarType.ast.directives),
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
