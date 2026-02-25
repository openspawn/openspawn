import type { EnumTypeState } from "../../../composition/enum-type.js";
import type { InterfaceTypeState } from "../../../composition/interface-type.js";
import type { ObjectTypeState } from "../../../composition/object-type.js";
import type { ScalarTypeState } from "../../../composition/scalar-type.js";
import type { UnionTypeState } from "../../../composition/union-type.js";
import { OverrideLabels } from "./helpers.js";
export declare class Node {
    index: number;
    typeName: string;
    typeState: ObjectTypeState | InterfaceTypeState | EnumTypeState | ScalarTypeState | UnionTypeState | null;
    graphId: string;
    graphName: string;
    private _toString;
    debugPostFix: string;
    isLeaf: boolean;
    private childrenIndex;
    private visitedGraphCombos;
    constructor(index: number, typeName: string, typeState: ObjectTypeState | InterfaceTypeState | EnumTypeState | ScalarTypeState | UnionTypeState | null, graphId: string, graphName: string);
    withoutState(): this;
    addFieldEdge(fieldName: string, edgeAt: number): void;
    getFieldEdgeIndexes(fieldName: string): number[] | undefined;
    addEntityEdge(typeName: string, edgeAt: number): void;
    getEntityEdgeIndexes(typeName: string): number[] | undefined;
    addAbstractEdge(typeName: string, edgeAt: number): void;
    getAbstractEdgeIndexes(typeName: string): number[] | undefined;
    addCrossGraphEdge(typeName: string, edgeAt: number): void;
    getCrossGraphEdgeIndexes(typeName: string): number[] | undefined;
    private pushToChildrenIndex;
    isGraphComboVisited(graphNameProvidesCombos: string[], labelValues: OverrideLabels): boolean;
    setGraphComboAsVisited(graphNames: string[]): void;
    toString(): string;
}
//# sourceMappingURL=node.d.ts.map