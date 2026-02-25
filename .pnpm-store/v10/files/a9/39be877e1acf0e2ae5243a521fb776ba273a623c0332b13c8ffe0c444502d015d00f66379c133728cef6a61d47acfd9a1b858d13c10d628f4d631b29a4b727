"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiredInputFieldMissingInSomeSubgraphRule = RequiredInputFieldMissingInSomeSubgraphRule;
const graphql_1 = require("graphql");
function RequiredInputFieldMissingInSomeSubgraphRule(context) {
    return {
        InputObjectTypeField(inputObjectState, fieldState) {
            if (fieldState.type.endsWith("!")) {
                if (inputObjectState.byGraph.size === 1) {
                    return;
                }
                if (inputObjectState.byGraph.size === fieldState.byGraph.size) {
                    return;
                }
                const graphsWithRequiredField = Array.from(fieldState.byGraph)
                    .filter(([_, field]) => field.type.endsWith("!"))
                    .map(([graph]) => graph);
                const graphsWithoutField = Array.from(inputObjectState.byGraph.keys()).filter((graph) => !fieldState.byGraph.has(graph));
                const requiredIn = `subgraph${graphsWithRequiredField.length > 1 ? "s" : ""} "${graphsWithRequiredField.map(context.graphIdToName).join('", "')}"`;
                const missingIn = `subgraph${graphsWithoutField.length > 1 ? "s" : ""} "${graphsWithoutField
                    .map(context.graphIdToName)
                    .join('", "')}"`;
                context.reportError(new graphql_1.GraphQLError(`Input object field "${inputObjectState.name}.${fieldState.name}" is required in some subgraphs but does not appear in all subgraphs: it is required in ${requiredIn} but does not appear in ${missingIn}`, {
                    extensions: {
                        code: "REQUIRED_INPUT_FIELD_MISSING_IN_SOME_SUBGRAPH",
                    },
                }));
            }
        },
    };
}
