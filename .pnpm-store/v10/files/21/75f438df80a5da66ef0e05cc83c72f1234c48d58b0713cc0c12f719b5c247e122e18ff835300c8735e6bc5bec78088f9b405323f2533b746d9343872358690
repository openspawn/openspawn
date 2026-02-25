import { GraphQLError, isTypeDefinitionNode, isTypeExtensionNode, isTypeSystemDefinitionNode, isTypeSystemExtensionNode, specifiedScalarTypes, } from "graphql";
function isTypeDefinitionOrExtensionNode(node) {
    return isTypeDefinitionNode(node) || isTypeExtensionNode(node);
}
export function KnownTypeNamesRule(context) {
    const { definitions } = context.getDocument();
    const typeNames = new Set(definitions
        .filter(isTypeDefinitionOrExtensionNode)
        .map((def) => def.name.value));
    return {
        NamedType(node, _1, parent, _2, ancestors) {
            const typeName = node.name.value;
            if (!typeNames.has(typeName)) {
                const definitionNode = ancestors[2] ?? parent;
                const isSDL = definitionNode != null && isSDLNode(definitionNode);
                if (isSDL && standardTypeNames.has(typeName)) {
                    return;
                }
                context.reportError(new GraphQLError(`Unknown type ${typeName}`, {
                    nodes: node,
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
        },
    };
}
const standardTypeNames = new Set([...specifiedScalarTypes].map((type) => type.name));
function isSDLNode(value) {
    return ("kind" in value &&
        (isTypeSystemDefinitionNode(value) || isTypeSystemExtensionNode(value)));
}
