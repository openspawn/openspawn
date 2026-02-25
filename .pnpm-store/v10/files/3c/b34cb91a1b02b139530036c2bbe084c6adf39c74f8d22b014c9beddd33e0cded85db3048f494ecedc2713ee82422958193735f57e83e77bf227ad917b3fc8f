import { type Edge } from "./edge.js";
import type { Node } from "./node.js";
export type Step = FieldStep | AbstractStep;
export declare const emptyOverrideLabel = " ";
export type FieldStep = {
    fieldName: string;
    typeName: string;
};
export type AbstractStep = {
    typeName: string;
};
export declare class OperationPath {
    private _rootNode;
    private _toString;
    private previousNodes;
    private previousEdges;
    private previousSteps;
    constructor(_rootNode: Node);
    move(edge: Edge): OperationPath;
    clone(): OperationPath;
    depth(): number;
    edge(): Edge | undefined;
    steps(): Step[];
    tail(): Node | undefined;
    rootNode(): Node;
    isVisitedEdge(edge: Edge): boolean;
    toString(): string;
    private advance;
}
//# sourceMappingURL=operation-path.d.ts.map