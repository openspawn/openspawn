import type { Lazy } from "./helpers.cjs";
type SatisfiabilityErrorKind = "KEY" | "REQUIRE" | "EXTERNAL" | "MISSING_FIELD" | "NO_KEY" | "NO_IMPLEMENTATION";
export declare class SatisfiabilityError extends Error {
    kind: SatisfiabilityErrorKind;
    sourceGraphName: string;
    typeName: string;
    fieldName: string | null;
    static forKey(sourceGraphName: string, targetGraphName: string, typeName: string, keyFields: string): SatisfiabilityError;
    static forRequire(sourceGraphName: string, typeName: string, fieldName: string): SatisfiabilityError;
    static forExternal(sourceGraphName: string, typeName: string, fieldName: string): SatisfiabilityError;
    static forMissingField(sourceGraphName: string, typeName: string, fieldName: string): SatisfiabilityError;
    static forNoKey(sourceGraphName: string, targetGraphName: string, typeName: string, fieldName: string): SatisfiabilityError;
    static forNoImplementation(sourceGraphName: string, typeName: string): SatisfiabilityError;
    private constructor();
    isMatchingField(typeName: string, fieldName: string): boolean;
    toString(): string;
}
export declare class LazyErrors<T> {
    private lazyError;
    add(lazyError: Lazy<T | T[]> | LazyErrors<T>): this;
    getLazyErrors(): Lazy<T | T[]>[];
    toArray(): T[];
    isEmpty(): boolean;
}
export {};
//# sourceMappingURL=errors.d.ts.map