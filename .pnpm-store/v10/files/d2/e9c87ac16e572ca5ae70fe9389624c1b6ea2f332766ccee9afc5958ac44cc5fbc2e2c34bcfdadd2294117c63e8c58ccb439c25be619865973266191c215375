"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceKeyMissingImplementationTypeRule = InterfaceKeyMissingImplementationTypeRule;
const graphql_1 = require("graphql");
const version_js_1 = require("../../../utils/version.js");
function InterfaceKeyMissingImplementationTypeRule(context) {
    return {
        InterfaceType(interfaceState) {
            if (!interfaceState.isEntity || interfaceState.hasInterfaceObject) {
                return;
            }
            let someSubgraphsAreMissingImplementation = false;
            for (const interfaceStateInGraph of interfaceState.byGraph.values()) {
                if ((0, version_js_1.satisfiesVersionRange)(interfaceStateInGraph.version, "< v2.3")) {
                    continue;
                }
                if (interfaceStateInGraph.keys.length === 0) {
                    continue;
                }
                if (interfaceStateInGraph.implementedBy.size === 0 &&
                    !interfaceStateInGraph.isInterfaceObject) {
                    someSubgraphsAreMissingImplementation = true;
                    break;
                }
            }
            if (!someSubgraphsAreMissingImplementation) {
                return;
            }
            for (const [graph, interfaceStateInGraph] of interfaceState.byGraph) {
                if (interfaceStateInGraph.keys.length === 0) {
                    continue;
                }
                const firstKeyFields = interfaceStateInGraph.keys[0].fields;
                const graphName = context.graphIdToName(graph);
                const typesToDefine = Array.from(interfaceState.implementedBy)
                    .filter((objectTypeName) => !interfaceStateInGraph.implementedBy.has(objectTypeName))
                    .sort();
                context.reportError(new graphql_1.GraphQLError(`[${graphName}] Interface type "${interfaceState.name}" has a resolvable key (@key(fields: "${firstKeyFields}")) in subgraph "${graphName}" but that subgraph is missing some of the supergraph implementation types of "${interfaceState.name}". Subgraph "${graphName}" should define ${typesToDefine.length > 1 ? "types" : "type"} ${joinWithAnd(typesToDefine)} (and have ${typesToDefine.length > 1 ? "them" : "it"} implement "${interfaceState.name}").`, {
                    extensions: {
                        code: "INTERFACE_KEY_MISSING_IMPLEMENTATION_TYPE",
                    },
                }));
            }
        },
    };
}
function joinWithAnd(list) {
    if (list.length <= 2) {
        return `"${list.join('" and "')}"`;
    }
    const last = list.pop();
    return `"${list.join('", "')}" and "${last}"`;
}
