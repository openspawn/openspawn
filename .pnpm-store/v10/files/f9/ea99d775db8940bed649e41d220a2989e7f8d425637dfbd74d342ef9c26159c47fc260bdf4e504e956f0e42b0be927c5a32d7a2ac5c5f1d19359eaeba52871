"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRealExtension = isRealExtension;
exports.objectTypeBuilder = objectTypeBuilder;
const helpers_js_1 = require("../../utils/helpers.js");
const ast_js_1 = require("./ast.js");
const common_js_1 = require("./common.js");
const auth_js_1 = require("../../utils/auth.js");
function isRealExtension(meta, version) {
    const hasExtendsDirective = meta.extensionType === "@extends";
    if (meta.extension) {
        if (version === "v1.0" && !hasExtendsDirective) {
            return false;
        }
        if (hasExtendsDirective) {
            return true;
        }
        if (meta.hasDefinition) {
            return false;
        }
        return true;
    }
    return false;
}
function objectTypeBuilder() {
    return {
        visitSubgraphState(graph, state, typeName, type) {
            const objectTypeState = getOrCreateObjectType(state, typeName);
            type.tags.forEach((tag) => objectTypeState.tags.add(tag));
            if (type.inaccessible) {
                objectTypeState.inaccessible = true;
            }
            if (type.authenticated) {
                objectTypeState.authenticated = true;
            }
            if (type.policies) {
                objectTypeState.policies = (0, auth_js_1.mergeScopePolicies)(objectTypeState.policies, type.policies);
            }
            if (type.scopes) {
                objectTypeState.scopes = (0, auth_js_1.mergeScopePolicies)(objectTypeState.scopes, type.scopes);
            }
            if (type.cost !== null) {
                objectTypeState.cost = (0, helpers_js_1.mathMax)(type.cost, objectTypeState.cost);
            }
            const isDefinition = type.isDefinition &&
                (graph.version === "v1.0" ? type.extensionType !== "@extends" : true);
            if (type.description && !objectTypeState.description) {
                objectTypeState.description = type.description;
            }
            if (isDefinition) {
                objectTypeState.hasDefinition = true;
            }
            if (type.ast.directives) {
                type.ast.directives.forEach((directive) => {
                    objectTypeState.ast.directives.push(directive);
                });
            }
            type.interfaces.forEach((interfaceName) => objectTypeState.interfaces.add(interfaceName));
            if (type.keys.length) {
                objectTypeState.isEntity = true;
            }
            objectTypeState.byGraph.set(graph.id, {
                hasDefinition: isDefinition,
                extension: type.extension,
                extensionType: type.extensionType,
                external: type.external,
                keys: type.keys,
                inaccessible: type.inaccessible,
                shareable: type.shareable,
                interfaces: type.interfaces,
                version: graph.version,
                authenticated: type.authenticated,
                policies: type.policies.slice(),
                scopes: type.scopes.slice(),
            });
            const typeInGraph = objectTypeState.byGraph.get(graph.id);
            for (const field of type.fields.values()) {
                const fieldState = getOrCreateField(objectTypeState, field.name, field.type);
                field.tags.forEach((tag) => fieldState.tags.add(tag));
                const usedAsKey = type.fieldsUsedAsKeys.has(field.name);
                if (usedAsKey) {
                    fieldState.usedAsKey = true;
                }
                const isExternal = graph.version === "v1.0"
                    ? field.external && isRealExtension(typeInGraph, graph.version)
                    : field.external;
                const shouldForceType = !usedAsKey && !isExternal && !fieldState.internal.seenNonExternal;
                const shouldChangeType = shouldForceType ||
                    (!isExternal &&
                        fieldState.type.lastIndexOf("!") > field.type.lastIndexOf("!"));
                if (shouldChangeType) {
                    fieldState.type = field.type;
                }
                if (field.isLeaf) {
                    fieldState.isLeaf = true;
                }
                if (!fieldState.internal.seenNonExternal && !isExternal) {
                    fieldState.internal.seenNonExternal = true;
                }
                if (field.inaccessible) {
                    fieldState.inaccessible = true;
                }
                if (field.authenticated) {
                    fieldState.authenticated = true;
                }
                if (field.policies) {
                    fieldState.policies = (0, auth_js_1.mergeScopePolicies)(fieldState.policies, field.policies);
                }
                if (field.scopes) {
                    fieldState.scopes = (0, auth_js_1.mergeScopePolicies)(fieldState.scopes, field.scopes);
                }
                if (field.cost !== null) {
                    fieldState.cost = (0, helpers_js_1.mathMax)(field.cost, fieldState.cost);
                }
                if (field.listSize !== null) {
                    fieldState.listSize = {
                        printRequireOneSlicingArgument: false,
                        assumedSize: (0, helpers_js_1.mathMaxNullable)(fieldState.listSize?.assumedSize, field.listSize.assumedSize),
                        requireOneSlicingArgument: (fieldState.listSize?.requireOneSlicingArgument ?? true) &&
                            field.listSize.requireOneSlicingArgument,
                        slicingArguments: (0, helpers_js_1.nullableArrayUnion)(fieldState.listSize?.slicingArguments, field.listSize.slicingArguments),
                        sizedFields: (0, helpers_js_1.nullableArrayUnion)(fieldState.listSize?.sizedFields, field.listSize.sizedFields),
                    };
                }
                if (field.description && !fieldState.description) {
                    fieldState.description = field.description;
                }
                if (field.override) {
                    fieldState.override = field.override;
                }
                if (field.overrideLabel) {
                    fieldState.overrideLabel = field.overrideLabel;
                }
                if (field.deprecated && !fieldState.deprecated) {
                    fieldState.deprecated = field.deprecated;
                }
                field.ast.directives.forEach((directive) => {
                    fieldState.ast.directives.push(directive);
                });
                fieldState.byGraph.set(graph.id, {
                    type: field.type,
                    external: field.external,
                    inaccessible: field.inaccessible,
                    description: field.description ?? null,
                    override: field.override,
                    overrideLabel: field.overrideLabel,
                    provides: field.provides,
                    requires: field.requires,
                    provided: field.provided,
                    required: field.required,
                    shareable: field.shareable,
                    extension: field.extension,
                    authenticated: field.authenticated,
                    policies: field.policies,
                    scopes: field.scopes,
                    used: field.used,
                    usedAsKey,
                    version: graph.version,
                });
                for (const arg of field.args.values()) {
                    const argState = getOrCreateArg(fieldState, arg.name, arg.type, arg.kind);
                    arg.tags.forEach((tag) => argState.tags.add(tag));
                    if (arg.type.endsWith("!")) {
                        argState.type = arg.type;
                    }
                    if (arg.inaccessible) {
                        argState.inaccessible = true;
                    }
                    if (arg.description && !argState.description) {
                        argState.description = arg.description;
                    }
                    if (arg.deprecated && !argState.deprecated) {
                        argState.deprecated = arg.deprecated;
                    }
                    arg.ast.directives.forEach((directive) => {
                        argState.ast.directives.push(directive);
                    });
                    if (typeof arg.defaultValue !== "undefined") {
                        argState.defaultValue = arg.defaultValue;
                    }
                    if (arg.cost !== null) {
                        argState.cost = (0, helpers_js_1.mathMax)(arg.cost, argState.cost);
                    }
                    argState.kind = arg.kind;
                    argState.byGraph.set(graph.id, {
                        type: arg.type,
                        kind: arg.kind,
                        inaccessible: arg.inaccessible,
                        defaultValue: arg.defaultValue,
                        version: graph.version,
                    });
                }
            }
        },
        composeSupergraphState(objectType, _graphs, { supergraphState }) {
            for (const interfaceName of objectType.interfaces) {
                const interfaceState = supergraphState.interfaceTypes.get(interfaceName);
                if (!interfaceState) {
                    throw new Error(`Interface "${interfaceName}" not found in Supergraph state`);
                }
                for (const [interfaceFieldName, interfaceField,] of interfaceState.fields) {
                    if (!interfaceState.hasInterfaceObject) {
                        continue;
                    }
                    const fieldState = objectType.fields.get(interfaceFieldName);
                    if (fieldState) {
                        fieldState.scopes = (0, auth_js_1.mergeScopePolicies)(fieldState.scopes, interfaceField.scopes);
                        fieldState.policies = (0, auth_js_1.mergeScopePolicies)(fieldState.policies, interfaceField.policies);
                        if (interfaceField.authenticated) {
                            fieldState.authenticated = true;
                        }
                    }
                }
            }
        },
        composeSupergraphNode(objectType, graphs, { graphNameToId, supergraphState }) {
            const isQuery = objectType.name === "Query";
            const joinTypes = isQuery
                ?
                    Array.from(graphs.values()).map((graph) => ({
                        graph: graph.graph.id,
                    }))
                :
                    Array.from(objectType.byGraph.entries())
                        .map(([graphId, meta]) => {
                        if (meta.keys.length) {
                            return meta.keys.map((key) => ({
                                graph: graphId,
                                key: key.fields,
                                extension: isRealExtension(meta, graphs.get(graphId).federation.version),
                                resolvable: key.resolvable,
                            }));
                        }
                        return [
                            {
                                graph: graphId,
                            },
                        ];
                    })
                        .flat(1);
            const fieldNamesOfImplementedInterfaces = {};
            const resolvableFieldsFromInterfaceObjects = [];
            for (const interfaceName of objectType.interfaces) {
                const interfaceState = supergraphState.interfaceTypes.get(interfaceName);
                if (!interfaceState) {
                    throw new Error(`Interface "${interfaceName}" not found in Supergraph state`);
                }
                for (const [interfaceFieldName, interfaceField,] of interfaceState.fields) {
                    const found = fieldNamesOfImplementedInterfaces[interfaceFieldName];
                    if (found) {
                        for (const graphId of interfaceField.byGraph.keys()) {
                            found.add(graphId);
                        }
                    }
                    else {
                        fieldNamesOfImplementedInterfaces[interfaceFieldName] = new Set(Array.from(interfaceField.byGraph.keys()));
                    }
                    if (!interfaceState.hasInterfaceObject) {
                        continue;
                    }
                    if (!resolvableFieldsFromInterfaceObjects.some((f) => f.name === interfaceFieldName)) {
                        resolvableFieldsFromInterfaceObjects.push(interfaceField);
                    }
                }
            }
            if (objectType.isEntity) {
                for (const [_, field] of objectType.fields) {
                    if (!field.description) {
                        continue;
                    }
                    if (!field.override) {
                        continue;
                    }
                    for (const [_, fieldInGraph] of field.byGraph) {
                        if (fieldInGraph.override && !fieldInGraph.shareable) {
                            field.description = fieldInGraph.description ?? undefined;
                        }
                    }
                }
            }
            function shouldSetExternalOnJoinField(fieldStateInGraph, graphId, fieldState) {
                if (!fieldStateInGraph.external) {
                    return false;
                }
                if (fieldStateInGraph.provided) {
                    return true;
                }
                if (fieldState.usedAsKey &&
                    objectType.byGraph.get(graphId).extension === true) {
                    return false;
                }
                return true;
            }
            function createJoinFields(fieldInGraphs, field, { hasDifferentOutputType, }) {
                return fieldInGraphs
                    .map(([graphId, meta]) => {
                    const type = hasDifferentOutputType ? meta.type : undefined;
                    const override = meta.override ?? undefined;
                    const overrideLabel = meta.overrideLabel ?? undefined;
                    const usedOverridden = provideUsedOverriddenValue(field, meta, fieldNamesOfImplementedInterfaces, graphId, graphNameToId);
                    const external = shouldSetExternalOnJoinField(meta, graphId, field);
                    const provides = meta.provides ?? undefined;
                    const requires = meta.requires ?? undefined;
                    const definesSomething = !!type ||
                        !!override ||
                        !!provides ||
                        !!requires ||
                        !!usedOverridden;
                    const isRequiredOrProvided = meta.provided || meta.required;
                    if (external &&
                        objectType.byGraph.get(graphId).extension === true &&
                        !definesSomething &&
                        !isRequiredOrProvided) {
                        return null;
                    }
                    return {
                        graph: graphId,
                        type,
                        override,
                        overrideLabel,
                        usedOverridden,
                        external,
                        provides,
                        requires,
                    };
                })
                    .filter(helpers_js_1.isDefined);
            }
            return (0, ast_js_1.createObjectTypeNode)({
                name: objectType.name,
                ast: {
                    directives: (0, common_js_1.convertToConst)(objectType.ast.directives),
                },
                cost: objectType.cost !== null
                    ? {
                        cost: objectType.cost,
                        directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
                    }
                    : null,
                description: objectType.description,
                fields: Array.from(objectType.fields.values())
                    .map((field) => {
                    const fieldInGraphs = Array.from(field.byGraph.entries());
                    const hasDifferentOutputType = fieldInGraphs.some(([_, meta]) => meta.type !== field.type);
                    const isDefinedEverywhere = field.byGraph.size ===
                        (isQuery ? graphs.size : objectType.byGraph.size);
                    let joinFields = [];
                    const differencesBetweenGraphs = {
                        override: false,
                        overrideLabel: false,
                        type: false,
                        external: false,
                        provides: false,
                        requires: false,
                    };
                    for (const [graphId, meta] of fieldInGraphs) {
                        if (meta.external) {
                            differencesBetweenGraphs.external = field.usedAsKey
                                ? objectType.byGraph.get(graphId).extension !== true
                                : true;
                        }
                        if (meta.override !== null) {
                            differencesBetweenGraphs.override = true;
                        }
                        if (meta.overrideLabel !== null) {
                            differencesBetweenGraphs.overrideLabel = true;
                        }
                        if (meta.provides !== null) {
                            differencesBetweenGraphs.provides = true;
                        }
                        if (meta.requires !== null) {
                            differencesBetweenGraphs.requires = true;
                        }
                        if (meta.type !== field.type) {
                            differencesBetweenGraphs.type = true;
                        }
                    }
                    if (!isQuery && field.byGraph.size === 1) {
                        const graphId = field.byGraph.keys().next().value;
                        const fieldInGraph = field.byGraph.get(graphId);
                        if (fieldInGraph.external &&
                            !fieldInGraph.usedAsKey &&
                            !fieldInGraph.required &&
                            !fieldInGraph.provided &&
                            !provideUsedOverriddenValue(field, fieldInGraph, fieldNamesOfImplementedInterfaces, graphId, graphNameToId) &&
                            graphs.get(graphId).federation.version === "v1.0") {
                            return null;
                        }
                    }
                    if (isQuery) {
                        if (differencesBetweenGraphs.override && graphs.size > 1) {
                            const overrideLabels = {};
                            const overriddenGraphs = [];
                            for (const [toGraphId, meta] of fieldInGraphs) {
                                if (!meta.override) {
                                    continue;
                                }
                                const fromGraphId = graphNameToId(meta.override);
                                if (!fromGraphId) {
                                    continue;
                                }
                                overriddenGraphs.push(fromGraphId);
                                if (meta.overrideLabel) {
                                    overrideLabels[fromGraphId] = meta.overrideLabel;
                                    overrideLabels[toGraphId] = meta.overrideLabel;
                                }
                            }
                            const graphsToPrintJoinField = fieldInGraphs.filter(([graphId, meta]) => meta.override !== null ||
                                !!overrideLabels[graphId] ||
                                (meta.shareable && !overriddenGraphs.includes(graphId)));
                            joinFields = graphsToPrintJoinField.map(([graphId, meta]) => ({
                                graph: graphId,
                                override: meta.override ?? undefined,
                                overrideLabel: meta.overrideLabel ?? undefined,
                                usedOverridden: provideUsedOverriddenValue(field, meta, fieldNamesOfImplementedInterfaces, graphId, graphNameToId),
                                type: differencesBetweenGraphs.type ? meta.type : undefined,
                                external: meta.external ?? undefined,
                                provides: meta.provides ?? undefined,
                                requires: meta.requires ?? undefined,
                            }));
                        }
                        else {
                            joinFields =
                                graphs.size > 1 && !isDefinedEverywhere
                                    ? fieldInGraphs.map(([graphId, meta]) => ({
                                        graph: graphId,
                                        provides: differencesBetweenGraphs.provides
                                            ? (meta.provides ?? undefined)
                                            : undefined,
                                    }))
                                    : [];
                        }
                    }
                    else if (isDefinedEverywhere) {
                        const hasDifferencesBetweenGraphs = Object.values(differencesBetweenGraphs).some((value) => value === true);
                        if (differencesBetweenGraphs.override) {
                            const overrideLabels = {};
                            const overriddenGraphs = [];
                            for (const [toGraphId, meta] of fieldInGraphs) {
                                if (!meta.override) {
                                    continue;
                                }
                                const fromGraphId = graphNameToId(meta.override);
                                if (!fromGraphId) {
                                    continue;
                                }
                                overriddenGraphs.push(fromGraphId);
                                if (meta.overrideLabel) {
                                    overrideLabels[fromGraphId] = meta.overrideLabel;
                                    overrideLabels[toGraphId] = meta.overrideLabel;
                                }
                            }
                            const graphsToEmit = fieldInGraphs.filter(([graphId, f]) => {
                                const isExternal = f.external === true;
                                const isOverridden = overriddenGraphs.includes(graphId);
                                const needsToPrintOverrideLabel = typeof f.overrideLabel === "string" ||
                                    !!overrideLabels[graphId];
                                const needsToPrintUsedOverridden = provideUsedOverriddenValue(field, f, fieldNamesOfImplementedInterfaces, graphId, graphNameToId);
                                const isRequired = f.required === true;
                                return ((isExternal && isRequired) ||
                                    needsToPrintOverrideLabel ||
                                    needsToPrintUsedOverridden ||
                                    !isOverridden);
                            });
                            if (!(graphsToEmit.length === 1 &&
                                joinTypes.length === 1 &&
                                joinTypes[0].graph === graphsToEmit[0][0])) {
                                joinFields = graphsToEmit.map(([graphId, meta]) => ({
                                    graph: graphId,
                                    override: meta.override ?? undefined,
                                    overrideLabel: overrideLabels[graphId] ?? undefined,
                                    usedOverridden: provideUsedOverriddenValue(field, meta, fieldNamesOfImplementedInterfaces, graphId, graphNameToId),
                                    type: differencesBetweenGraphs.type ? meta.type : undefined,
                                    external: meta.external ?? undefined,
                                    provides: meta.provides ?? undefined,
                                    requires: meta.requires ?? undefined,
                                }));
                            }
                        }
                        else if (hasDifferencesBetweenGraphs) {
                            joinFields = createJoinFields(fieldInGraphs, field, {
                                hasDifferentOutputType,
                            });
                        }
                    }
                    else {
                        if (differencesBetweenGraphs.override) {
                            const overrideLabels = {};
                            const overriddenGraphs = [];
                            for (const [toGraphId, meta] of fieldInGraphs) {
                                if (!meta.override) {
                                    continue;
                                }
                                const fromGraphId = graphNameToId(meta.override);
                                if (!fromGraphId) {
                                    continue;
                                }
                                overriddenGraphs.push(fromGraphId);
                                if (meta.overrideLabel) {
                                    overrideLabels[fromGraphId] = meta.overrideLabel;
                                    overrideLabels[toGraphId] = meta.overrideLabel;
                                }
                            }
                            const graphsToPrintJoinField = fieldInGraphs.filter(([graphId, meta]) => {
                                const isExternal = meta.external === true;
                                const isOverridden = overriddenGraphs.includes(graphId);
                                const needsToPrintOverrideLabel = typeof meta.overrideLabel === "string" ||
                                    !!overrideLabels[graphId];
                                const needsToPrintUsedOverridden = provideUsedOverriddenValue(field, meta, fieldNamesOfImplementedInterfaces, graphId, graphNameToId);
                                const isRequired = meta.required === true;
                                return ((isExternal && isRequired) ||
                                    needsToPrintOverrideLabel ||
                                    needsToPrintUsedOverridden ||
                                    !isOverridden);
                            });
                            joinFields = graphsToPrintJoinField.map(([graphId, meta]) => ({
                                graph: graphId,
                                override: meta.override ?? undefined,
                                overrideLabel: overrideLabels[graphId] ?? undefined,
                                usedOverridden: provideUsedOverriddenValue(field, meta, fieldNamesOfImplementedInterfaces, graphId, graphNameToId),
                                type: differencesBetweenGraphs.type ? meta.type : undefined,
                                external: meta.external ?? undefined,
                                provides: meta.provides ?? undefined,
                                requires: meta.requires ?? undefined,
                            }));
                        }
                        else {
                            joinFields = createJoinFields(fieldInGraphs, field, {
                                hasDifferentOutputType,
                            });
                        }
                    }
                    return {
                        name: field.name,
                        type: field.type,
                        inaccessible: field.inaccessible,
                        authenticated: field.authenticated,
                        policies: field.policies,
                        scopes: field.scopes,
                        tags: Array.from(field.tags),
                        description: field.description,
                        deprecated: field.deprecated,
                        cost: field.cost !== null
                            ? {
                                cost: field.cost,
                                directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
                            }
                            : null,
                        listSize: field.listSize !== null
                            ? {
                                ...field.listSize,
                                directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.listSize, "Directive name of @listSize is not defined"),
                            }
                            : null,
                        ast: {
                            directives: (0, common_js_1.convertToConst)(field.ast.directives),
                        },
                        join: {
                            field: joinFields.length === 1 &&
                                joinTypes.length === 1 &&
                                !joinFields[0].external &&
                                !joinFields[0].override &&
                                !joinFields[0].overrideLabel &&
                                !joinFields[0].provides &&
                                !joinFields[0].requires &&
                                !joinFields[0].usedOverridden &&
                                !joinFields[0].type
                                ? []
                                : joinFields,
                        },
                        arguments: Array.from(field.args.values())
                            .filter((arg) => {
                            if (arg.byGraph.size !== field.byGraph.size) {
                                return false;
                            }
                            return true;
                        })
                            .map((arg) => {
                            return {
                                name: arg.name,
                                type: arg.type,
                                kind: arg.kind,
                                inaccessible: arg.inaccessible,
                                cost: arg.cost !== null
                                    ? {
                                        cost: arg.cost,
                                        directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
                                    }
                                    : null,
                                tags: Array.from(arg.tags),
                                defaultValue: arg.defaultValue,
                                description: arg.description,
                                deprecated: arg.deprecated,
                                ast: {
                                    directives: (0, common_js_1.convertToConst)(arg.ast.directives),
                                },
                            };
                        }),
                    };
                })
                    .filter(helpers_js_1.isDefined)
                    .concat(resolvableFieldsFromInterfaceObjects
                    .filter((f) => !objectType.fields.has(f.name))
                    .map((field) => {
                    let scopes = [];
                    let policies = [];
                    let authenticated = false;
                    for (const fieldInGraph of field.byGraph.values()) {
                        scopes = (0, auth_js_1.mergeScopePolicies)(scopes, fieldInGraph.scopes);
                        policies = (0, auth_js_1.mergeScopePolicies)(policies, fieldInGraph.policies);
                        if (fieldInGraph.authenticated) {
                            authenticated = true;
                        }
                    }
                    return {
                        name: field.name,
                        type: field.type,
                        inaccessible: field.inaccessible,
                        authenticated,
                        policies,
                        scopes,
                        cost: field.cost !== null
                            ? {
                                cost: field.cost,
                                directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
                            }
                            : null,
                        listSize: field.listSize !== null
                            ? {
                                ...field.listSize,
                                directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.listSize, "Directive name of @listSize is not defined"),
                            }
                            : null,
                        tags: Array.from(field.tags),
                        description: field.description,
                        deprecated: field.deprecated,
                        ast: {
                            directives: (0, common_js_1.convertToConst)(field.ast.directives),
                        },
                        join: {
                            field: [{}],
                        },
                        arguments: Array.from(field.args.values())
                            .filter((arg) => {
                            if (arg.byGraph.size !== field.byGraph.size) {
                                return false;
                            }
                            return true;
                        })
                            .map((arg) => {
                            return {
                                name: arg.name,
                                type: arg.type,
                                kind: arg.kind,
                                inaccessible: false,
                                cost: arg.cost !== null
                                    ? {
                                        cost: arg.cost,
                                        directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
                                    }
                                    : null,
                                tags: Array.from(arg.tags),
                                defaultValue: arg.defaultValue,
                                description: arg.description,
                                deprecated: arg.deprecated,
                                ast: {
                                    directives: (0, common_js_1.convertToConst)(arg.ast.directives),
                                },
                            };
                        }),
                    };
                })),
                interfaces: Array.from(objectType.interfaces),
                tags: Array.from(objectType.tags),
                inaccessible: objectType.inaccessible,
                authenticated: objectType.authenticated,
                policies: objectType.policies,
                scopes: objectType.scopes,
                join: {
                    type: joinTypes,
                    implements: objectType.interfaces.size > 0
                        ? Array.from(objectType.byGraph.entries())
                            .map(([graph, meta]) => {
                            if (meta.interfaces.size > 0) {
                                return Array.from(meta.interfaces).map((interfaceName) => ({
                                    graph: graph.toUpperCase(),
                                    interface: interfaceName,
                                }));
                            }
                            return [];
                        })
                            .flat(1)
                        : [],
                },
            });
        },
    };
}
function provideUsedOverriddenValue(field, fieldStateInGraph, fieldNamesOfImplementedInterfaces, graphId, graphNameToId) {
    const inGraphs = fieldNamesOfImplementedInterfaces[field.name];
    const hasMatchingInterfaceFieldInGraph = inGraphs && inGraphs.has(graphId);
    const isUsedAsNonExternalKey = fieldStateInGraph.usedAsKey && !fieldStateInGraph.external;
    const isOverridden = field.override && graphNameToId(field.override) === graphId;
    if (isOverridden &&
        (isUsedAsNonExternalKey || hasMatchingInterfaceFieldInGraph)) {
        return true;
    }
    return false;
}
function getOrCreateObjectType(state, typeName) {
    const existing = state.get(typeName);
    if (existing) {
        return existing;
    }
    const def = {
        kind: "object",
        name: typeName,
        tags: new Set(),
        hasDefinition: false,
        isEntity: false,
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        cost: null,
        interfaces: new Set(),
        byGraph: new Map(),
        fields: new Map(),
        ast: {
            directives: [],
        },
    };
    state.set(typeName, def);
    return def;
}
function getOrCreateField(objectTypeState, fieldName, fieldType) {
    const existing = objectTypeState.fields.get(fieldName);
    if (existing) {
        return existing;
    }
    const def = {
        name: fieldName,
        type: fieldType,
        isLeaf: false,
        tags: new Set(),
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        cost: null,
        listSize: null,
        usedAsKey: false,
        override: null,
        overrideLabel: null,
        byGraph: new Map(),
        args: new Map(),
        ast: {
            directives: [],
        },
        internal: {
            seenNonExternal: false,
        },
    };
    objectTypeState.fields.set(fieldName, def);
    return def;
}
function getOrCreateArg(fieldState, argName, argType, argKind) {
    const existing = fieldState.args.get(argName);
    if (existing) {
        return existing;
    }
    const def = {
        name: argName,
        type: argType,
        kind: argKind,
        tags: new Set(),
        inaccessible: false,
        cost: null,
        byGraph: new Map(),
        ast: {
            directives: [],
        },
    };
    fieldState.args.set(argName, def);
    return def;
}
