"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootTypeUsedRule = RootTypeUsedRule;
const graphql_1 = require("graphql");
function findDefaultRootTypes(definitions) {
    const foundRootTypes = {
        query: null,
        mutation: null,
        subscription: null,
    };
    const found = new Set();
    for (const definition of definitions) {
        if (found.size === 3) {
            break;
        }
        if ((0, graphql_1.isTypeDefinitionNode)(definition)) {
            if (definition.name.value === "Query") {
                foundRootTypes.query = "Query";
                found.add(graphql_1.OperationTypeNode.QUERY);
            }
            else if (definition.name.value === "Mutation") {
                foundRootTypes.mutation = "Mutation";
                found.add(graphql_1.OperationTypeNode.MUTATION);
            }
            else if (definition.name.value === "Subscription") {
                foundRootTypes.subscription = "Subscription";
                found.add(graphql_1.OperationTypeNode.SUBSCRIPTION);
            }
        }
    }
    return foundRootTypes;
}
function validateSchemaNode(node, definitions, context) {
    const definedDefaultRootTypes = findDefaultRootTypes(definitions);
    for (const operationType of node.operationTypes ?? []) {
        const defaultRootType = definedDefaultRootTypes[operationType.operation];
        const usedRootTypeName = operationType.type.name.value;
        if (defaultRootType && defaultRootType !== usedRootTypeName) {
            context.reportError(new graphql_1.GraphQLError(`The schema has a type named "${defaultRootType}" but it is not set as the ${operationType.operation} root type ("${usedRootTypeName}" is instead): this is not supported by federation. If a root type does not use its default name, there should be no other type with that default name.`, {
                nodes: node,
                extensions: {
                    code: `ROOT_${operationType.operation.toUpperCase()}_USED`,
                },
            }));
        }
    }
}
function RootTypeUsedRule(context) {
    const { definitions } = context.getDocument();
    return {
        SchemaDefinition(node) {
            validateSchemaNode(node, definitions, context);
        },
        SchemaExtension(node) {
            validateSchemaNode(node, definitions, context);
        },
    };
}
