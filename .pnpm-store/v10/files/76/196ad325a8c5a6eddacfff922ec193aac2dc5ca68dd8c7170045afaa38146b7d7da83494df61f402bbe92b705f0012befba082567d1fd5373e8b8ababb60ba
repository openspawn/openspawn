import { specifiedScalarTypes } from "graphql";
import { stripTypeModifiers } from "../../../../utils/state.js";
import { MERGEDGRAPH_ID, SUPERGRAPH_ID } from "./constants.js";
import { assertAbstractEdge, assertFieldEdge, Edge, isAbstractEdge, isEntityEdge, isFieldEdge, } from "./edge.js";
import { scoreKeyFields } from "./helpers.js";
import { AbstractMove, EntityMove, FieldMove } from "./moves.js";
import { Node } from "./node.js";
export class Graph {
    name;
    supergraphState;
    selectionResolver;
    ignoreInaccessible;
    _warnedAboutIncorrectEdge = false;
    nodesByTypeIndex = [];
    edgesByHeadTypeIndex = [];
    edgesByTailTypeIndex = [];
    typeNameToNodeIndexes = new Map();
    typeChildren = [];
    typeChildrenCache = new Map();
    isSubgraph;
    logger;
    id;
    idSymbol;
    fieldEdgesWithProgressiveOverride = [];
    fieldEdgesWithOverride = [];
    superFieldEdgesToApplyOverride = [];
    constructor(logger, id, name, supergraphState, selectionResolver, ignoreInaccessible = false) {
        this.name = name;
        this.supergraphState = supergraphState;
        this.selectionResolver = selectionResolver;
        this.ignoreInaccessible = ignoreInaccessible;
        this.logger = logger.create("Graph");
        if (typeof id === "string") {
            this.idSymbol = Symbol.for(id);
            this.id = id;
            this.isSubgraph = true;
        }
        else {
            this.idSymbol = id;
            this.id = id.toString();
            this.isSubgraph = this.idSymbol !== SUPERGRAPH_ID;
        }
    }
    addUnreachableTypes() {
        if (!this.isSupergraph()) {
            for (const [typeName, state] of this.supergraphState.objectTypes) {
                if (state.byGraph.has(this.id)) {
                    this.createNodesAndEdgesForType(typeName);
                }
            }
            for (const [typeName, state] of this.supergraphState.scalarTypes) {
                if (state.byGraph.has(this.id)) {
                    this.createNodeForScalarType(typeName);
                }
            }
            for (const [_, state] of this.supergraphState.enumTypes) {
                if (state.byGraph.has(this.id)) {
                    this.createNodeForEnumType(state);
                }
            }
            for (const [_, state] of this.supergraphState.unionTypes) {
                if (state.byGraph.has(this.id)) {
                    this.createNodeForUnionType(state);
                }
            }
            for (const [_, state] of this.supergraphState.interfaceTypes) {
                if (state.byGraph.has(this.id)) {
                    this.createNodeForInterfaceType(state);
                }
            }
        }
        return this;
    }
    addFromRoots() {
        for (const typeName of ["Query", "Mutation", "Subscription"]) {
            const typeState = this.supergraphState.objectTypes.get(typeName);
            if (typeState &&
                this.trueOrIfSubgraphThen(() => typeState.byGraph.has(this.id))) {
                this.createNodesAndEdgesForType(typeState.name);
            }
        }
        return this;
    }
    addInterfaceObjectFields() {
        if (this.isSubgraph) {
            throw new Error("Expected to be called only on supergraph");
        }
        for (const interfaceState of this.supergraphState.interfaceTypes.values()) {
            if (!interfaceState.hasInterfaceObject) {
                continue;
            }
            for (const implementedBy of interfaceState.implementedBy) {
                const objectState = this.supergraphState.objectTypes.get(implementedBy);
                if (!objectState) {
                    throw new Error(`Expected object type ${implementedBy} to be defined as it implements ${interfaceState.name}`);
                }
                const head = this.nodeOf(objectState.name, false);
                if (!head) {
                    continue;
                }
                for (const [interfaceFieldName, interfaceField,] of interfaceState.fields) {
                    if (objectState.fields.has(interfaceFieldName)) {
                        continue;
                    }
                    this.createEdgeForInterfaceTypeField(head, interfaceField);
                }
            }
            for (const [typeName, state] of this.supergraphState.objectTypes) {
                if (state.byGraph.has(this.id)) {
                    this.createNodesAndEdgesForType(typeName);
                }
            }
        }
    }
    addFromEntities() {
        for (const typeState of this.supergraphState.objectTypes.values()) {
            if (typeState?.isEntity &&
                this.trueOrIfSubgraphThen(() => typeState.byGraph.has(this.id))) {
                this.createNodesAndEdgesForType(typeState.name);
            }
        }
        return this;
    }
    addSubgraph(graph) {
        for (const node of graph.nodesByTypeIndex.flat()) {
            this.addNode(node.withoutState());
        }
        for (const edges of graph.edgesByHeadTypeIndex) {
            for (const edge of edges) {
                this.addEdge(edge);
            }
        }
    }
    connectUnionOrInterface(nodeIndex, sameTypeNameNodeIndexes, edgesToAdd) {
        for (const headNode of this.nodesByTypeIndex[nodeIndex]) {
            const edges = this.edgesOfTail(headNode);
            if (edges.length === 0) {
                continue;
            }
            for (const otherNodeIndex of sameTypeNameNodeIndexes) {
                if (nodeIndex === otherNodeIndex) {
                    continue;
                }
                for (const tailNode of this.nodesByTypeIndex[otherNodeIndex]) {
                    if (headNode === tailNode) {
                        continue;
                    }
                    for (const edge of edges) {
                        edgesToAdd.push(new Edge(edge.head, edge.move, tailNode));
                    }
                }
            }
        }
    }
    connectEntities(nodeIndex, sameTypeNameNodeIndexes, edgesToAdd) {
        for (const headNode of this.nodesByTypeIndex[nodeIndex]) {
            for (const otherNodeIndex of sameTypeNameNodeIndexes) {
                if (nodeIndex === otherNodeIndex) {
                    continue;
                }
                for (const tailNode of this.nodesByTypeIndex[otherNodeIndex]) {
                    if (!(tailNode.typeState &&
                        "isEntity" in tailNode.typeState &&
                        tailNode.typeState.isEntity)) {
                        continue;
                    }
                    const typeStateInGraph = tailNode.typeState.byGraph.get(tailNode.graphId);
                    const keys = (typeStateInGraph?.keys ?? [])
                        .slice()
                        .sort((a, b) => scoreKeyFields(a.fields) - scoreKeyFields(b.fields));
                    for (const key of keys) {
                        if (key.resolvable) {
                            edgesToAdd.push(new Edge(headNode, tailNode.typeState.kind === "object"
                                ? new EntityMove(this.selectionResolver.resolve(headNode.typeName, key.fields))
                                : new AbstractMove(this.selectionResolver.resolve(headNode.typeName, key.fields)), tailNode));
                        }
                    }
                }
            }
        }
    }
    addProvidedInterfaceFields(head, providedFields, queue) {
        const abstractIndexes = head.getAbstractEdgeIndexes(head.typeName);
        if (!abstractIndexes || abstractIndexes.length === 0) {
            throw new Error("Expected abstract indexes to be defined");
        }
        const interfaceFields = [];
        const fieldsByType = new Map();
        for (const providedField of providedFields) {
            if (providedField.typeName === head.typeName) {
                interfaceFields.push(providedField);
                continue;
            }
            const existing = fieldsByType.get(providedField.typeName);
            if (existing) {
                existing.push(providedField);
            }
            else {
                fieldsByType.set(providedField.typeName, [providedField]);
            }
        }
        for (const [typeName, providedFields] of fieldsByType) {
            let edgeIndex;
            let edge;
            for (let i = 0; i < abstractIndexes.length; i++) {
                const index = abstractIndexes[i];
                const potentialEdge = this.edgesByHeadTypeIndex[head.index][index];
                if (!potentialEdge) {
                    throw new Error("Expected edge to be defined");
                }
                if (potentialEdge.tail.typeName === typeName) {
                    edgeIndex = index;
                    edge = potentialEdge;
                    break;
                }
            }
            if (typeof edgeIndex === "undefined" || !edge) {
                throw new Error(`Expected an abstract edge matching "${typeName}" to be defined`);
            }
            const newTail = this.duplicateNode(edge.tail, edge.move);
            const newEdge = new Edge(edge.head, edge.move, newTail);
            this.replaceEdgeAt(edge.head.index, edge.tail.index, newEdge, edgeIndex);
            queue.push({
                head: newTail,
                providedFields,
            });
        }
        if (!interfaceFields.length) {
            return;
        }
        for (const index of abstractIndexes) {
            const edge = this.edgesByHeadTypeIndex[head.index][index];
            if (!edge) {
                throw new Error("Expected edge to be defined");
            }
            assertAbstractEdge(edge);
            if (edge.isCrossGraphEdge()) {
                continue;
            }
            const newTail = this.duplicateNode(edge.tail, edge.move);
            const newEdge = new Edge(edge.head, new AbstractMove(), newTail);
            this.replaceEdgeAt(edge.head.index, edge.tail.index, newEdge, index);
            queue.push({
                head: newTail,
                providedFields: interfaceFields.map((f) => ({
                    ...f,
                    typeName: newTail.typeName,
                })),
            });
        }
    }
    addProvidedUnionFields(head, providedFields, queue) {
        const abstractIndexes = head.getAbstractEdgeIndexes(head.typeName);
        if (!abstractIndexes || abstractIndexes.length === 0) {
            throw new Error("Expected abstract indexes to be defined");
        }
        const fieldsByType = new Map();
        for (const providedField of providedFields) {
            if (providedField.kind !== "fragment") {
                throw new Error(`Selection on union must be fragment. Received "${providedField.kind}".`);
            }
            const existing = fieldsByType.get(providedField.typeName);
            if (existing) {
                existing.push(...providedField.selectionSet);
            }
            else {
                fieldsByType.set(providedField.typeName, [
                    ...providedField.selectionSet,
                ]);
            }
        }
        for (const [typeName, providedFields] of fieldsByType) {
            let edgeIndex;
            let edge;
            for (let i = 0; i < abstractIndexes.length; i++) {
                const index = abstractIndexes[i];
                const potentialEdge = this.edgesByHeadTypeIndex[head.index][index];
                if (potentialEdge.tail.typeName === typeName) {
                    edgeIndex = index;
                    edge = potentialEdge;
                    break;
                }
            }
            if (typeof edgeIndex === "undefined" || !edge) {
                throw new Error(`Expected an abstract edge matching "${typeName}" to be defined`);
            }
            const newTail = this.duplicateNode(edge.tail, edge.move);
            const newEdge = new Edge(edge.head, edge.move, newTail);
            this.replaceEdgeAt(edge.head.index, edge.tail.index, newEdge, edgeIndex);
            queue.push({
                head: newTail,
                providedFields,
            });
        }
    }
    addProvidedField(head, providedField, queue) {
        if (providedField.kind === "field" &&
            providedField.fieldName === "__typename") {
            return;
        }
        if (providedField.kind === "fragment") {
            queue.push({
                head,
                providedFields: providedField.selectionSet,
            });
            return;
        }
        const indexes = head.getFieldEdgeIndexes(providedField.fieldName);
        if (!indexes || indexes.length === 0) {
            if (head.typeState?.kind === "object") {
                throw new Error("Expected indexes to be defined: " +
                    providedField.typeName +
                    "." +
                    providedField.fieldName);
            }
            else {
                throw new Error(`Expected ${providedField.typeName}.${providedField.fieldName} to be point to an object type, other kinds are not supported (received: ${head.typeState?.kind})`);
            }
        }
        for (const index of indexes) {
            const edge = this.edgesByHeadTypeIndex[head.index][index];
            if (!edge) {
                throw new Error("Expected edge to be defined");
            }
            assertFieldEdge(edge);
            if (edge.isCrossGraphEdge()) {
                continue;
            }
            const newTail = this.duplicateNode(edge.tail, edge.move);
            const newEdge = new Edge(edge.head, new FieldMove(edge.move.typeName, edge.move.fieldName, edge.move.requires, edge.move.provides, null, true), newTail);
            this.replaceEdgeAt(edge.head.index, edge.tail.index, newEdge, index);
            if (providedField.selectionSet) {
                queue.push({
                    head: newTail,
                    providedFields: providedField.selectionSet,
                });
            }
        }
    }
    joinSubgraphs() {
        const edgesToAdd = [];
        for (let i = 0; i < this.nodesByTypeIndex.length; i++) {
            const typeNode = this.nodesByTypeIndex[i][0];
            if (!typeNode.typeState) {
                continue;
            }
            const otherNodesIndexes = this.getIndexesOfType(typeNode.typeName);
            if (!Array.isArray(otherNodesIndexes)) {
                continue;
            }
            if ((typeNode.typeState?.kind === "object" ||
                typeNode.typeState?.kind === "interface") &&
                typeNode.typeState?.isEntity) {
                this.connectEntities(i, otherNodesIndexes, edgesToAdd);
                for (const h of otherNodesIndexes) {
                    const head = this.nodesByTypeIndex[h][0];
                    for (const interfaceName of typeNode.typeState.interfaces) {
                        const interfaceNodes = this.nodesOf(interfaceName, false);
                        if (interfaceNodes.length === 0) {
                            continue;
                        }
                        const interfaceTypeNode = interfaceNodes[0];
                        if (!interfaceTypeNode.typeState ||
                            interfaceTypeNode.typeState?.kind !== "interface") {
                            continue;
                        }
                        if (!interfaceTypeNode.typeState.hasInterfaceObject) {
                            continue;
                        }
                        for (const interfaceNode of interfaceNodes) {
                            if (interfaceNode.typeState?.kind !== "interface") {
                                throw new Error(`Expected interfaceNode ${interfaceNode.toString()} to be an interface`);
                            }
                            const keys = interfaceNode.typeState.byGraph.get(interfaceNode.graphId)?.keys;
                            if (!keys || keys.length === 0) {
                                continue;
                            }
                            for (const key of keys) {
                                if (!key.resolvable) {
                                    continue;
                                }
                                edgesToAdd.push(new Edge(head, new AbstractMove(this.selectionResolver.resolve(interfaceName, key.fields)), interfaceNode));
                            }
                        }
                    }
                }
            }
            else if (typeNode.typeState.kind === "union" ||
                typeNode.typeState.kind === "interface") {
                this.connectUnionOrInterface(i, otherNodesIndexes, edgesToAdd);
            }
        }
        while (edgesToAdd.length > 0) {
            const edge = edgesToAdd.pop();
            if (!edge) {
                throw new Error("Expected edge to be defined");
            }
            this.addEdge(edge);
        }
        const headEdgesLength = this.edgesByHeadTypeIndex.length;
        for (let headIndex = 0; headIndex < headEdgesLength; headIndex++) {
            const edges = this.edgesByHeadTypeIndex[headIndex];
            const edgesLength = edges.length;
            for (let edgeIndex = 0; edgeIndex < edgesLength; edgeIndex++) {
                const edge = edges[edgeIndex];
                if (edge.isCrossGraphEdge()) {
                    continue;
                }
                if (!(isFieldEdge(edge) && edge.move.provides)) {
                    continue;
                }
                const newTail = this.duplicateNode(edge.tail, edge.move);
                const newEdge = new Edge(edge.head, edge.move, newTail);
                this.replaceEdgeAt(headIndex, edge.tail.index, newEdge, edgeIndex);
                const queue = [
                    {
                        head: newTail,
                        providedFields: edge.move.provides.selectionSet,
                    },
                ];
                while (queue.length > 0) {
                    const item = queue.pop();
                    if (!item) {
                        throw new Error("Expected item to be defined");
                    }
                    const { head, providedFields } = item;
                    if (head.typeState?.kind === "interface") {
                        this.addProvidedInterfaceFields(head, providedFields, queue);
                        continue;
                    }
                    if (head.typeState?.kind === "union") {
                        this.addProvidedUnionFields(head, providedFields, queue);
                        continue;
                    }
                    for (const providedField of providedFields) {
                        this.addProvidedField(head, providedField, queue);
                    }
                }
            }
        }
        return this;
    }
    addOverriddenFields() {
        if (this.isSupergraph()) {
            for (const superFieldEdge of this.superFieldEdgesToApplyOverride) {
                const typeName = superFieldEdge.move.typeName;
                const fieldName = superFieldEdge.move.fieldName;
                const objectTypeState = this.supergraphState.objectTypes.get(typeName);
                if (!objectTypeState) {
                    throw new Error("Expected to find object type state");
                }
                const fieldState = objectTypeState.fields.get(fieldName);
                if (!fieldState) {
                    throw new Error("Expected to find field state");
                }
                if (!fieldState.overrideLabel) {
                    throw new Error("Expected a label on a field");
                }
                for (const [_, fieldStateInGraph] of fieldState.byGraph) {
                    if (fieldStateInGraph.overrideLabel && fieldStateInGraph.override) {
                        const fromGraphId = this.graphNameToId(fieldStateInGraph.override);
                        if (!fromGraphId) {
                            continue;
                        }
                        superFieldEdge.move.override = {
                            label: fieldStateInGraph.overrideLabel,
                            value: true,
                            fromGraphId,
                        };
                        this.addEdge(new Edge(superFieldEdge.head, new FieldMove(typeName, fieldName, null, null, {
                            label: fieldStateInGraph.overrideLabel,
                            value: false,
                            fromGraphId: null,
                        }), superFieldEdge.tail));
                    }
                }
            }
            return this;
        }
        if (!this.isMergedGraph()) {
            throw new Error("Expected to be called only on merged graph");
        }
        for (const fieldWithOverride of this.fieldEdgesWithProgressiveOverride) {
            if (!fieldWithOverride.move.override) {
                throw new Error("Expected edge.move.override to be defined");
            }
            const fromGraphId = fieldWithOverride.move.override.fromGraphId;
            if (!fromGraphId) {
                throw new Error("Expected fromGraphId to be defined");
            }
            const nodes = this.nodesOf(fieldWithOverride.head.typeName, true);
            for (const node of nodes) {
                if (node.graphId !== fromGraphId) {
                    continue;
                }
                const fieldEdges = this.fieldEdgesOfHead(node, fieldWithOverride.move.fieldName);
                for (const fieldEdge of fieldEdges) {
                    if (fieldEdge.move.provided) {
                        continue;
                    }
                    fieldEdge.updateOverride({
                        label: fieldWithOverride.move.override.label ?? null,
                        value: !fieldWithOverride.move.override.value,
                        fromGraphId: null,
                    });
                }
            }
        }
        for (const fieldWithOverride of this.fieldEdgesWithOverride) {
            if (!fieldWithOverride.move.override) {
                throw new Error("Expected edge.move.override to be defined");
            }
            const fromGraphId = fieldWithOverride.move.override.fromGraphId;
            if (!fromGraphId) {
                throw new Error("Expected fromGraphId to be defined");
            }
            const nodes = this.nodesOf(fieldWithOverride.head.typeName, true);
            for (const node of nodes) {
                if (node.graphId !== fromGraphId) {
                    continue;
                }
                const fieldEdges = this.fieldEdgesOfHead(node, fieldWithOverride.move.fieldName);
                for (const fieldEdge of fieldEdges) {
                    if (fieldEdge.move.provided) {
                        continue;
                    }
                    this.ignoreEdge(fieldEdge);
                }
            }
        }
        return this;
    }
    duplicateNode(originalNode, move) {
        const newNode = this.createNode(originalNode.typeName, originalNode.typeState, originalNode.graphId, originalNode.graphName);
        for (const edge of this.edgesOfHead(originalNode)) {
            this.addEdge(new Edge(newNode, edge.move, edge.tail));
        }
        if (move instanceof FieldMove) {
            newNode.debugPostFix = " (for " + move.toString() + ")";
        }
        return newNode;
    }
    replaceEdgeAt(headIndex, tailIndex, newEdge, edgeIndex) {
        this.edgesByHeadTypeIndex[headIndex][edgeIndex] = newEdge;
        const newEdgesByTail = [];
        for (const edge of this.edgesByTailTypeIndex[tailIndex]) {
            if (edge !== newEdge) {
                newEdgesByTail.push(edge);
            }
        }
        newEdgesByTail.push(newEdge);
        this.edgesByTailTypeIndex[tailIndex] = newEdgesByTail;
    }
    print(asLink = false) {
        let str = "digraph G {";
        if (this.supergraphState.objectTypes.has("Query")) {
            str += "\n root -> Query";
        }
        if (this.supergraphState.objectTypes.has("Mutation")) {
            str += "\n root -> Mutation";
        }
        if (this.supergraphState.objectTypes.has("Subscription")) {
            str += "\n root -> Subscription";
        }
        for (const edge of this.edgesByHeadTypeIndex.flat()) {
            if (edge.isIgnored()) {
                continue;
            }
            if (edge.head.typeName === "Query") {
                str += `\n  "Query" -> "${edge.head}";`;
            }
            else if (edge.head.typeName === "Mutation") {
                str += `\n  "Mutation" -> "${edge.head}";`;
            }
            else if (edge.head.typeName === "Subscription") {
                str += `\n  "Subscription" -> "${edge.head}";`;
            }
            str += `\n  "${edge.head}" -> "${edge.tail}" [label="${edge.move}"];`;
        }
        str += "\n}";
        if (asLink) {
            return `https://dreampuf.github.io/GraphvizOnline/#${encodeURIComponent(str)}`;
        }
        return str;
    }
    graphNameToId(graphName) {
        for (const [id, { graph }] of this.supergraphState.subgraphs) {
            if (graph.name === graphName) {
                return id;
            }
        }
    }
    nodeOf(typeName, failIfMissing = true) {
        const indexes = this.getIndexesOfType(typeName);
        if (!Array.isArray(indexes)) {
            if (failIfMissing) {
                throw new Error(`Expected TypeNode(${typeName}) to be inserted first in graph ${this.id}`);
            }
            return undefined;
        }
        if (indexes.length > 1) {
            throw new Error(`Expected only one node for ${typeName} in graph ${this.id}`);
        }
        return this.nodesByTypeIndex[indexes[0]][0];
    }
    nodesOf(typeName, failIfMissing = true) {
        const indexes = this.getIndexesOfType(typeName);
        if (!Array.isArray(indexes)) {
            if (failIfMissing) {
                throw new Error(`Expected TypeNode(${typeName}) to be inserted first in graph ${this.id}`);
            }
            return [];
        }
        const nodes = [];
        for (const i of indexes) {
            for (const node of this.nodesByTypeIndex[i]) {
                nodes.push(node);
            }
        }
        return nodes;
    }
    getSameGraphEdgesOfIndex(head, indexes, kind) {
        const edges = [];
        if (!indexes) {
            return [];
        }
        for (const i of indexes) {
            const edge = this.edgesByHeadTypeIndex[head.index][i];
            if (!edge) {
                throw new Error(`Expected edge to be defined at index ${i}`);
            }
            if (edge.isIgnored()) {
                continue;
            }
            if (edge.head.graphName === head.graphName) {
                edges.push(edge);
                continue;
            }
            if (!this._warnedAboutIncorrectEdge) {
                console.error(`Expected edge to be in the same graph as head (${kind})` +
                    edge.toString());
                this._warnedAboutIncorrectEdge = true;
            }
        }
        return edges;
    }
    fieldEdgesOfHead(head, fieldName) {
        return this.getSameGraphEdgesOfIndex(head, head.getFieldEdgeIndexes(fieldName), "field");
    }
    abstractEdgesOfHead(head) {
        return this.getSameGraphEdgesOfIndex(head, head.getAbstractEdgeIndexes(head.typeName), "abstract");
    }
    filterEdges(edges) {
        return edges.filter((edge) => edge.isIgnored() === false);
    }
    entityEdgesOfHead(head) {
        return this.getSameGraphEdgesOfIndex(head, head.getEntityEdgeIndexes(head.typeName), "entity");
    }
    indirectEdgesOfHead(head) {
        return this.getSameGraphEdgesOfIndex(head, head.getCrossGraphEdgeIndexes(head.typeName), "cross-graph")
            .concat(this.getSameGraphEdgesOfIndex(head, head.getAbstractEdgeIndexes(head.typeName), "abstract"))
            .filter((edge, i, all) => all.indexOf(edge) === i);
    }
    edgesOfHead(head) {
        return (this.filterEdges(this.edgesByHeadTypeIndex[head.index]?.filter((e) => e.head === head)) ?? []);
    }
    edgesOfTail(tail) {
        return (this.filterEdges(this.edgesByTailTypeIndex[tail.index]?.filter((e) => e.tail === tail)) ?? []);
    }
    possibleTypesOf(typeName) {
        if (this.supergraphState.interfaceTypes.has(typeName)) {
            return Array.from(this.supergraphState.interfaceTypes.get(typeName).implementedBy);
        }
        if (this.supergraphState.unionTypes.has(typeName)) {
            return Array.from(this.supergraphState.unionTypes.get(typeName).members);
        }
        return [typeName];
    }
    canReachTypeFromType(fromTypeName, toTypeName) {
        if (fromTypeName === toTypeName) {
            return true;
        }
        const fromTypeIndexes = this.getIndexesOfType(fromTypeName);
        if (!fromTypeIndexes) {
            return false;
        }
        const visited = new Array(this.typeChildren.length).fill(false);
        const queue = [];
        for (const i of fromTypeIndexes) {
            visited[i] = true;
        }
        queue.push(fromTypeName);
        while (queue.length > 0) {
            const typeName = queue.shift();
            if (!typeName) {
                throw new Error("Unexpected end of queue");
            }
            const typeIndexes = this.getIndexesOfType(typeName);
            if (typeof typeIndexes === "undefined") {
                throw new Error(`Could not find an index of type: ${typeName}`);
            }
            this.typeChildrenCache.set(`${fromTypeName} -> ${typeName}`, true);
            if (typeName === toTypeName) {
                return true;
            }
            for (const typeIndex of typeIndexes) {
                const children = this.typeChildren[typeIndex];
                for (const childTypeName of children) {
                    const childTypeIndexes = this.getIndexesOfType(childTypeName);
                    if (typeof childTypeIndexes === "undefined") {
                        throw new Error(`Could not find an index of type: ${typeName}`);
                    }
                    for (const childTypeIndex of childTypeIndexes) {
                        if (!visited[childTypeIndex]) {
                            visited[childTypeIndex] = true;
                            this.typeChildrenCache.set(`${fromTypeName} -> ${childTypeName}`, true);
                            this.typeChildrenCache.set(`${typeName} -> ${childTypeName}`, true);
                            queue.push(childTypeName);
                        }
                    }
                }
            }
        }
        this.typeChildrenCache.set(`${fromTypeName} -> ${toTypeName}`, false);
        return false;
    }
    createNodesAndEdgesForType(typeName) {
        if (this.supergraphState.objectTypes.has(typeName)) {
            return this.createNodesAndEdgesForObjectType(this.supergraphState.objectTypes.get(typeName));
        }
        if (specifiedScalarTypes.some((t) => t.name === typeName) ||
            this.supergraphState.scalarTypes.has(typeName)) {
            return this.createNodeForScalarType(typeName);
        }
        if (this.supergraphState.enumTypes.has(typeName)) {
            return this.createNodeForEnumType(this.supergraphState.enumTypes.get(typeName));
        }
        if (this.supergraphState.unionTypes.has(typeName)) {
            return this.createNodeForUnionType(this.supergraphState.unionTypes.get(typeName));
        }
        if (this.supergraphState.interfaceTypes.has(typeName)) {
            return this.createNodeForInterfaceType(this.supergraphState.interfaceTypes.get(typeName));
        }
        throw new Error(`Not implemented path: createNodesAndEdgesForType(${typeName})`);
    }
    ensureNonOrSingleNode(typeName) {
        const indexes = this.typeNameToNodeIndexes.get(typeName);
        if (!Array.isArray(indexes)) {
            return;
        }
        if (indexes.length > 1) {
            throw new Error(`Expected only one node for ${typeName} in graph ${this.id}`);
        }
        return this.nodesByTypeIndex[indexes[0]][0];
    }
    createNodesAndEdgesForObjectType(typeState) {
        const existing = this.ensureNonOrSingleNode(typeState.name);
        if (existing) {
            return existing;
        }
        const head = this.createTypeNode(typeState.name, typeState);
        for (const field of typeState.fields.values()) {
            if (this.trueOrIfSubgraphThen(() => field.byGraph.has(this.id))) {
                this.createEdgeForObjectTypeField(head, field);
            }
        }
        return head;
    }
    createNodeForScalarType(typeName) {
        const existing = this.ensureNonOrSingleNode(typeName);
        if (existing) {
            return existing;
        }
        return this.createTypeNode(typeName, this.supergraphState.scalarTypes.get(typeName) ?? null);
    }
    createNodeForEnumType(typeState) {
        const existing = this.ensureNonOrSingleNode(typeState.name);
        if (existing) {
            return existing;
        }
        return this.createTypeNode(typeState.name, typeState);
    }
    createNodeForUnionType(typeState) {
        const existing = this.ensureNonOrSingleNode(typeState.name);
        if (existing) {
            return existing;
        }
        const head = this.createTypeNode(typeState.name, typeState);
        const members = this.isSupergraph()
            ? typeState.members
            : typeState.byGraph.get(this.id)?.members;
        if (members) {
            for (const memberTypeName of members) {
                const tail = this.createNodesAndEdgesForType(memberTypeName);
                this.addEdge(new Edge(head, new AbstractMove(), tail));
            }
        }
        return head;
    }
    createNodeForInterfaceType(typeState) {
        const existing = this.ensureNonOrSingleNode(typeState.name);
        if (existing) {
            return existing;
        }
        const head = this.createTypeNode(typeState.name, typeState);
        const implementedBy = this.isSupergraph()
            ? typeState.implementedBy
            : typeState.byGraph.get(this.id)?.implementedBy;
        if (implementedBy) {
            for (const memberTypeName of implementedBy) {
                const tail = this.createNodesAndEdgesForType(memberTypeName);
                this.addEdge(new Edge(head, new AbstractMove(), tail));
            }
        }
        if (typeState.hasInterfaceObject && this.isSubgraph) {
            for (const field of typeState.fields.values()) {
                if (field.byGraph.has(this.id)) {
                    this.createEdgeForInterfaceTypeField(head, field);
                }
            }
        }
        else if (this.isSubgraph) {
            for (const field of typeState.fields.values()) {
                if (field.isLeaf && field.byGraph.has(this.id)) {
                    this.createEdgeForInterfaceTypeField(head, field);
                }
            }
        }
        return head;
    }
    createEdgeForInterfaceTypeField(head, field) {
        if (this.ignoreInaccessible && field.inaccessible) {
            return;
        }
        const outputTypeName = stripTypeModifiers(field.type);
        const tail = this.createNodesAndEdgesForType(outputTypeName);
        if (!tail) {
            throw new Error(`Failed to create Node for ${outputTypeName} in subgraph ${this.id}`);
        }
        const requires = field.byGraph.get(head.graphId)?.requires;
        const provides = field.byGraph.get(head.graphId)?.provides;
        return this.addEdge(new Edge(head, new FieldMove(head.typeName, field.name, requires
            ? this.selectionResolver.resolve(head.typeName, requires)
            : null, provides
            ? this.selectionResolver.resolve(outputTypeName, provides)
            : null), tail));
    }
    createEdgeForObjectTypeField(head, field) {
        if (this.ignoreInaccessible && field.inaccessible) {
            return;
        }
        if (this.isSupergraph() && field.byGraph.size === 1) {
            const graphId = Array.from(field.byGraph.keys())[0];
            const isExternal = field.byGraph.get(graphId)?.external === true;
            const isFederationV1 = this.supergraphState.subgraphs.get(graphId)?.federation.version ===
                "v1.0";
            if (isExternal && isFederationV1) {
                return;
            }
        }
        const fieldType = field.byGraph.get(this.id)?.type ?? field.type;
        const outputTypeName = stripTypeModifiers(fieldType);
        const tail = this.createNodesAndEdgesForType(outputTypeName);
        if (!tail) {
            throw new Error(`Failed to create Node for ${outputTypeName} in subgraph ${this.id}`);
        }
        if (this.isSupergraph()) {
            const edge = new Edge(head, new FieldMove(head.typeName, field.name), tail);
            if (field.override && field.overrideLabel) {
                this.superFieldEdgesToApplyOverride.push(edge);
            }
            return this.addEdge(edge);
        }
        const fieldStateInGraph = field.byGraph.get(head.graphId);
        const requires = fieldStateInGraph?.requires;
        const provides = fieldStateInGraph?.provides;
        const override = fieldStateInGraph?.override;
        const overrideLabel = fieldStateInGraph?.overrideLabel;
        const overrideFromGraphId = override ? this.graphNameToId(override) : null;
        return this.addEdge(new Edge(head, new FieldMove(head.typeName, field.name, requires
            ? this.selectionResolver.resolve(head.typeName, requires)
            : null, provides
            ? this.selectionResolver.resolve(outputTypeName, provides)
            : null, overrideFromGraphId
            ? {
                label: overrideLabel ?? null,
                value: true,
                fromGraphId: overrideFromGraphId,
            }
            : null), tail));
    }
    createTypeNode(typeName, typeState) {
        if (this.typeNameToNodeIndexes.has(typeName)) {
            throw new Error(`Node for ${typeName} already exists in subgraph ${this.id}`);
        }
        return this.createNode(typeName, typeState, this.id, this.name);
    }
    createNode(typeName, typeState, graphId, graphName) {
        const index = this.nodesByTypeIndex.push([]) - 1;
        const node = new Node(index, typeName, typeState, graphId, graphName);
        this.nodesByTypeIndex[node.index].push(node);
        this.edgesByHeadTypeIndex.push([]);
        this.edgesByTailTypeIndex.push([]);
        this.typeChildren.push(new Set());
        const existing = this.typeNameToNodeIndexes.get(typeName);
        if (Array.isArray(existing)) {
            existing.push(index);
        }
        else {
            this.typeNameToNodeIndexes.set(typeName, [index]);
        }
        return node;
    }
    addNode(node) {
        const newIndex = this.nodesByTypeIndex.push([]) - 1;
        node.index = newIndex;
        this.nodesByTypeIndex[node.index].push(node);
        this.edgesByHeadTypeIndex.push([]);
        this.edgesByTailTypeIndex.push([]);
        this.typeChildren.push(new Set());
        const existing = this.typeNameToNodeIndexes.get(node.typeName);
        if (Array.isArray(existing)) {
            existing.push(newIndex);
        }
        else {
            this.typeNameToNodeIndexes.set(node.typeName, [newIndex]);
        }
        return node;
    }
    ignoreEdge(edge) {
        edge.setIgnored(true);
    }
    addEdge(edge) {
        const edgeIndex = this.edgesByHeadTypeIndex[edge.head.index].push(edge) - 1;
        this.edgesByTailTypeIndex[edge.tail.index].push(edge);
        this.typeChildren[edge.head.index].add(edge.tail.typeName);
        if (isFieldEdge(edge)) {
            if (edge.move.override) {
                if (edge.move.override.label) {
                    this.fieldEdgesWithProgressiveOverride.push(edge);
                }
                else {
                    this.fieldEdgesWithOverride.push(edge);
                }
            }
            edge.head.addFieldEdge(edge.move.fieldName, edgeIndex);
        }
        else if (isEntityEdge(edge)) {
            edge.head.addEntityEdge(edge.head.typeName, edgeIndex);
        }
        else if (isAbstractEdge(edge)) {
            edge.head.addAbstractEdge(edge.head.typeName, edgeIndex);
        }
        if (edge.isCrossGraphEdge()) {
            edge.head.addCrossGraphEdge(edge.head.typeName, edgeIndex);
        }
        return edge;
    }
    getIndexesOfType(typeName) {
        return this.typeNameToNodeIndexes.get(typeName);
    }
    trueOrIfSubgraphThen(conditionFn) {
        if (this.isSubgraph) {
            return conditionFn();
        }
        return true;
    }
    isSupergraph() {
        return this.isSubgraph === false;
    }
    isMergedGraph() {
        return this.idSymbol === MERGEDGRAPH_ID;
    }
}
