"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryRootTypeInaccessibleRule = QueryRootTypeInaccessibleRule;
const graphql_1 = require("graphql");
function QueryRootTypeInaccessibleRule(context) {
    let rootTypeName = "Query";
    return {
        SchemaDefinition(node) {
            const nonQueryType = node.operationTypes?.find((operationType) => operationType.operation === graphql_1.OperationTypeNode.QUERY &&
                operationType.type.name.value !== "Query");
            if (nonQueryType) {
                rootTypeName = nonQueryType.type.name.value;
            }
        },
        SchemaExtension(node) {
            const nonQueryType = node.operationTypes?.find((operationType) => operationType.operation === graphql_1.OperationTypeNode.QUERY &&
                operationType.type.name.value !== "Query");
            if (nonQueryType) {
                rootTypeName = nonQueryType.type.name.value;
            }
        },
        ObjectTypeDefinition(node) {
            const name = node.name.value;
            if (name !== rootTypeName) {
                return;
            }
            if (node.directives?.some((directive) => context.isAvailableFederationDirective("inaccessible", directive))) {
                context.reportError(new graphql_1.GraphQLError(`Type "Query" is @inaccessible but is the root query type, which must be in the API schema.`, {
                    nodes: node,
                    extensions: { code: "QUERY_ROOT_TYPE_INACCESSIBLE" },
                }));
            }
        },
    };
}
