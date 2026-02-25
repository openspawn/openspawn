"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueOperationTypesRule = UniqueOperationTypesRule;
const graphql_1 = require("graphql");
function UniqueOperationTypesRule(context) {
    const definedOperationTypes = new Set();
    return {
        SchemaDefinition: checkOperationTypes,
        SchemaExtension: checkOperationTypes,
    };
    function checkOperationTypes(node) {
        const operationTypesNodes = node.operationTypes || [];
        for (const operationType of operationTypesNodes) {
            const operation = operationType.operation;
            const alreadyDefinedOperationType = definedOperationTypes.has(operation);
            if (alreadyDefinedOperationType) {
                context.reportError(new graphql_1.GraphQLError(`There can be only one ${operation} type in schema.`, {
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
            else {
                definedOperationTypes.add(operation);
            }
        }
    }
}
