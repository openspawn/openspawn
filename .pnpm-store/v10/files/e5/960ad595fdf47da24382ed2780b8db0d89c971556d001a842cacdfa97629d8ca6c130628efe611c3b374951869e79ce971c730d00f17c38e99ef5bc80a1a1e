export type ItemEqualityComparer<Item = any, Value = Item> = (item: Item, value: Value) => boolean;
export declare const defaultItemEquality: ItemEqualityComparer;
export declare function compareItemEquality<Item, Value>(item: Item, value: Value, comparer: ItemEqualityComparer<Item, Value>): boolean;
export declare function itemIncludes<Item, Value>(collection: readonly Item[] | undefined | null, value: Value, comparer: ItemEqualityComparer<Item, Value>): boolean;
export declare function findItemIndex<Item, Value>(collection: readonly Item[] | undefined | null, value: Value, comparer: ItemEqualityComparer<Item, Value>): number;
export declare function removeItem<Item, Value>(collection: readonly Item[], value: Value, comparer: ItemEqualityComparer<Item, Value>): Item[];