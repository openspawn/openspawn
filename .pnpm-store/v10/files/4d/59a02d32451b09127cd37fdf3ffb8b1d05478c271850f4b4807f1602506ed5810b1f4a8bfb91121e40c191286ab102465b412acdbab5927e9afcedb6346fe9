import { buildASTSchema, getNamedType, isEnumType, isInputObjectType, isInterfaceType, isObjectType, isScalarType, isUnionType, Kind, specifiedScalarTypes, visit, } from "graphql";
const specifiedScalarNames = new Set(specifiedScalarTypes.map((t) => t.name));
export function getReachableTypes(documentNode) {
    const reachableTypeNames = new Set();
    const schema = buildASTSchema(documentNode);
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
        if (isObjectType(currentType)) {
            for (const field of Object.values(currentType.getFields())) {
                const fieldType = getNamedType(field.type);
                processNamedType(fieldType);
                for (const arg of field.args) {
                    const argType = getNamedType(arg.type);
                    processNamedType(argType);
                }
            }
            currentType.getInterfaces().forEach(processNamedType);
        }
        else if (isInputObjectType(currentType)) {
            for (const field of Object.values(currentType.getFields())) {
                const fieldType = getNamedType(field.type);
                processNamedType(fieldType);
            }
        }
        else if (isScalarType(currentType) || isEnumType(currentType)) {
            reachableTypeNames.add(currentType.name);
        }
        else if (isInterfaceType(currentType)) {
            for (const field of Object.values(currentType.getFields())) {
                const fieldType = getNamedType(field.type);
                processNamedType(fieldType);
            }
            currentType.getInterfaces().forEach(processNamedType);
            schema.getPossibleTypes(currentType).forEach(processNamedType);
        }
        else if (isUnionType(currentType)) {
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
                    kind: Kind.DIRECTIVE,
                    name: {
                        kind: Kind.NAME,
                        value: directiveName,
                    },
                },
            ];
        }
        return directives;
    };
}
export function addDirectiveOnTypes(args) {
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
    return visit(args.documentNode, {
        [Kind.OBJECT_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [Kind.INTERFACE_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [Kind.UNION_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [Kind.ENUM_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [Kind.INPUT_OBJECT_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
        [Kind.SCALAR_TYPE_DEFINITION]: onNamedTypeDefinitionNode,
    });
}
