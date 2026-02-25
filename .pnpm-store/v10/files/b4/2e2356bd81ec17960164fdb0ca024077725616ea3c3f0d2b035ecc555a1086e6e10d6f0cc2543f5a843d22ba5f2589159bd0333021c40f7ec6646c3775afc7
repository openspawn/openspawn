"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReachableTypes = getReachableTypes;
exports.addDirectiveOnTypes = addDirectiveOnTypes;
const graphql_1 = require("graphql");
const specifiedScalarNames = new Set(graphql_1.specifiedScalarTypes.map((t) => t.name));
function getReachableTypes(documentNode) {
    const reachableTypeNames = new Set();
    const schema = (0, graphql_1.buildASTSchema)(documentNode);
    const didVisitType = new Set();
    const typeQueue = [];
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType();
    const subscriptionType = schema.getSubscriptionType();
    if (queryType) {
        processNamedType(queryType);
    }
    if (mutationType) {
        processNamedType(mutationType);
    }
    if (subscriptionType) {
        processNamedType(subscriptionType);
    }
    function processNamedType(tType) {
        if (didVisitType.has(tType) || specifiedScalarNames.has(tType.name)) {
            return;
        }
        didVisitType.add(tType);
        typeQueue.push(tType);
        reachableTypeNames.add(tType.name);
    }
    let currentType;
    while ((currentType = typeQueue.shift())) {
        if ((0, graphql_1.isObjectType)(currentType)) {
            for (const field of Object.values(currentType.getFields())) {
                const fieldType = (0, graphql_1.getNamedType)(field.type);
                processNamedType(fieldType);
                for (const arg of field.args) {
                    const argType = (0, graphql_1.getNamedType)(arg.type);
                    processNamedType(argType);
                }
            }
            currentType.getInterfaces().forEach(processNamedType);
        }
        else if ((0, graphql_1.isInputObjectType)(currentType)) {
            for (const field of Object.values(currentType.getFields())) {
                const fieldType = (0, graphql_1.getNamedType)(field.type);
                processNamedType(fieldType);
            }
        }
        else if ((0, graphql_1.isScalarType)(currentType) || (0, graphql_1.isEnumType)(currentType)) {
            reachableTypeNames.add(currentType.name);
        }
        else if ((0, graphql_1.isInterfaceType)(currentType)) {
            for (const field of Object.values(currentType.getFields())) {
                const fieldType = (0, graphql_1.getNamedType)(field.type);
                processNamedType(fieldType);
            }
            currentType.getInterfaces().forEach(processNamedType);
            schema.getPossibleTypes(currentType).forEach(processNamedType);
        }
        else if ((0, graphql_1.isUnionType)(currentType)) {
            currentType.getTypes().forEach(processNamedType);
        }
    }
    return reachableTypeNames;
}
function createAddDirectiveIfNotExists(directiveName) {
    return function addDirectiveIfNotExists(directives) {
        const hasInaccessibleDirective = !!directives?.some((directive) => directive.name.value === directiveName);
        if (!hasInaccessibleDirective) {
            return [
                ...(directives ?? []),
                {
                    kind: graphql_1.Kind.DIRECTIVE,
                    name: {
                        kind: graphql_1.Kind.NAME,
                        value: directiveName,
                    },
                },
            ];
        }
        return directives;
    };
}
function addDirectiveOnTypes(args) {
    const addDirectiveIfNotExists = createAddDirectiveIfNotExists(args.directiveName);
    function onNamedTypeDefinitionNode(node) {
        if (args.excludedTypeNames.has(node.name.value)) {
            return;
        }
        return {
            ...node,
            directives: addDirectiveIfNotExists(node.directives),
        };
    }
    return (0, graphql_1.visit)(args.documentNode, {
        [graphql_1.Kind.OBJECT_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [graphql_1.Kind.INTERFACE_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [graphql_1.Kind.UNION_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [graphql_1.Kind.ENUM_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [graphql_1.Kind.SCALAR_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
    });
}
