"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compareItemEquality = compareItemEquality;
exports.defaultItemEquality = void 0;
exports.findItemIndex = findItemIndex;
exports.itemIncludes = itemIncludes;
exports.removeItem = removeItem;
const defaultItemEquality = (item, value) => Object.is(item, value);
exports.defaultItemEquality = defaultItemEquality;
function compareItemEquality(item, value, comparer) {
  if (item == null || value == null) {
    return Object.is(item, value);
  }
  return comparer(item, value);
}
function itemIncludes(collection, value, comparer) {
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
function findItemIndex(collection, value, comparer) {
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
function removeItem(collection, value, comparer) {
  return collection.filter(item => !compareItemEquality(item, value, comparer));
}