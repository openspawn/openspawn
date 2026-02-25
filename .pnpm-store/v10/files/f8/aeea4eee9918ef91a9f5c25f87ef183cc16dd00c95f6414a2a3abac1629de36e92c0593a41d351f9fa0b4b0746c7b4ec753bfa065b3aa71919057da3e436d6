import { lazy } from "./helpers.js";
import { AbstractMove, EntityMove, FieldMove } from "./moves.js";
export function isEntityEdge(edge) {
    return edge.move instanceof EntityMove;
}
export function assertEntityEdge(edge) {
    if (!isEntityEdge(edge)) {
        throw new Error(`Expected edge to be Edge<EntityMove>, but got ${edge}`);
    }
}
export function isAbstractEdge(edge) {
    return edge.move instanceof AbstractMove;
}
export function assertAbstractEdge(edge) {
    if (!isAbstractEdge(edge)) {
        throw new Error(`Expected edge to be Edge<AbstractMove>, but got ${edge}`);
    }
}
export function isFieldEdge(edge) {
    return edge.move instanceof FieldMove;
}
export function assertFieldEdge(edge) {
    if (!isFieldEdge(edge)) {
        throw new Error(`Expected edge to be Edge<FieldMove>, but got ${edge}`);
    }
}
export class Edge {
    head;
    move;
    tail;
    resolvable = [];
    ignored = false;
    _toString = lazy(() => `${this.head} -(${this.move})-> ${this.tail}`);
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
        if (!(this.move instanceof FieldMove)) {
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
