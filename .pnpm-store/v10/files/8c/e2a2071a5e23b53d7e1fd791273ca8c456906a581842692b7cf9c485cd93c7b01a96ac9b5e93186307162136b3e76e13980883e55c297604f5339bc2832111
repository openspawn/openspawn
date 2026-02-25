"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupergraphStateBuilder = createSupergraphStateBuilder;
const graphql_1 = require("graphql");
const printer_js_1 = require("../graphql/printer.js");
const link_js_1 = require("../specifications/link.js");
const helpers_js_1 = require("../subgraph/helpers.js");
const state_js_1 = require("../subgraph/state.js");
const ast_js_1 = require("./composition/ast.js");
const directive_js_1 = require("./composition/directive.js");
const enum_type_js_1 = require("./composition/enum-type.js");
const input_object_type_js_1 = require("./composition/input-object-type.js");
const interface_type_js_1 = require("./composition/interface-type.js");
const object_type_js_1 = require("./composition/object-type.js");
const scalar_type_js_1 = require("./composition/scalar-type.js");
const union_type_js_1 = require("./composition/union-type.js");
function createSupergraphStateBuilder() {
    const state = {
        subgraphs: new Map(),
        scalarTypes: new Map(),
        objectTypes: new Map(),
        interfaceTypes: new Map(),
        unionTypes: new Map(),
        enumTypes: new Map(),
        inputObjectTypes: new Map(),
        directives: new Map(),
        links: [],
        specs: {
            tag: false,
            cost: {
                used: false,
                names: {
                    cost: null,
                    listSize: null,
                },
            },
            inaccessible: false,
            policy: false,
            requiresScopes: false,
            authenticated: false,
        },
    };
    const directive = (0, directive_js_1.directiveBuilder)();
    const scalarType = (0, scalar_type_js_1.scalarTypeBuilder)();
    const enumType = (0, enum_type_js_1.enumTypeBuilder)();
    const inputObjectType = (0, input_object_type_js_1.inputObjectTypeBuilder)();
    const interfaceType = (0, interface_type_js_1.interfaceTypeBuilder)();
    const objectType = (0, object_type_js_1.objectTypeBuilder)();
    const unionType = (0, union_type_js_1.unionTypeBuilder)();
    const subgraphStates = new Map();
    const graphNameToIdMap = {};
    const helpers = {
        graphNameToId(graphName) {
            return graphNameToIdMap[graphName] ?? null;
        },
        supergraphState: state,
    };
    return {
        addSubgraph(subgraph) {
            if (state.subgraphs.has(subgraph.graph.id)) {
                throw new Error(`Graph with ID "${subgraph.graph.id}" already exists`);
            }
            state.subgraphs.set(subgraph.graph.id, subgraph);
            graphNameToIdMap[subgraph.graph.name] = subgraph.graph.id;
        },
        getGraph(id) {
            return state.subgraphs.get(id);
        },
        composeSupergraphState() {
            if (directive.composeSupergraphState) {
                state.directives.forEach((s) => {
                    directive.composeSupergraphState(s, state.subgraphs, helpers);
                });
            }
            if (scalarType.composeSupergraphState) {
                state.scalarTypes.forEach((s) => {
                    scalarType.composeSupergraphState(s, state.subgraphs, helpers);
                });
            }
            if (enumType.composeSupergraphState) {
                state.enumTypes.forEach((s) => {
                    enumType.composeSupergraphState(s, state.subgraphs, helpers);
                });
            }
            if (inputObjectType.composeSupergraphState) {
                state.inputObjectTypes.forEach((s) => {
                    inputObjectType.composeSupergraphState(s, state.subgraphs, helpers);
                });
            }
            if (objectType.composeSupergraphState) {
                state.objectTypes.forEach((s) => {
                    objectType.composeSupergraphState(s, state.subgraphs, helpers);
                });
            }
            if (interfaceType.composeSupergraphState) {
                state.interfaceTypes.forEach((s) => {
                    interfaceType.composeSupergraphState(s, state.subgraphs, helpers);
                });
            }
            if (unionType.composeSupergraphState) {
                state.unionTypes.forEach((s) => {
                    unionType.composeSupergraphState(s, state.subgraphs, helpers);
                });
            }
        },
        visitSubgraphState(subgraphState) {
            subgraphStates.set(subgraphState.graph.id, subgraphState);
            for (const link of subgraphState.links) {
                state.links.push(linkWithGraph(link, subgraphState.graph.id));
            }
            if (subgraphState.specs.tag) {
                state.specs.tag = true;
            }
            if (subgraphState.specs.inaccessible) {
                state.specs.inaccessible = true;
            }
            if (subgraphState.specs.requiresScopes) {
                state.specs.requiresScopes = true;
            }
            if (subgraphState.specs.authenticated) {
                state.specs.authenticated = true;
            }
            if (subgraphState.specs.policy) {
                state.specs.policy = true;
            }
            if (subgraphState.specs.cost.used) {
                state.specs.cost.used = true;
                if (subgraphState.specs.cost.names.cost) {
                    state.specs.cost.names.cost = subgraphState.specs.cost.names.cost;
                }
                if (subgraphState.specs.cost.names.listSize) {
                    state.specs.cost.names.listSize =
                        subgraphState.specs.cost.names.listSize;
                }
            }
            const allFederationImports = new Set(subgraphState.federation.imports.map((i) => i.alias ?? i.name));
            for (const [typeName, type] of subgraphState.types) {
                if (allFederationImports.has(typeName)) {
                    continue;
                }
                switch (type.kind) {
                    case "OBJECT": {
                        objectType.visitSubgraphState(subgraphState.graph, state.objectTypes, typeName, type);
                        break;
                    }
                    case "INTERFACE": {
                        interfaceType.visitSubgraphState(subgraphState.graph, state.interfaceTypes, typeName, type);
                        break;
                    }
                    case "UNION": {
                        unionType.visitSubgraphState(subgraphState.graph, state.unionTypes, typeName, type);
                        break;
                    }
                    case "ENUM": {
                        enumType.visitSubgraphState(subgraphState.graph, state.enumTypes, typeName, type);
                        break;
                    }
                    case "INPUT_OBJECT": {
                        inputObjectType.visitSubgraphState(subgraphState.graph, state.inputObjectTypes, typeName, type);
                        break;
                    }
                    case "DIRECTIVE": {
                        directive.visitSubgraphState(subgraphState.graph, state.directives, typeName, type);
                        break;
                    }
                    case "SCALAR": {
                        scalarType.visitSubgraphState(subgraphState.graph, state.scalarTypes, typeName, type);
                        break;
                    }
                }
            }
        },
        getSupergraphState() {
            return state;
        },
        getSubgraphState(graphId) {
            return subgraphStates.get(graphId);
        },
        links() {
            return (0, link_js_1.mergeLinks)(state.links);
        },
        build() {
            const transformFields = createFieldsTransformer(state);
            for (const directiveState of state.directives.values()) {
                if (!directiveState.isExecutable || !directiveState.byGraph.size) {
                    continue;
                }
                const isAllDirectivesIdentical = Array.from(directiveState.args.values()).every((directiveArgState) => (0, directive_js_1.isArgumentTypeIdenticalInEverySubgraph)(directiveArgState, state.subgraphs.size));
                if (!isAllDirectivesIdentical) {
                    state.directives.delete(directiveState.name);
                    continue;
                }
                directiveState.locations.forEach((location) => {
                    if (!(0, state_js_1.isExecutableDirectiveLocation)(location)) {
                        if (directiveState.composed) {
                            return;
                        }
                        directiveState.locations.delete(location);
                        return;
                    }
                    for (const directiveStateInGraph of directiveState.byGraph.values()) {
                        if (directiveStateInGraph.locations.has(location)) {
                            continue;
                        }
                        directiveState.locations.delete(location);
                    }
                });
                if (directiveState.locations.size === 0) {
                    state.directives.delete(directiveState.name);
                }
            }
            const numberOfExpectedNodes = state.directives.size +
                state.scalarTypes.size +
                state.objectTypes.size +
                state.interfaceTypes.size +
                state.unionTypes.size +
                state.enumTypes.size +
                state.inputObjectTypes.size +
                1;
            const nodes = new Array(numberOfExpectedNodes);
            let i = 0;
            nodes[i++] = (0, ast_js_1.createJoinGraphEnumTypeNode)(Array.from(state.subgraphs.values()).map((subgraph) => ({
                name: subgraph.graph.name,
                enumValue: subgraph.graph.id,
                url: subgraph.graph.url ?? "",
            })));
            for (const directiveState of state.directives.values()) {
                nodes[i++] = directive.composeSupergraphNode(directiveState, state.subgraphs, helpers);
            }
            for (const scalarTypeState of state.scalarTypes.values()) {
                nodes[i++] = scalarType.composeSupergraphNode(scalarTypeState, state.subgraphs, helpers);
            }
            for (const objectTypeState of state.objectTypes.values()) {
                nodes[i++] = objectType.composeSupergraphNode(transformFields(objectTypeState), state.subgraphs, helpers);
            }
            for (const interfaceTypeState of state.interfaceTypes.values()) {
                nodes[i++] = interfaceType.composeSupergraphNode(interfaceTypeState, state.subgraphs, helpers);
            }
            for (const unionTypeState of state.unionTypes.values()) {
                nodes[i++] = unionType.composeSupergraphNode(unionTypeState, state.subgraphs, helpers);
            }
            for (const enumTypeState of state.enumTypes.values()) {
                nodes[i++] = enumType.composeSupergraphNode(enumTypeState, state.subgraphs, helpers);
            }
            for (const inputObjectTypeState of state.inputObjectTypes.values()) {
                nodes[i++] = inputObjectType.composeSupergraphNode(inputObjectTypeState, state.subgraphs, helpers);
            }
            return nodes;
        },
    };
}
function linkWithGraph(link, graph) {
    link.graph = graph;
    return link;
}
function visitSelectionSetNode(selectionSet, locations, currentPath) {
    for (const selection of selectionSet.selections) {
        if (selection.kind === graphql_1.Kind.FIELD) {
            if (selection.selectionSet) {
                visitSelectionSetNode(selection.selectionSet, locations, currentPath.concat(selection.name.value));
            }
            else {
                locations.add(currentPath.concat(selection.name.value).join("."));
            }
        }
    }
}
function createFieldsSet(selectionSet) {
    const locations = new Set();
    visitSelectionSetNode(selectionSet, locations, []);
    return locations;
}
function filterSelectionSetNode(selectionSet, removableFields, currentPath) {
    const fieldsToDelete = [];
    for (const selection of selectionSet.selections) {
        if (selection.kind === graphql_1.Kind.FIELD) {
            if (selection.selectionSet) {
                filterSelectionSetNode(selection.selectionSet, removableFields, currentPath + "." + selection.name.value);
                if (selectionSet.selections.length === 0) {
                    fieldsToDelete.push(selection.name.value);
                }
            }
            else {
                const lookingFor = currentPath === ""
                    ? selection.name.value
                    : currentPath + "." + selection.name.value;
                if (removableFields.has(lookingFor)) {
                    fieldsToDelete.push(selection.name.value);
                }
            }
        }
    }
    for (const fieldName of fieldsToDelete) {
        selectionSet.selections = selectionSet.selections.filter((selection) => selection.kind === graphql_1.Kind.FIELD && selection.name.value === fieldName
            ? false
            : true);
    }
}
function createFieldsTransformer(state) {
    function transformFields(removableFields, fields) {
        const parsedFields = (0, helpers_js_1.parseFields)(fields);
        if (!parsedFields) {
            return fields;
        }
        filterSelectionSetNode(parsedFields, removableFields, "");
        const printed = (0, graphql_1.stripIgnoredCharacters)((0, printer_js_1.print)(parsedFields));
        return printed.replace(/^\{/, "").replace(/\}$/, "");
    }
    function mergeKeyFieldsCollection(fieldsCollection) {
        const fieldsSets = [];
        for (const fields of fieldsCollection) {
            const parsedFields = (0, helpers_js_1.parseFields)(fields);
            if (!parsedFields) {
                continue;
            }
            fieldsSets.push(createFieldsSet(parsedFields));
        }
        let commonFields;
        for (const fieldsSet of fieldsSets) {
            if (!commonFields) {
                commonFields = fieldsSet;
                continue;
            }
            for (const field of commonFields) {
                if (!fieldsSet.has(field)) {
                    commonFields.delete(field);
                }
            }
        }
        return commonFields ?? new Set();
    }
    return function visitTypeState(typeState) {
        for (const [_, fieldState] of typeState.fields) {
            for (const [graphId, fieldStateInGraph] of fieldState.byGraph) {
                if (fieldStateInGraph.requires) {
                    const keyFields = mergeKeyFieldsCollection(typeState.byGraph.get(graphId).keys.map((key) => key.fields));
                    const newRequires = transformFields(keyFields, fieldStateInGraph.requires);
                    fieldStateInGraph.requires =
                        newRequires.trim().length === 0 ? null : newRequires;
                }
                if (fieldStateInGraph.provides) {
                    const referencedTypeName = fieldState.type.replace(/[!\[\]]+/g, "");
                    const referencedType = state.objectTypes.get(referencedTypeName) ??
                        state.interfaceTypes.get(referencedTypeName) ??
                        state.unionTypes.get(referencedTypeName);
                    if (!referencedType) {
                        throw new Error("Referenced type not found: " + referencedTypeName);
                    }
                    if (referencedType.kind === "union") {
                        continue;
                    }
                    const referencedTypeInGraph = referencedType.byGraph.get(graphId);
                    const keyFields = referencedTypeInGraph.extension === true
                        ?
                            mergeKeyFieldsCollection(referencedTypeInGraph.keys.map((key) => key.fields))
                        :
                            new Set();
                    fieldStateInGraph.provides = transformFields(keyFields, fieldStateInGraph.provides);
                }
            }
        }
        return typeState;
    };
}
