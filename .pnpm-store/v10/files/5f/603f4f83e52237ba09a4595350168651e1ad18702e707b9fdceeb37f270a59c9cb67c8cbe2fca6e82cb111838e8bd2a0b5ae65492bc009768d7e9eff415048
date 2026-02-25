"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interfaceTypeBuilder = interfaceTypeBuilder;
const helpers_js_1 = require("../../utils/helpers.js");
const ast_js_1 = require("./ast.js");
const common_js_1 = require("./common.js");
const auth_js_1 = require("../../utils/auth.js");
function interfaceTypeBuilder() {
    return {
        visitSubgraphState(graph, state, typeName, type) {
            const interfaceTypeState = getOrCreateInterfaceType(state, typeName);
            type.tags.forEach((tag) => interfaceTypeState.tags.add(tag));
            if (type.inaccessible) {
                interfaceTypeState.inaccessible = true;
            }
            if (type.isDefinition) {
                interfaceTypeState.hasDefinition = true;
            }
            if (type.isInterfaceObject) {
                interfaceTypeState.hasInterfaceObject = true;
            }
            if (type.description && !interfaceTypeState.description) {
                interfaceTypeState.description = type.description;
            }
            type.ast.directives.forEach((directive) => {
                interfaceTypeState.ast.directives.push(directive);
            });
            type.interfaces.forEach((interfaceName) => interfaceTypeState.interfaces.add(interfaceName));
            type.implementedBy.forEach((objectTypeName) => interfaceTypeState.implementedBy.add(objectTypeName));
            if (type.keys.length) {
                interfaceTypeState.isEntity = true;
            }
            interfaceTypeState.byGraph.set(graph.id, {
                extension: type.extension,
                keys: type.keys,
                interfaces: type.interfaces,
                implementedBy: type.implementedBy,
                isInterfaceObject: type.isInterfaceObject,
                version: graph.version,
            });
            for (const field of type.fields.values()) {
                const fieldState = getOrCreateInterfaceField(interfaceTypeState, field.name, field.type);
                field.tags.forEach((tag) => fieldState.tags.add(tag));
                if (!field.type.endsWith("!") && fieldState.type.endsWith("!")) {
                    fieldState.type = field.type;
                }
                if (field.isLeaf) {
                    fieldState.isLeaf = true;
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
                if (field.deprecated && !fieldState.deprecated) {
                    fieldState.deprecated = field.deprecated;
                }
                if (field.description && !fieldState.description) {
                    fieldState.description = field.description;
                }
                field.ast.directives.forEach((directive) => {
                    fieldState.ast.directives.push(directive);
                });
                const usedAsKey = type.fieldsUsedAsKeys.has(field.name);
                if (usedAsKey) {
                    fieldState.usedAsKey = true;
                }
                fieldState.byGraph.set(graph.id, {
                    type: field.type,
                    override: field.override,
                    overrideLabel: field.overrideLabel,
                    provides: field.provides,
                    requires: field.requires,
                    version: graph.version,
                    external: field.external,
                    shareable: field.shareable,
                    authenticated: field.authenticated,
                    policies: field.policies,
                    scopes: field.scopes,
                    usedAsKey,
                });
                for (const arg of field.args.values()) {
                    const argState = getOrCreateArg(fieldState, arg.name, arg.type, arg.kind);
                    arg.tags.forEach((tag) => argState.tags.add(tag));
                    if (arg.type.endsWith("!")) {
                        argState.type = arg.type;
                    }
                    if (arg.deprecated && !argState.deprecated) {
                        argState.deprecated = arg.deprecated;
                    }
                    if (arg.description && !argState.description) {
                        argState.description = arg.description;
                    }
                    if (typeof arg.defaultValue !== "undefined") {
                        argState.defaultValue = arg.defaultValue;
                    }
                    if (arg.cost !== null) {
                        argState.cost = (0, helpers_js_1.mathMax)(arg.cost, argState.cost);
                    }
                    arg.ast.directives.forEach((directive) => {
                        argState.ast.directives.push(directive);
                    });
                    argState.kind = arg.kind;
                    argState.byGraph.set(graph.id, {
                        type: arg.type,
                        kind: arg.kind,
                        defaultValue: arg.defaultValue,
                        version: graph.version,
                    });
                }
            }
        },
        composeSupergraphState(interfaceType, graphs, { supergraphState }) {
            const implementors = Array.from(interfaceType.implementedBy)
                .map((typeName) => supergraphState.objectTypes.get(typeName))
                .filter(helpers_js_1.isDefined);
            for (const implementor of implementors) {
                interfaceType.scopes = (0, auth_js_1.mergeScopePolicies)(interfaceType.scopes, implementor.scopes);
                interfaceType.policies = (0, auth_js_1.mergeScopePolicies)(interfaceType.policies, implementor.policies);
                if (implementor.authenticated) {
                    interfaceType.authenticated = true;
                }
            }
            for (const field of interfaceType.fields.values()) {
                for (const implementor of implementors) {
                    let implementorField = implementor.fields.get(field.name);
                    if (!implementorField) {
                        continue;
                    }
                    field.scopes = (0, auth_js_1.mergeScopePolicies)(field.scopes, implementorField.scopes);
                    field.policies = (0, auth_js_1.mergeScopePolicies)(field.policies, implementorField.policies);
                    if (implementorField.authenticated) {
                        field.authenticated = true;
                    }
                }
            }
        },
        composeSupergraphNode(interfaceType, graphs, { supergraphState }) {
            return (0, ast_js_1.createInterfaceTypeNode)({
                name: interfaceType.name,
                fields: Array.from(interfaceType.fields.values()).map((field) => {
                    let nonEmptyJoinField = false;
                    const joinFields = [];
                    if (field.byGraph.size !== interfaceType.byGraph.size) {
                        for (const [graphId, meta] of field.byGraph.entries()) {
                            if (meta.type !== field.type ||
                                meta.override ||
                                meta.provides ||
                                meta.requires ||
                                meta.external) {
                                nonEmptyJoinField = true;
                            }
                            joinFields.push({
                                graph: graphId,
                                type: meta.type === field.type ? undefined : meta.type,
                                override: meta.override ?? undefined,
                                provides: meta.provides ?? undefined,
                                requires: meta.requires ?? undefined,
                                external: meta.external,
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
                        deprecated: field.deprecated,
                        description: field.description,
                        ast: {
                            directives: (0, common_js_1.convertToConst)(field.ast.directives),
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
                                tags: Array.from(arg.tags),
                                cost: arg.cost !== null
                                    ? {
                                        cost: arg.cost,
                                        directiveName: (0, helpers_js_1.ensureValue)(supergraphState.specs.cost.names.cost, "Directive name of @cost is not defined"),
                                    }
                                    : null,
                                defaultValue: arg.defaultValue,
                                deprecated: arg.deprecated,
                                description: arg.description,
                                ast: {
                                    directives: (0, common_js_1.convertToConst)(arg.ast.directives),
                                },
                            };
                        }),
                        join: {
                            field: joinFields,
                        },
                    };
                }),
                tags: Array.from(interfaceType.tags),
                inaccessible: interfaceType.inaccessible,
                authenticated: interfaceType.authenticated,
                policies: interfaceType.policies,
                scopes: interfaceType.scopes,
                description: interfaceType.description,
                interfaces: Array.from(interfaceType.interfaces),
                ast: {
                    directives: (0, common_js_1.convertToConst)(interfaceType.ast.directives),
                },
                join: {
                    type: Array.from(interfaceType.byGraph)
                        .map(([graphId, meta]) => {
                        if (meta.keys.length &&
                            graphs.get(graphId).federation.version !== "v1.0") {
                            return meta.keys.map((key) => ({
                                graph: graphId,
                                key: key.fields,
                                extension: meta.extension,
                                isInterfaceObject: meta.isInterfaceObject,
                                resolvable: key.resolvable,
                            }));
                        }
                        return [
                            {
                                graph: graphId,
                            },
                        ];
                    })
                        .flat(1),
                    implements: interfaceType.interfaces.size > 0
                        ? Array.from(interfaceType.byGraph.entries())
                            .map(([graphId, meta]) => {
                            if (meta.interfaces.size) {
                                return Array.from(meta.interfaces).map((iface) => ({
                                    graph: graphId,
                                    interface: iface,
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
function getOrCreateInterfaceType(state, typeName) {
    const existing = state.get(typeName);
    if (existing) {
        return existing;
    }
    const def = {
        kind: "interface",
        name: typeName,
        tags: new Set(),
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        hasDefinition: false,
        hasInterfaceObject: false,
        isEntity: false,
        byGraph: new Map(),
        fields: new Map(),
        interfaces: new Set(),
        implementedBy: new Set(),
        ast: {
            directives: [],
        },
    };
    state.set(typeName, def);
    return def;
}
function getOrCreateInterfaceField(interfaceTypeState, fieldName, fieldType) {
    const existing = interfaceTypeState.fields.get(fieldName);
    if (existing) {
        return existing;
    }
    const def = {
        name: fieldName,
        type: fieldType,
        isLeaf: false,
        usedAsKey: false,
        tags: new Set(),
        inaccessible: false,
        authenticated: false,
        policies: [],
        scopes: [],
        cost: null,
        listSize: null,
        byGraph: new Map(),
        args: new Map(),
        ast: {
            directives: [],
        },
    };
    interfaceTypeState.fields.set(fieldName, def);
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
        cost: null,
        byGraph: new Map(),
        ast: {
            directives: [],
        },
    };
    fieldState.args.set(argName, def);
    return def;
}
