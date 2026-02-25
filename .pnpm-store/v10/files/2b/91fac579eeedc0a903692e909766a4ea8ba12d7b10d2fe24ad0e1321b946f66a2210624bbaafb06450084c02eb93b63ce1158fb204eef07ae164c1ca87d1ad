export const defaultItemEquality = (item, value) => Object.is(item, value);
export function compareItemEquality(item, value, comparer) {
  if (item == null || value == null) {
    return Object.is(item, value);
  }
  return comparer(item, value);
}
export function itemIncludes(collection, value, comparer) {
  if (!collection || collection.length === 0) {
    return false;
  }
  return collection.some(item => {
    if (item === undefined) {
      return false;
    }
    return compareItemEquality(item, value, comparer);
  });
}
export function findItemIndex(collection, value, comparer) {
  if (!collection || collection.length === 0) {
    return -1;
  }
  return collection.findIndex(item => {
    if (item === undefined) {
      return false;
    }
    return compareItemEquality(item, value, comparer);
  });
}
export function removeItem(collection, value, comparer) {
  return collection.filter(item => !compareItemEquality(item, value, comparer));
}