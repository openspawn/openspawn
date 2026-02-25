import { SatisfiabilityError } from "./errors.js";
import { OverrideLabels, type Lazy } from "./helpers.js";
import { AbstractMove, EntityMove, FieldMove, Move } from "./moves.js";
import { Node } from "./node.js";
type EdgeResolvabilityResult = {
    success: true;
    error: undefined;
} | {
    success: false;
    error: Lazy<SatisfiabilityError>;
};
export declare function isEntityEdge(edge: Edge): edge is Edge<EntityMove>;
export declare function assertEntityEdge(edge: Edge): asserts edge is Edge<EntityMove>;
export declare function isAbstractEdge(edge: Edge): edge is Edge<AbstractMove>;
export declare function assertAbstractEdge(edge: Edge): asserts edge is Edge<AbstractMove>;
export declare function isFieldEdge(edge: Edge): edge is Edge<FieldMove>;
export declare function assertFieldEdge(edge: Edge): asserts edge is Edge<FieldMove>;
export declare class Edge<T = Move> {
    head: Node;
    move: T;
    tail: Node;
    private resolvable;
    private ignored;
    private _toString;
    constructor(head: Node, move: T, tail: Node);
    setIgnored(ignored: boolean): void;
    isIgnored(): boolean;
    isCrossGraphEdge(): boolean;
    toString(): string;
    updateOverride(override: {
        label: string | null;
        fromGraphId: string | null;
        value: boolean;
    }): void;
    getResolvability(graphNames: string[], labelValues: OverrideLabels): EdgeResolvabilityResult | undefined;
    setResolvable(success: true, graphNames: string[], labelValues: OverrideLabels): EdgeResolvabilityResult;
    setResolvable(success: false, graphNames: string[], labelValues: OverrideLabels, error: Lazy<SatisfiabilityError>): EdgeResolvabilityResult;
}
export {};
//# sourceMappingURL=edge.d.ts.map