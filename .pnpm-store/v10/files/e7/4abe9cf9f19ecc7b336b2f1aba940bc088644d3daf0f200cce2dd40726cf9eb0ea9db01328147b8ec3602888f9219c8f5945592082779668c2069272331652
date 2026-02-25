import { createDirectiveNode } from "./ast.js";
import { convertToConst } from "./common.js";
export function directiveBuilder() {
    return {
        visitSubgraphState(graph, state, directiveName, directive) {
            if (!directive.composed && !directive.isExecutable) {
                return;
            }
            const directiveState = getOrCreateDirective(state, directiveName);
            for (const location of directive.locations) {
                directiveState.locations.add(location);
            }
            if (directive.repeatable) {
                directiveState.repeatable = true;
            }
            if (directive.isExecutable) {
                directiveState.isExecutable = true;
            }
            if (directive.composed) {
                directiveState.composed = true;
            }
            for (const arg of directive.args.values()) {
                const argState = getOrCreateArg(directiveState, arg.name, arg.type, arg.kind);
                arg.tags.forEach((tag) => argState.tags.add(tag));
                if (arg.type.endsWith("!")) {
                    argState.type = arg.type;
                }
                arg.ast.directives.forEach((directive) => {
                    argState.ast.directives.push(directive);
                });
                if (arg.inaccessible) {
                    argState.inaccessible = true;
                }
                argState.kind = arg.kind;
                argState.byGraph.set(graph.id, {
                    type: arg.type,
                    kind: arg.kind,
                    defaultValue: arg.defaultValue,
                    version: graph.version,
                });
            }
            directiveState.byGraph.set(graph.id, {
                locations: directive.locations,
                repeatable: directive.repeatable,
                version: graph.version,
            });
        },
        composeSupergraphNode(directive) {
            return createDirectiveNode({
                name: directive.name,
                locations: Array.from(directive.locations),
                repeatable: directive.repeatable,
                arguments: Array.from(directive.args.values()).map((arg) => ({
                    name: arg.name,
                    type: arg.type,
                    kind: arg.kind,
                    cost: null,
                    tags: Array.from(arg.tags),
                    inaccessible: arg.inaccessible,
                    defaultValue: arg.defaultValue,
                    ast: {
                        directives: convertToConst(arg.ast.directives),
                    },
                })),
            });
        },
    };
}
function getOrCreateDirective(state, directiveName) {
    const existing = state.get(directiveName);
    if (existing) {
        return existing;
    }
    const def = {
        kind: "directive",
        name: directiveName,
        locations: new Set(),
        byGraph: new Map(),
        args: new Map(),
        repeatable: false,
        isExecutable: false,
        composed: false,
    };
    state.set(directiveName, def);
    return def;
}
function getOrCreateArg(directiveState, argName, argType, argKind) {
    const existing = directiveState.args.get(argName);
    if (existing) {
        return existing;
    }
    const def = {
        name: argName,
        type: argType,
        kind: argKind,
        inaccessible: false,
        tags: new Set(),
        byGraph: new Map(),
        ast: {
            directives: [],
        },
    };
    directiveState.args.set(argName, def);
    return def;
}
export function isArgumentTypeIdenticalInEverySubgraph(directiveArgState, totalSubgraphSize) {
    if (directiveArgState.byGraph.size !== totalSubgraphSize) {
        return false;
    }
    for (const arg of directiveArgState.byGraph.values()) {
        if (arg.type !== directiveArgState.type) {
            return false;
        }
    }
    return true;
}
