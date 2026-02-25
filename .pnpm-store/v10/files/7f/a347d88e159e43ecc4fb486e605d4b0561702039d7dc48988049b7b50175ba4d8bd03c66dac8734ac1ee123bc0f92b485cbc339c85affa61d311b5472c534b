"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Edge = void 0;
exports.isEntityEdge = isEntityEdge;
exports.assertEntityEdge = assertEntityEdge;
exports.isAbstractEdge = isAbstractEdge;
exports.assertAbstractEdge = assertAbstractEdge;
exports.isFieldEdge = isFieldEdge;
exports.assertFieldEdge = assertFieldEdge;
const helpers_js_1 = require("./helpers.js");
const moves_js_1 = require("./moves.js");
function isEntityEdge(edge) {
    return edge.move instanceof moves_js_1.EntityMove;
}
function assertEntityEdge(edge) {
    if (!isEntityEdge(edge)) {
        throw new Error(`Expected edge to be Edge<EntityMove>, but got ${edge}`);
    }
}
function isAbstractEdge(edge) {
    return edge.move instanceof moves_js_1.AbstractMove;
}
function assertAbstractEdge(edge) {
    if (!isAbstractEdge(edge)) {
        throw new Error(`Expected edge to be Edge<AbstractMove>, but got ${edge}`);
    }
}
function isFieldEdge(edge) {
    return edge.move instanceof moves_js_1.FieldMove;
}
function assertFieldEdge(edge) {
    if (!isFieldEdge(edge)) {
        throw new Error(`Expected edge to be Edge<FieldMove>, but got ${edge}`);
    }
}
class Edge {
    head;
    move;
    tail;
    resolvable = [];
    ignored = false;
    _toString = (0, helpers_js_1.lazy)(() => `${this.head} -(${this.move})-> ${this.tail}`);
    constructor(head, move, tail) {
        this.head = head;
        this.move = move;
        this.tail = tail;
    }
    setIgnored(ignored) {
        this.ignored = ignored;
    }
    isIgnored() {
        return this.ignored;
    }
    isCrossGraphEdge() {
        return this.head.graphId !== this.tail.graphId;
    }
    toString() {
        return this._toString.get();
    }
    updateOverride(override) {
        if (!(this.move instanceof moves_js_1.FieldMove)) {
            throw new Error(`Expected move to be FieldMove, but got ${this.move}`);
        }
        this.move.override = override;
        this._toString.invalidate();
    }
    getResolvability(graphNames, labelValues) {
        return this.resolvable.find(([checkedGraphNames, checkedLabelValues]) => {
            return (checkedGraphNames.every((name) => {
                return graphNames.includes(name);
            }) && checkedLabelValues.matches(labelValues));
        })?.[2];
    }
    setResolvable(success, graphNames, labelValues, error) {
        const result = success
            ? { success, error: undefined }
            : { success, error: error };
        this.resolvable.push([graphNames, labelValues, result]);
        return result;
    }
}
exports.Edge = Edge;
