import { GraphQLError, isTypeDefinitionNode, isTypeExtensionNode, } from "graphql";
export function KnownRootTypeRule(context) {
    const { definitions } = context.getDocument();
    const typeNames = new Set(definitions
        .filter(isTypeDefinitionOrExtensionNode)
        .map((def) => def.name.value));
    return {
        SchemaDefinition(node) {
            node.operationTypes.forEach((operationType) => {
                if (!typeNames.has(operationType.type.name.value)) {
                    context.reportError(new GraphQLError(`Cannot set schema ${operationType.operation} root to unknown type ${operationType.type.name.value}`, {
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
    return isTypeDefinitionNode(node) || isTypeExtensionNode(node);
}
