"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceObjectUsageErrorRule = InterfaceObjectUsageErrorRule;
const graphql_1 = require("graphql");
function InterfaceObjectUsageErrorRule(context) {
    return {
        InterfaceType(interfaceState) {
            if (!interfaceState.hasInterfaceObject) {
                return;
            }
            for (const [_, interfaceStateInGraph] of interfaceState.byGraph) {
                if (!interfaceStateInGraph.isInterfaceObject) {
                    return;
                }
            }
            context.reportError(new graphql_1.GraphQLError(`Type "${interfaceState.name}" is declared with @interfaceObject in all the subgraphs in which is is defined`, {
                extensions: {
                    code: "INTERFACE_OBJECT_USAGE_ERROR",
                },
            }));
        },
    };
}
