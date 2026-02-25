"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnownTypeNamesRule = KnownTypeNamesRule;
const graphql_1 = require("graphql");
function isTypeDefinitionOrExtensionNode(node) {
    return (0, graphql_1.isTypeDefinitionNode)(node) || (0, graphql_1.isTypeExtensionNode)(node);
}
function KnownTypeNamesRule(context) {
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
                context.reportError(new graphql_1.GraphQLError(`Unknown type ${typeName}`, {
                    nodes: node,
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
        },
    };
}
const standardTypeNames = new Set([...graphql_1.specifiedScalarTypes].map((type) => type.name));
function isSDLNode(value) {
    return ("kind" in value &&
        ((0, graphql_1.isTypeSystemDefinitionNode)(value) || (0, graphql_1.isTypeSystemExtensionNode)(value)));
}
