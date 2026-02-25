import { SupergraphState } from "../../../state.cjs";
export type Field = {
    kind: "field";
    typeName: string;
    fieldName: string;
    selectionSet: null | Array<SelectionNode>;
};
export type Fragment = {
    kind: "fragment";
    typeName: string;
    selectionSet: Array<SelectionNode>;
};
export type SelectionNode = Field | Fragment;
export declare class Selection {
    private typeName;
    private source;
    selectionSet: SelectionNode[];
    constructor(typeName: string, source: string, selectionSet: SelectionNode[]);
    contains(typeName: string, fieldName: string): boolean;
    equals(other: Selection): boolean;
    private _selectionSetEqual;
    private _contains;
    toString(): string;
}
export declare class SelectionResolver {
    private supergraphState;
    private cache;
    constructor(supergraphState: SupergraphState);
    resolve(typeName: string, keyFields: string): Selection;
    private keyFactory;
    private resolveFieldNode;
    private resolveInlineFragmentNode;
    private resolveSelectionSetNode;
    private sort;
}
//# sourceMappingURL=selection.d.ts.map