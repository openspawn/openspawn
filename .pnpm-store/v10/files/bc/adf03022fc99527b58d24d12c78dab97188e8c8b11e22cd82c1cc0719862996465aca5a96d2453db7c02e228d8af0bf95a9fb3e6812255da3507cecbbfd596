"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationPath = exports.emptyOverrideLabel = void 0;
const edge_js_1 = require("./edge.js");
const helpers_js_1 = require("./helpers.js");
exports.emptyOverrideLabel = " ";
class OperationPath {
    _rootNode;
    _toString = (0, helpers_js_1.lazy)(() => {
        let str = this._rootNode.toString();
        for (let i = 0; i < this.previousEdges.length; i++) {
            const edge = this.previousEdges[i];
            if (edge) {
                str += ` -(${edge.move})-> ${edge.tail}`;
            }
        }
        return str;
    });
    previousNodes = [];
    previousEdges = [];
    previousSteps = [];
    constructor(_rootNode) {
        this._rootNode = _rootNode;
    }
    move(edge) {
        this._toString.invalidate();
        this.advance(edge);
        return this;
    }
    clone() {
        const newPath = new OperationPath(this._rootNode);
        newPath.previousNodes = this.previousNodes.slice();
        newPath.previousEdges = this.previousEdges.slice();
        newPath.previousSteps = this.previousSteps.slice();
        return newPath;
    }
    depth() {
        return this.previousEdges.length;
    }
    edge() {
        return this.previousEdges[this.previousEdges.length - 1];
    }
    steps() {
        return this.previousSteps;
    }
    tail() {
        return this.edge()?.tail;
    }
    rootNode() {
        return this._rootNode;
    }
    isVisitedEdge(edge) {
        return this.previousEdges.includes(edge);
    }
    toString() {
        return this._toString.get();
    }
    advance(edge) {
        this.previousEdges.push(edge);
        this.previousNodes.push(edge.head);
        if ((0, edge_js_1.isFieldEdge)(edge)) {
            this.previousSteps.push({
                typeName: edge.move.typeName,
                fieldName: edge.move.fieldName,
            });
        }
        else {
            this.previousSteps.push({
                typeName: edge.tail.typeName,
            });
        }
    }
}
exports.OperationPath = OperationPath;
