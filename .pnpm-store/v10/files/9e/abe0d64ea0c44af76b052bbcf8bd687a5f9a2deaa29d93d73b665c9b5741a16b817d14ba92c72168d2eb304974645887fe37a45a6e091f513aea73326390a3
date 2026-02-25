export declare function occurrences(str: string, subString: string): number;
export declare function scoreKeyFields(keyFields: string): number;
export type Lazy<T> = {
    get(): T;
    invalidate(): void;
};
export declare function lazy<T>(factory: () => T): {
    get(): T;
    invalidate(): void;
};
export declare class OverrideLabels {
    private state;
    constructor(state?: Record<string, boolean>);
    set(key: string, value: boolean): this;
    get(key: string): boolean;
    matches(other: OverrideLabels): boolean;
    clone(): OverrideLabels;
}
//# sourceMappingURL=helpers.d.ts.map