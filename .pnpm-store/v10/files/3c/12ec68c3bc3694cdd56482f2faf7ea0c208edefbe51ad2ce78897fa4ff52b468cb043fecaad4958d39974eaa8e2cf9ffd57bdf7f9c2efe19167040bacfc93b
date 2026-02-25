import type { Selection } from "./selection.cjs";
export interface Move {
    toString(): string;
}
type FieldMoveOverride = {
    label: string | null;
    fromGraphId: string | null;
    value: boolean;
} | null;
export declare class FieldMove implements Move {
    typeName: string;
    fieldName: string;
    requires: Selection | null;
    provides: Selection | null;
    private _override;
    provided: boolean;
    private _toString;
    constructor(typeName: string, fieldName: string, requires?: Selection | null, provides?: Selection | null, _override?: {
        label: string | null;
        fromGraphId: string | null;
        value: boolean;
    } | null, provided?: boolean);
    get override(): FieldMoveOverride;
    set override(override: FieldMoveOverride);
    toString(): string;
}
export declare class AbstractMove implements Move {
    keyFields?: Selection | undefined;
    private _toString;
    constructor(keyFields?: Selection | undefined);
    toString(): string;
}
export declare class EntityMove implements Move {
    keyFields: Selection;
    private _toString;
    constructor(keyFields: Selection);
    toString(): string;
}
export {};
//# sourceMappingURL=moves.d.ts.map