"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.andList = andList;
function andList(items, commaBeforeConjunction = true, wrapper) {
    return formatList("and", items, commaBeforeConjunction, wrapper);
}
function formatList(conjunction, items, commaBeforeConjunction = true, wrapper) {
    if (items.length === 0) {
        return "";
    }
    switch (items.length) {
        case 1:
            return withWrapper(items[0], wrapper);
        case 2:
            return (withWrapper(items[0], wrapper) +
                " " +
                conjunction +
                " " +
                withWrapper(items[1], wrapper));
    }
    const allButLast = items
        .slice(0, -1)
        .map((item) => withWrapper(item, wrapper));
    const lastItem = withWrapper(items.at(-1), wrapper);
    return (allButLast.join(", ") +
        (commaBeforeConjunction ? ", " : " ") +
        conjunction +
        " " +
        lastItem);
}
function withWrapper(text, wrapper) {
    if (!wrapper) {
        return text;
    }
    return wrapper + text + wrapper;
}
