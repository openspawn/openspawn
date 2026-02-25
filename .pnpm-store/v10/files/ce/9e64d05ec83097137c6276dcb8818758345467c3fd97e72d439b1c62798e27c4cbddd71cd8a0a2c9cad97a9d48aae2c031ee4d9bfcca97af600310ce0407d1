"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unionTypeBuilder = unionTypeBuilder;
const ast_js_1 = require("./ast.js");
const common_js_1 = require("./common.js");
function unionTypeBuilder() {
    return {
        visitSubgraphState(graph, state, typeName, type) {
            const unionTypeState = getOrCreateUnionType(state, typeName);
            type.tags.forEach((tag) => unionTypeState.tags.add(tag));
            if (type.inaccessible) {
                unionTypeState.inaccessible = true;
            }
            if (type.isDefinition) {
                unionTypeState.hasDefinition = true;
            }
            if (type.description && !unionTypeState.description) {
                unionTypeState.description = type.description;
            }
            type.ast.directives.forEach((directive) => {
                unionTypeState.ast.directives.push(directive);
            });
            unionTypeState.byGraph.set(graph.id, {
                members: type.members,
                version: graph.version,
            });
            for (const member of type.members) {
                unionTypeState.members.add(member);
            }
        },
        composeSupergraphNode(unionType) {
            return (0, ast_js_1.createUnionTypeNode)({
                name: unionType.name,
                members: Array.from(unionType.members),
                tags: Array.from(unionType.tags),
                inaccessible: unionType.inaccessible,
                description: unionType.description,
                join: {
                    type: Array.from(unionType.byGraph.keys()).map((graphName) => ({
                        graph: graphName.toUpperCase(),
                    })),
                    unionMember: Array.from(unionType.byGraph.entries())
                        .map(([graphName, meta]) => {
                        const graph = graphName.toUpperCase();
                        return Array.from(meta.members).map((member) => ({
                            graph,
                            member,
                        }));
                    })
                        .flat(1),
                },
                ast: {
                    directives: (0, common_js_1.convertToConst)(unionType.ast.directives),
                },
            });
        },
    };
}
function getOrCreateUnionType(state, typeName) {
    const existing = state.get(typeName);
    if (existing) {
        return existing;
    }
    const def = {
        kind: "union",
        name: typeName,
        members: new Set(),
        tags: new Set(),
        inaccessible: false,
        hasDefinition: false,
        byGraph: new Map(),
        ast: {
            directives: [],
        },
    };
    state.set(typeName, def);
    return def;
}
