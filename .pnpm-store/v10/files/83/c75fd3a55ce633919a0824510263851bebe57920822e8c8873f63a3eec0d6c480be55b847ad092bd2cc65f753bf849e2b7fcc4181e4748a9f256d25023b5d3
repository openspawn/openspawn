import { lazy } from "./helpers.js";
export class Node {
    index;
    typeName;
    typeState;
    graphId;
    graphName;
    _toString = lazy(() => `${this.typeName}/${this.graphName}${this.debugPostFix}`);
    debugPostFix = "";
    isLeaf = false;
    childrenIndex = new Map();
    visitedGraphCombos = [];
    constructor(index, typeName, typeState, graphId, graphName) {
        this.index = index;
        this.typeName = typeName;
        this.typeState = typeState;
        this.graphId = graphId;
        this.graphName = graphName;
        if (this.typeState === undefined) {
            throw new Error(`Expected typeState to be defined for ${typeName} in subgraph ${graphName}`);
        }
        if (this.typeState === null ||
            this.typeState.kind === "scalar" ||
            this.typeState.kind === "enum") {
            this.isLeaf = true;
        }
    }
    withoutState() {
        this.childrenIndex = new Map();
        this.visitedGraphCombos = [];
        return this;
    }
    addFieldEdge(fieldName, edgeAt) {
        const id = `field__${fieldName}`;
        const indexes = this.childrenIndex.get(id);
        if (indexes) {
            if (!indexes.includes(edgeAt)) {
                indexes.push(edgeAt);
            }
        }
        else {
            this.childrenIndex.set(id, [edgeAt]);
        }
    }
    getFieldEdgeIndexes(fieldName) {
        return this.childrenIndex.get(`field__${fieldName}`);
    }
    addEntityEdge(typeName, edgeAt) {
        this.pushToChildrenIndex(`entity__${typeName}`, edgeAt);
    }
    getEntityEdgeIndexes(typeName) {
        return this.childrenIndex.get(`entity__${typeName}`);
    }
    addAbstractEdge(typeName, edgeAt) {
        this.pushToChildrenIndex(`abstract__${typeName}`, edgeAt);
    }
    getAbstractEdgeIndexes(typeName) {
        return this.childrenIndex.get(`abstract__${typeName}`);
    }
    addCrossGraphEdge(typeName, edgeAt) {
        this.pushToChildrenIndex(`cross-graph__${typeName}`, edgeAt);
    }
    getCrossGraphEdgeIndexes(typeName) {
        return this.childrenIndex.get(`cross-graph__${typeName}`);
    }
    pushToChildrenIndex(id, edgeAt) {
        const indexes = this.childrenIndex.get(id);
        if (indexes) {
            if (!indexes.includes(edgeAt)) {
                indexes.push(edgeAt);
            }
        }
        else {
            this.childrenIndex.set(id, [edgeAt]);
        }
    }
    isGraphComboVisited(graphNameProvidesCombos, labelValues) {
        return this.visitedGraphCombos.some((visitedGraphs) => visitedGraphs.every((g) => graphNameProvidesCombos.includes(g)));
    }
    setGraphComboAsVisited(graphNames) {
        this.visitedGraphCombos.push(graphNames);
    }
    toString() {
        return this._toString.get();
    }
}
