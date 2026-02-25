"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnownRootTypeRule = KnownRootTypeRule;
const graphql_1 = require("graphql");
function KnownRootTypeRule(context) {
    const { definitions } = context.getDocument();
    const typeNames = new Set(definitions
        .filter(isTypeDefinitionOrExtensionNode)
        .map((def) => def.name.value));
    return {
        SchemaDefinition(node) {
            node.operationTypes.forEach((operationType) => {
                if (!typeNames.has(operationType.type.name.value)) {
                    context.reportError(new graphql_1.GraphQLError(`Cannot set schema ${operationType.operation} root to unknown type ${operationType.type.name.value}`, {
                        extensions: {
                            code: "INVALID_GRAPHQL",
                        },
                    }));
                }
            });
        },
    };
}
function isTypeDefinitionOrExtensionNode(node) {
    return (0, graphql_1.isTypeDefinitionNode)(node) || (0, graphql_1.isTypeExtensionNode)(node);
}
