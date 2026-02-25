import { isTypeDefinitionNode, Kind, parse, specifiedScalarTypes, } from "graphql";
import { createSpecSchema, } from "../../specifications/federation.js";
import { sdl as linkSpecSdl } from "../../specifications/link.js";
import { stripTypeModifiers } from "../../utils/state.js";
import { satisfiesVersionRange } from "../../utils/version.js";
import { TypeKind } from "../state.js";
const linkSpec = parse(linkSpecSdl);
const linkSpecDirectives = linkSpec.definitions.filter((def) => def.kind === Kind.DIRECTIVE_DEFINITION);
const linkSpecTypes = linkSpec.definitions.filter(isTypeDefinitionNode);
export function createSimpleValidationContext(typeDefs, typeNodeInfo) {
    let reportedErrors = [];
    const directiveDefinitionMap = new Map();
    const typeDefinitionMap = new Map();
    for (const definition of typeDefs.definitions) {
        if (definition.kind === Kind.DIRECTIVE_DEFINITION) {
            directiveDefinitionMap.set(definition.name.value, definition);
        }
        else if ("name" in definition &&
            definition.name &&
            definition.name.kind === Kind.NAME) {
            typeDefinitionMap.set(definition.name.value, {
                name: definition.name,
                kind: definition.kind,
            });
        }
    }
    return {
        getDocument() {
            return typeDefs;
        },
        getKnownDirectiveDefinition(name) {
            return directiveDefinitionMap.get(name);
        },
        getKnownTypeDefinition(name) {
            return typeDefinitionMap.get(name);
        },
        getSchemaCoordinate(ancestors) {
            let coordinate = "";
            for (let i = 0; i < ancestors.length; i++) {
                const ancestor = ancestors[i];
                if ("kind" in ancestor && ancestor.kind !== Kind.DOCUMENT) {
                    const name = ancestor.kind === Kind.SCHEMA_DEFINITION ||
                        ancestor.kind === Kind.SCHEMA_EXTENSION
                        ? "schema"
                        : "name" in ancestor && ancestor.name
                            ? ancestor.name.value
                            : "";
                    if (coordinate.length > 0) {
                        coordinate = coordinate + "." + name;
                    }
                    else {
                        coordinate = name;
                    }
                }
            }
            return coordinate;
        },
        reportError(error) {
            reportedErrors.push(error);
        },
        collectReportedErrors() {
            const errors = reportedErrors;
            reportedErrors = [];
            return errors;
        },
    };
}
export function createSubgraphValidationContext(subgraph, federation, typeNodeInfo, stateBuilder) {
    const { version, imports } = federation;
    const availableSpec = createSpecSchema(version, imports);
    const knownSpec = createSpecSchema(version);
    const knownObjectAndInterfaceSubgraphEntities = new Map();
    const knownUnionTypesMembers = new Map();
    const typenameToKind = new Map();
    const objectOrInterfaceKinds = [
        Kind.OBJECT_TYPE_DEFINITION,
        Kind.OBJECT_TYPE_EXTENSION,
        Kind.INTERFACE_TYPE_DEFINITION,
        Kind.INTERFACE_TYPE_EXTENSION,
    ];
    function isObjectOrInterfaceNode(node) {
        return objectOrInterfaceKinds.includes(node.kind);
    }
    function isUnionNode(node) {
        return (node.kind === Kind.UNION_TYPE_EXTENSION ||
            node.kind === Kind.UNION_TYPE_DEFINITION);
    }
    for (const def of subgraph.typeDefs.definitions) {
        if (isUnionNode(def)) {
            const found = knownUnionTypesMembers.get(def.name.value);
            if (!found) {
                knownUnionTypesMembers.set(def.name.value, new Set(def.types?.map((type) => type.name.value)));
                continue;
            }
            def.types?.forEach((namedType) => {
                found.add(namedType.name.value);
            });
            continue;
        }
        if (!isObjectOrInterfaceNode(def)) {
            continue;
        }
        typenameToKind.set(def.name.value, def.kind === Kind.OBJECT_TYPE_DEFINITION ||
            def.kind === Kind.OBJECT_TYPE_EXTENSION
            ? TypeKind.OBJECT
            : TypeKind.INTERFACE);
        const found = knownObjectAndInterfaceSubgraphEntities.get(def.name.value);
        if (!found) {
            knownObjectAndInterfaceSubgraphEntities.set(def.name.value, { ...def });
            continue;
        }
        found.fields = (found.fields ?? []).concat(def.fields ?? []);
        found.interfaces = (found.interfaces ?? []).concat(def.interfaces ?? []);
        found.directives = (found.directives ?? []).concat(def.directives ?? []);
        if (def.kind === Kind.OBJECT_TYPE_DEFINITION &&
            found.kind === Kind.OBJECT_TYPE_EXTENSION) {
            found.kind = Kind.OBJECT_TYPE_DEFINITION;
        }
        else if (def.kind === Kind.INTERFACE_TYPE_DEFINITION &&
            found.kind === Kind.INTERFACE_TYPE_EXTENSION) {
            found.kind = Kind.INTERFACE_TYPE_DEFINITION;
        }
    }
    const knownSubgraphDirectiveDefinitions = new Map(subgraph.typeDefs.definitions.filter((def) => def.kind === Kind.DIRECTIVE_DEFINITION).map((def) => [def.name.value, def]));
    const leafTypeNames = new Set(specifiedScalarTypes.map((type) => type.name));
    for (const def of subgraph.typeDefs.definitions) {
        if (def.kind === Kind.SCALAR_TYPE_DEFINITION ||
            def.kind === Kind.SCALAR_TYPE_EXTENSION ||
            def.kind === Kind.ENUM_TYPE_DEFINITION ||
            def.kind === Kind.ENUM_TYPE_EXTENSION) {
            leafTypeNames.add(def.name.value);
        }
    }
    let reportedErrors = [];
    const markedAsExternal = new Set();
    const markedAsUsed = new Set();
    const markedAsKeyField = new Set();
    const overwrittenFederationDefinitionNames = new Set();
    const directiveAlternativeNamesMap = new Map();
    for (const specDirective of availableSpec.directives) {
        const isFederationPrefixed = specDirective.name.value.startsWith("federation__");
        if (isFederationPrefixed) {
            const normalizedName = specDirective.name.value.replace("federation__", "");
            const setOfNames = directiveAlternativeNamesMap.get(normalizedName);
            if (!setOfNames) {
                directiveAlternativeNamesMap.set(normalizedName, new Set([specDirective.name.value]));
            }
        }
        else {
            const { alias } = imports.find((i) => i.name.replace(/^@/, "") === specDirective.name.value) ?? {
                alias: undefined,
            };
            let setOfNames = directiveAlternativeNamesMap.get(specDirective.name.value);
            if (!setOfNames) {
                directiveAlternativeNamesMap.set(specDirective.name.value, new Set());
                setOfNames = directiveAlternativeNamesMap.get(specDirective.name.value);
            }
            setOfNames.add(alias ? alias.replace(/^@/, "") : specDirective.name.value);
            setOfNames.add(`federation__${specDirective.name.value}`);
        }
    }
    const typeAlternativeNamesMap = new Map();
    for (const specType of availableSpec.types) {
        const isFederationPrefixed = specType.name.value.startsWith("federation__");
        if (isFederationPrefixed) {
            const normalizedName = specType.name.value.replace("federation__", "");
            const setOfNames = typeAlternativeNamesMap.get(normalizedName);
            if (!setOfNames) {
                typeAlternativeNamesMap.set(normalizedName, new Set([specType.name.value]));
            }
        }
        else {
            const { alias } = imports.find((i) => i.name === specType.name.value) ?? {
                alias: undefined,
            };
            let setOfNames = typeAlternativeNamesMap.get(specType.name.value);
            if (!setOfNames) {
                typeAlternativeNamesMap.set(specType.name.value, new Set());
                setOfNames = typeAlternativeNamesMap.get(specType.name.value);
            }
            setOfNames.add(alias ? alias : specType.name.value);
            setOfNames.add(`federation__${specType.name.value}`);
        }
    }
    const importedTypesSet = new Set(availableSpec.types.map((t) => t.name.value));
    if (importedTypesSet.size) {
        subgraph.typeDefs.definitions.forEach((def) => {
            if ("name" in def && def.name && importedTypesSet.has(def.name.value)) {
                overwrittenFederationDefinitionNames.add(def.name.value);
            }
        });
    }
    return {
        stateBuilder,
        federationImports: imports,
        isLinkSpecDirective(name) {
            return linkSpecDirectives.some((d) => d.name.value === name);
        },
        isLinkSpecType(name) {
            return linkSpecTypes.some((t) => t.name.value === name);
        },
        isAvailableFederationType(name) {
            const alternativeNames = typeAlternativeNamesMap.get(name);
            if (alternativeNames) {
                return alternativeNames.has(name);
            }
            return false;
        },
        isAvailableFederationDirective(specDirectiveName, directiveNode) {
            const alternativeNames = directiveAlternativeNamesMap.get(specDirectiveName);
            if (alternativeNames) {
                return alternativeNames.has(typeof directiveNode.name === "string"
                    ? directiveNode.name
                    : directiveNode.name.value);
            }
            return false;
        },
        satisfiesVersionRange(range) {
            return satisfiesVersionRange(version, range);
        },
        getKnownFederationDirectives() {
            return knownSpec.directives;
        },
        getAvailableFederationDirectives() {
            return availableSpec.directives;
        },
        isLeafType(typeName) {
            return leafTypeNames.has(typeName);
        },
        getSubgraphObjectOrInterfaceTypes() {
            return knownObjectAndInterfaceSubgraphEntities;
        },
        getSubgraphUnionTypes() {
            return knownUnionTypesMembers;
        },
        getSubgraphDirectiveDefinitions() {
            return knownSubgraphDirectiveDefinitions;
        },
        getAvailableFederationTypeAndDirectiveDefinitions() {
            return [].concat(availableSpec.directives.map((d) => {
                const alias = imports.find((i) => i.name.replace(/^@/, "") === d.name.value)?.alias;
                if (alias) {
                    d.name.value = alias.replace(/^@/, "");
                }
                return d;
            }), availableSpec.types.map((t) => {
                const alias = imports.find((i) => i.name === t.name.value)?.alias;
                if (alias) {
                    t.name.value = alias;
                }
                return t;
            }));
        },
        typeNodeInfo,
        getDocument() {
            return subgraph.typeDefs;
        },
        getSubgraphName() {
            return subgraph.name;
        },
        getSubgraphId() {
            return subgraph.id;
        },
        markAsExternal(coordinate) {
            markedAsExternal.add(coordinate);
        },
        getFieldsToMarkAsShareable() {
            const shareableFields = [];
            for (const coordinate of markedAsKeyField) {
                const [typeName, fieldName] = coordinate.split(".");
                if (typenameToKind.get(typeName) === TypeKind.OBJECT) {
                    shareableFields.push({ typeName, fieldName });
                }
            }
            return shareableFields;
        },
        markAsUsed(reason, kind, typeName, fieldName) {
            if (!fieldName.startsWith("__") &&
                !typeName.startsWith("__") &&
                reason === "fields") {
                switch (kind) {
                    case Kind.OBJECT_TYPE_DEFINITION:
                    case Kind.OBJECT_TYPE_EXTENSION: {
                        stateBuilder.objectType.field.setUsed(typeName, fieldName);
                        break;
                    }
                    case Kind.INTERFACE_TYPE_DEFINITION:
                    case Kind.INTERFACE_TYPE_EXTENSION: {
                        stateBuilder.interfaceType.field.setUsed(typeName, fieldName);
                        break;
                    }
                }
            }
            markedAsUsed.add(`${typeName}.${fieldName}`);
        },
        markAsKeyField(coordinate) {
            markedAsKeyField.add(coordinate);
        },
        markAsFederationDefinitionReplacement(name) {
            overwrittenFederationDefinitionNames.add(name);
        },
        collectFederationDefinitionReplacements() {
            return overwrittenFederationDefinitionNames;
        },
        collectUnusedExternal() {
            if (version === "v1.0") {
                return Array.from(markedAsExternal).filter((c) => !markedAsUsed.has(c) && markedAsKeyField.has(c));
            }
            const unused = Array.from(markedAsExternal).filter((c) => !markedAsUsed.has(c));
            return unused.filter((coordinate) => {
                const [typeName, fieldName] = coordinate.split(".");
                const typeDef = stateBuilder.state.types.get(typeName);
                if (!typeDef) {
                    return true;
                }
                if (typeDef.kind === TypeKind.OBJECT &&
                    !stateBuilder.isInterfaceObject(typeName)) {
                    const fieldDef = typeDef.fields.get(fieldName);
                    if (fieldDef) {
                        const outputTypeName = stripTypeModifiers(fieldDef.type);
                        const outputType = stateBuilder.state.types.get(outputTypeName);
                        if (outputType?.kind === TypeKind.OBJECT && outputType.shareable) {
                            return false;
                        }
                    }
                    for (const interfaceName of typeDef.interfaces) {
                        const iDef = stateBuilder.state.types.get(interfaceName);
                        if (!iDef) {
                            continue;
                        }
                        if (iDef.kind === TypeKind.INTERFACE &&
                            iDef.fields.has(fieldName)) {
                            if (iDef.fields.has(fieldName)) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            });
        },
        reportError(error) {
            reportedErrors.push(error);
        },
        collectReportedErrors() {
            const errors = reportedErrors;
            reportedErrors = [];
            return errors;
        },
    };
}
