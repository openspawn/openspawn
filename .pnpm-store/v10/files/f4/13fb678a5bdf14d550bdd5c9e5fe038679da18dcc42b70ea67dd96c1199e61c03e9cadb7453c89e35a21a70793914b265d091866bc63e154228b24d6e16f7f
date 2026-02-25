"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputObjectValuesRule = InputObjectValuesRule;
const graphql_1 = require("graphql");
function InputObjectValuesRule(context) {
    return {
        InputObjectType(inputObjectTypeState) {
            const fieldsInCommon = [];
            const total = inputObjectTypeState.byGraph.size;
            for (const [fieldName, fieldState] of inputObjectTypeState.fields) {
                if (fieldState.byGraph.size === total) {
                    fieldsInCommon.push(fieldName);
                }
            }
            if (fieldsInCommon.length === 0) {
                context.reportError(new graphql_1.GraphQLError(`None of the fields of input object type "${inputObjectTypeState.name}" are consistently defined in all the subgraphs defining that type. As only fields common to all subgraphs are merged, this would result in an empty type.`, {
                    extensions: {
                        code: "EMPTY_MERGED_INPUT_TYPE",
                    },
                }));
            }
        },
    };
}
