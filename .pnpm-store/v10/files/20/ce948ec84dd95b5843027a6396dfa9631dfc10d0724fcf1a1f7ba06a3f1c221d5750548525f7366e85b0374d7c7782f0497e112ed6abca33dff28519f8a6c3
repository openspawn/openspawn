import { GraphQLError } from "graphql";
export function DirectiveCompositionRule(context, supergraph) {
    const linkIdentityToMajorVersion = new Map();
    const appliedDirectiveToGraphs = new Map();
    const appliedDirectiveToLinkIdentities = new Map();
    for (const link of supergraph.links) {
        if (link.version) {
            const major = parseInt(link.version.replace("v", "").split(".")[0]);
            const existing = linkIdentityToMajorVersion.get(link.identity);
            if (typeof existing === "number" && existing !== major) {
                context.reportError(new GraphQLError(`Core feature "${link.identity}" requested to be merged has major version mismatch across subgraphs`, {
                    extensions: {
                        code: "DIRECTIVE_COMPOSITION_ERROR",
                        versions: [existing, major],
                    },
                }));
            }
            else {
                linkIdentityToMajorVersion.set(link.identity, major);
            }
        }
        for (const im of link.imports) {
            if (im.kind === "directive") {
                const appliedName = im.alias ?? im.name;
                const originalName = im.name;
                const appliedDirectiveToGraph = appliedDirectiveToGraphs.get(originalName);
                if (appliedDirectiveToGraph) {
                    const graphs = appliedDirectiveToGraph.get(appliedName);
                    if (graphs) {
                        graphs.add(link.graph);
                    }
                    else {
                        appliedDirectiveToGraph.set(appliedName, new Set([link.graph]));
                    }
                }
                else {
                    appliedDirectiveToGraphs.set(originalName, new Map([[appliedName, new Set([link.graph])]]));
                }
                const appliedDirectiveToLinkIdentity = appliedDirectiveToLinkIdentities.get(appliedName);
                if (appliedDirectiveToLinkIdentity) {
                    appliedDirectiveToLinkIdentity.add(link.identity);
                }
                else {
                    appliedDirectiveToLinkIdentities.set(appliedName, new Set([link.identity]));
                }
            }
        }
    }
    for (const [originalDirectiveName, appliedNames,] of appliedDirectiveToGraphs) {
        if (appliedNames.size > 1) {
            const groups = Array.from(appliedNames.entries()).map(([appliedName, graphs]) => {
                const plural = graphs.size > 1 ? "s" : "";
                return `name "${appliedName}" in subgraph${plural} "${Array.from(graphs)
                    .map(context.graphIdToName)
                    .join('", "')}"`;
            });
            const [first, second, ...rest] = groups;
            context.reportError(new GraphQLError(`Composed directive "${originalDirectiveName}" has incompatible name across subgraphs: it has ${first} but ${second}${rest.length ? ` and ${rest.join(" and ")}` : ""}. Composed directive must have the same name across all subgraphs.`, {
                extensions: {
                    code: "DIRECTIVE_COMPOSITION_ERROR",
                },
            }));
        }
    }
    for (const [directiveName, linkIdentities,] of appliedDirectiveToLinkIdentities) {
        if (linkIdentities.size > 1) {
            context.reportError(new GraphQLError(`Composed directive "${directiveName}" is not linked by the same core feature in every subgraph`, {
                extensions: {
                    code: "DIRECTIVE_COMPOSITION_ERROR",
                },
            }));
        }
    }
    return {
        Directive(directiveState) {
            if (directiveState.byGraph.size === 1 ||
                (directiveState.isExecutable && !directiveState.composed)) {
                return;
            }
            const graphsSize = directiveState.byGraph.size;
            const hasLocationDefinedInAllGraphs = Array.from(directiveState.locations).some((location) => {
                let count = 0;
                for (const [_, graphState] of directiveState.byGraph) {
                    if (graphState.locations.has(location)) {
                        count++;
                    }
                }
                return count === graphsSize;
            });
            if (!hasLocationDefinedInAllGraphs) {
                context.reportError(new GraphQLError(`Directive "@${directiveState.name}" has no shared locations between subgraphs`));
            }
        },
    };
}
