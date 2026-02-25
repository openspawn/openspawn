import { Kind, visit, } from "graphql";
import { extractLinkImplementations } from "../utils/link/index.js";
function createTransformTagDirectives(tagDirectiveName, inaccessibleDirectiveName) {
    return function transformTagDirectives(node, includeInaccessibleDirective = false) {
        let hasInaccessibleDirective = false;
        const directives = node.directives?.filter((directive) => {
            if (directive.name.value === inaccessibleDirectiveName) {
                hasInaccessibleDirective = true;
            }
            return directive.name.value !== tagDirectiveName;
        }) ?? [];
        if (hasInaccessibleDirective === false && includeInaccessibleDirective) {
            directives.push({
                kind: Kind.DIRECTIVE,
                name: {
                    kind: Kind.NAME,
                    value: inaccessibleDirectiveName,
                },
            });
        }
        return directives;
    };
}
function makeTypesFromSetInaccessible(documentNode, types, transformTagDirectives) {
    const alreadyAppliedOnTypeNames = new Set();
    function typeHandler(node) {
        if (types.has(node.name.value) === false ||
            alreadyAppliedOnTypeNames.has(node.name.value)) {
            return;
        }
        alreadyAppliedOnTypeNames.add(node.name.value);
        return {
            ...node,
            directives: transformTagDirectives(node, true),
        };
    }
    return visit(documentNode, {
        [Kind.OBJECT_TYPE_DEFINITION]: typeHandler,
        [Kind.OBJECT_TYPE_EXTENSION]: typeHandler,
        [Kind.INTERFACE_TYPE_DEFINITION]: typeHandler,
        [Kind.INTERFACE_TYPE_EXTENSION]: typeHandler,
        [Kind.INPUT_OBJECT_TYPE_DEFINITION]: typeHandler,
        [Kind.INPUT_OBJECT_TYPE_EXTENSION]: typeHandler,
        [Kind.ENUM_TYPE_DEFINITION]: typeHandler,
        [Kind.ENUM_TYPE_EXTENSION]: typeHandler,
    });
}
function collectTagsBySchemaCoordinateFromSubgraph(documentNode, map, subcoordinatesPerType) {
    const { resolveImportName } = extractLinkImplementations(documentNode);
    const tagDirectiveName = resolveImportName("https://specs.apollo.dev/federation", "@tag");
    const extractTag = createTagDirectiveNameExtractionStrategy(tagDirectiveName);
    function addTypeFields(typeName, fields) {
        let typeFields = subcoordinatesPerType.get(typeName);
        if (typeFields === undefined) {
            typeFields = new Set();
            subcoordinatesPerType.set(typeName, typeFields);
        }
        for (const value of fields) {
            typeFields.add(value);
        }
    }
    function addTagsPerSchemaCoordinate(schemaCoordinate, tagValues) {
        if (tagValues === undefined) {
            return;
        }
        let values = map.get(schemaCoordinate);
        if (values === undefined) {
            values = new Set();
            map.set(schemaCoordinate, values);
        }
        for (const tagValue of tagValues) {
            values.add(tagValue);
        }
    }
    function getTagsForNode(node) {
        const tags = new Set();
        node.directives?.forEach((directiveNode) => {
            const tagValue = extractTag(directiveNode);
            if (tagValue === null) {
                return;
            }
            tags.add(tagValue);
        });
        if (tags.size === 0) {
            return undefined;
        }
        return tags;
    }
    function TypeDefinitionHandler(node) {
        const tagValues = getTagsForNode(node);
        addTagsPerSchemaCoordinate(node.name.value, tagValues);
        const subCoordinates = new Set();
        node.fields?.forEach((fieldNode) => {
            const schemaCoordinate = `${node.name.value}.${fieldNode.name.value}`;
            subCoordinates.add(schemaCoordinate);
            const tagValues = getTagsForNode(fieldNode);
            addTagsPerSchemaCoordinate(schemaCoordinate, tagValues);
            if ("arguments" in fieldNode) {
                fieldNode.arguments?.forEach((argumentNode) => {
                    const schemaCoordinate = `${node.name.value}.${fieldNode.name.value}(${argumentNode.name.value}:)`;
                    subCoordinates.add(schemaCoordinate);
                    const tagValues = getTagsForNode(argumentNode);
                    addTagsPerSchemaCoordinate(schemaCoordinate, tagValues);
                });
            }
        });
        node.values?.forEach((valueNode) => {
            const schemaCoordinate = `${node.name.value}.${valueNode.name.value}`;
            subCoordinates.add(schemaCoordinate);
            const tagValues = getTagsForNode(valueNode);
            addTagsPerSchemaCoordinate(schemaCoordinate, tagValues);
        });
        addTypeFields(node.name.value, subCoordinates);
        return false;
    }
    visit(documentNode, {
        ScalarTypeDefinition: TypeDefinitionHandler,
        ScalarTypeExtension: TypeDefinitionHandler,
        UnionTypeDefinition: TypeDefinitionHandler,
        UnionTypeExtension: TypeDefinitionHandler,
        ObjectTypeDefinition: TypeDefinitionHandler,
        ObjectTypeExtension: TypeDefinitionHandler,
        InterfaceTypeDefinition: TypeDefinitionHandler,
        InterfaceTypeExtension: TypeDefinitionHandler,
        InputObjectTypeDefinition: TypeDefinitionHandler,
        InputObjectTypeExtension: TypeDefinitionHandler,
        EnumTypeDefinition: TypeDefinitionHandler,
        EnumTypeExtension: TypeDefinitionHandler,
    });
}
export function buildSchemaCoordinateTagRegister(documentNodes) {
    const schemaCoordinatesToTags = new Map();
    const subcoordinatesPerType = new Map();
    documentNodes.forEach((documentNode) => collectTagsBySchemaCoordinateFromSubgraph(documentNode, schemaCoordinatesToTags, subcoordinatesPerType));
    for (const [typeName, subCoordinates] of subcoordinatesPerType) {
        const tags = schemaCoordinatesToTags.get(typeName);
        if (tags === undefined) {
            continue;
        }
        for (const subCoordinate of subCoordinates) {
            let subcoordinateTags = schemaCoordinatesToTags.get(subCoordinate);
            if (!subcoordinateTags) {
                subcoordinateTags = new Set();
                schemaCoordinatesToTags.set(subCoordinate, subcoordinateTags);
            }
            for (const tag of tags) {
                subcoordinateTags.add(tag);
            }
        }
    }
    return schemaCoordinatesToTags;
}
function getRootQueryTypeNameFromDocumentNode(document) {
    let queryName = "Query";
    for (const definition of document.definitions) {
        if (definition.kind === Kind.SCHEMA_DEFINITION ||
            definition.kind === Kind.SCHEMA_EXTENSION) {
            for (const operationTypeDefinition of definition.operationTypes ?? []) {
                if (operationTypeDefinition.operation === "query") {
                    queryName = operationTypeDefinition.type.name.value;
                }
            }
        }
    }
    return queryName;
}
function hasIntersection(a, b) {
    if (a.size === 0 || b.size === 0) {
        return false;
    }
    for (const item of a) {
        if (b.has(item)) {
            return true;
        }
    }
    return false;
}
function difference(set1, set2) {
    const result = new Set();
    set1.forEach((item) => {
        if (!set2.has(item)) {
            result.add(item);
        }
    });
    return result;
}
export function applyTagFilterToInaccessibleTransformOnSubgraphSchema(documentNode, tagRegister, filter) {
    const { resolveImportName } = extractLinkImplementations(documentNode);
    const inaccessibleDirectiveName = resolveImportName("https://specs.apollo.dev/federation", "@inaccessible");
    const tagDirectiveName = resolveImportName("https://specs.apollo.dev/federation", "@tag");
    const externalDirectiveName = resolveImportName("https://specs.apollo.dev/federation", "@external");
    function getTagsForSchemaCoordinate(coordinate) {
        return tagRegister.get(coordinate) ?? new Set();
    }
    const transformTagDirectives = createTransformTagDirectives(tagDirectiveName, inaccessibleDirectiveName);
    const rootQueryTypeName = getRootQueryTypeNameFromDocumentNode(documentNode);
    const typesWithAllFieldsInaccessibleTracker = new Map();
    function onAllFieldsInaccessible(name) {
        const current = typesWithAllFieldsInaccessibleTracker.get(name);
        if (current === undefined) {
            typesWithAllFieldsInaccessibleTracker.set(name, true);
        }
    }
    function onSomeFieldsAccessible(name) {
        typesWithAllFieldsInaccessibleTracker.set(name, false);
    }
    function fieldArgumentHandler(objectLikeNode, fieldLikeNode, node) {
        if (node.directives?.find((d) => d.name.value === externalDirectiveName)) {
            return node;
        }
        const tagsOnNode = getTagsForSchemaCoordinate(`${objectLikeNode.name.value}.${fieldLikeNode.name.value}(${node.name.value}:)`);
        if ((filter.include.size && !hasIntersection(tagsOnNode, filter.include)) ||
            (filter.exclude.size && hasIntersection(tagsOnNode, filter.exclude))) {
            return {
                ...node,
                directives: transformTagDirectives(node, true),
            };
        }
        return {
            ...node,
            directives: transformTagDirectives(node),
        };
    }
    const definitionsBySchemaCoordinate = new Map();
    for (const definition of documentNode.definitions) {
        switch (definition.kind) {
            case Kind.OBJECT_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_EXTENSION:
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.INTERFACE_TYPE_EXTENSION:
            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
            case Kind.INPUT_OBJECT_TYPE_EXTENSION: {
                let items = definitionsBySchemaCoordinate.get(definition.name.value);
                if (!items) {
                    items = [];
                    definitionsBySchemaCoordinate.set(definition.name.value, items);
                }
                items.push(definition);
            }
        }
    }
    const typesWithInaccessibleApplied = new Set();
    const replacementTypeNodes = new Map();
    for (const [typeName, nodes] of definitionsBySchemaCoordinate) {
        let isSomeFieldsAccessible = false;
        for (const node of nodes) {
            const tagsOnNode = getTagsForSchemaCoordinate(node.name.value);
            let newNode = {
                ...node,
                fields: node.fields?.map((fieldNode) => {
                    const tagsOnNode = getTagsForSchemaCoordinate(`${node.name.value}.${fieldNode.name.value}`);
                    if (fieldNode.kind === Kind.FIELD_DEFINITION) {
                        fieldNode = {
                            ...fieldNode,
                            arguments: fieldNode.arguments?.map((argumentNode) => fieldArgumentHandler(node, fieldNode, argumentNode)),
                        };
                    }
                    if (fieldNode.directives?.find((d) => d.name.value === externalDirectiveName) ||
                        node.directives?.find((d) => d.name.value === externalDirectiveName)) {
                        return fieldNode;
                    }
                    if ((filter.include.size &&
                        !hasIntersection(tagsOnNode, filter.include)) ||
                        (filter.exclude.size && hasIntersection(tagsOnNode, filter.exclude))) {
                        return {
                            ...fieldNode,
                            directives: transformTagDirectives(fieldNode, true),
                        };
                    }
                    isSomeFieldsAccessible = true;
                    return {
                        ...fieldNode,
                        directives: transformTagDirectives(fieldNode),
                    };
                }),
            };
            if (filter.exclude.size && hasIntersection(tagsOnNode, filter.exclude)) {
                newNode = {
                    ...newNode,
                    directives: transformTagDirectives(node, typesWithInaccessibleApplied.has(typeName) ? false : true),
                };
                typesWithInaccessibleApplied.add(typeName);
            }
            else {
                newNode = {
                    ...newNode,
                    directives: transformTagDirectives(node),
                };
            }
            replacementTypeNodes.set(node, newNode);
        }
        if (isSomeFieldsAccessible) {
            onSomeFieldsAccessible(typeName);
            continue;
        }
        onAllFieldsInaccessible(typeName);
    }
    function fieldLikeObjectHandler(node) {
        const newNode = replacementTypeNodes.get(node);
        if (!newNode) {
            throw new Error(`Found type without transformation mapping. ${node.name.value} ${node.name.kind}`);
        }
        return newNode;
    }
    function enumHandler(node) {
        const tagsOnNode = getTagsForSchemaCoordinate(node.name.value);
        let isAllFieldsInaccessible = true;
        const newNode = {
            ...node,
            values: node.values?.map((valueNode) => {
                const tagsOnNode = getTagsForSchemaCoordinate(`${node.name.value}.${valueNode.name.value}`);
                if ((filter.include.size &&
                    !hasIntersection(tagsOnNode, filter.include)) ||
                    (filter.exclude.size && hasIntersection(tagsOnNode, filter.exclude))) {
                    return {
                        ...valueNode,
                        directives: transformTagDirectives(valueNode, true),
                    };
                }
                isAllFieldsInaccessible = false;
                return {
                    ...valueNode,
                    directives: transformTagDirectives(valueNode),
                };
            }),
        };
        if (filter.exclude.size && hasIntersection(tagsOnNode, filter.exclude)) {
            return {
                ...newNode,
                directives: transformTagDirectives(node, true),
            };
        }
        if (isAllFieldsInaccessible) {
            onAllFieldsInaccessible(node.name.value);
        }
        else {
            onSomeFieldsAccessible(node.name.value);
        }
        return {
            ...newNode,
            directives: transformTagDirectives(node),
        };
    }
    function scalarAndUnionHandler(node) {
        const tagsOnNode = getTagsForSchemaCoordinate(node.name.value);
        if ((filter.include.size && !hasIntersection(tagsOnNode, filter.include)) ||
            (filter.exclude.size && hasIntersection(tagsOnNode, filter.exclude))) {
            return {
                ...node,
                directives: transformTagDirectives(node, true),
            };
        }
        return {
            ...node,
            directives: transformTagDirectives(node),
        };
    }
    const typeDefs = visit(documentNode, {
        [Kind.OBJECT_TYPE_DEFINITION]: fieldLikeObjectHandler,
        [Kind.OBJECT_TYPE_EXTENSION]: fieldLikeObjectHandler,
        [Kind.INTERFACE_TYPE_DEFINITION]: fieldLikeObjectHandler,
        [Kind.INTERFACE_TYPE_EXTENSION]: fieldLikeObjectHandler,
        [Kind.INPUT_OBJECT_TYPE_DEFINITION]: fieldLikeObjectHandler,
        [Kind.INPUT_OBJECT_TYPE_EXTENSION]: fieldLikeObjectHandler,
        [Kind.ENUM_TYPE_DEFINITION]: enumHandler,
        [Kind.ENUM_TYPE_EXTENSION]: enumHandler,
        [Kind.SCALAR_TYPE_DEFINITION]: scalarAndUnionHandler,
        [Kind.UNION_TYPE_DEFINITION]: scalarAndUnionHandler,
    });
    typesWithAllFieldsInaccessibleTracker.delete(rootQueryTypeName);
    return {
        typeDefs,
        typesWithAllFieldsInaccessible: typesWithAllFieldsInaccessibleTracker,
        transformTagDirectives,
        typesWithInaccessibleApplied,
    };
}
export function applyTagFilterOnSubgraphs(subgraphs, filter) {
    const tagRegister = buildSchemaCoordinateTagRegister(subgraphs.map((s) => s.typeDefs));
    let filteredSubgraphs = subgraphs.map((subgraph) => {
        return {
            ...subgraph,
            ...applyTagFilterToInaccessibleTransformOnSubgraphSchema(subgraph.typeDefs, tagRegister, filter),
        };
    });
    const intersectionOfTypesWhereAllFieldsAreInaccessible = new Set();
    filteredSubgraphs.forEach((subgraph) => {
        const otherSubgraphs = filteredSubgraphs.filter((sub) => sub !== subgraph);
        for (const [type, allFieldsInaccessible,] of subgraph.typesWithAllFieldsInaccessible) {
            if (allFieldsInaccessible &&
                otherSubgraphs.every((sub) => !sub.typesWithAllFieldsInaccessible.has(type) ||
                    sub.typesWithAllFieldsInaccessible.get(type) === true)) {
                intersectionOfTypesWhereAllFieldsAreInaccessible.add(type);
            }
            otherSubgraphs.forEach((sub) => {
                sub.typesWithAllFieldsInaccessible.delete(type);
            });
        }
    });
    if (!intersectionOfTypesWhereAllFieldsAreInaccessible.size) {
        return filteredSubgraphs;
    }
    return filteredSubgraphs.map((subgraph) => ({
        ...subgraph,
        typeDefs: makeTypesFromSetInaccessible(subgraph.typeDefs, difference(intersectionOfTypesWhereAllFieldsAreInaccessible, subgraph.typesWithInaccessibleApplied), subgraph.transformTagDirectives),
    }));
}
export function createTagDirectiveNameExtractionStrategy(directiveName) {
    return (directiveNode) => {
        if (directiveNode.name.value === directiveName &&
            directiveNode.arguments?.[0].name.value === "name" &&
            directiveNode.arguments?.[0]?.value.kind === Kind.STRING) {
            return directiveNode.arguments[0].value.value ?? null;
        }
        return null;
    };
}
