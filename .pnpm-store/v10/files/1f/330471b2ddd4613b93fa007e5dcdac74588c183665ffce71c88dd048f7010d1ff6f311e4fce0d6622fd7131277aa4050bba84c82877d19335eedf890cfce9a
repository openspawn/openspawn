"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverrideLabels = void 0;
exports.occurrences = occurrences;
exports.scoreKeyFields = scoreKeyFields;
exports.lazy = lazy;
function occurrences(str, subString) {
    if (subString.length <= 0) {
        return str.length + 1;
    }
    let n = 0, pos = 0, step = subString.length;
    while (true) {
        pos = str.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        }
        else
            break;
    }
    return n;
}
function scoreKeyFields(keyFields) {
    const fields = occurrences(keyFields, " ") + 1;
    const innerSelectionSets = occurrences(keyFields, "{") * 3;
    return fields + innerSelectionSets;
}
function lazy(factory) {
    let value;
    return {
        get() {
            if (value === undefined) {
                value = factory();
            }
            return value;
        },
        invalidate() {
            value = undefined;
        },
    };
}
class OverrideLabels {
    state;
    constructor(state) {
        this.state = state ?? {};
    }
    set(key, value) {
        this.state[key] = value;
        return this;
    }
    get(key) {
        return this.state[key];
    }
    matches(other) {
        for (const key in this.state) {
            if (this.state[key] !== other.state[key]) {
                return false;
            }
        }
        return true;
    }
    clone() {
        return new OverrideLabels({
            ...this.state,
        });
    }
}
exports.OverrideLabels = OverrideLabels;
