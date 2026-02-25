import { Kind } from "graphql";
import { parseFields } from "../../../../subgraph/helpers.js";
import { stripTypeModifiers } from "../../../../utils/state.js";
export class Selection {
    typeName;
    source;
    selectionSet;
    constructor(typeName, source, selectionSet) {
        this.typeName = typeName;
        this.source = source;
        this.selectionSet = selectionSet;
    }
    contains(typeName, fieldName) {
        return this._contains(typeName, fieldName, this.selectionSet);
    }
    equals(other) {
        if (this.typeName !== other.typeName) {
            return false;
        }
        if (this.source === other.source) {
            return true;
        }
        return this._selectionSetEqual(this.selectionSet, other.selectionSet);
    }
    _selectionSetEqual(selectionSet, otherSelectionSet) {
        if (selectionSet.length !== otherSelectionSet.length) {
            return false;
        }
        for (let i = 0; i < selectionSet.length; i++) {
            const selectionNode = selectionSet[i];
            const otherSelectionNode = otherSelectionSet[i];
            if (selectionNode.kind !== otherSelectionNode.kind) {
                return false;
            }
            if (selectionNode.typeName !== otherSelectionNode.typeName) {
                return false;
            }
            if (selectionNode.kind === "field" &&
                otherSelectionNode.kind === "field" &&
                selectionNode.fieldName !== otherSelectionNode.fieldName) {
                return false;
            }
            const areEqual = Array.isArray(selectionNode.selectionSet) &&
                Array.isArray(otherSelectionNode.selectionSet)
                ? this._selectionSetEqual(selectionNode.selectionSet, otherSelectionNode.selectionSet)
                : selectionNode.selectionSet === otherSelectionNode.selectionSet;
            if (!areEqual) {
                return false;
            }
        }
        return true;
    }
    _contains(typeName, fieldName, selectionSet) {
        return selectionSet.some((s) => (s.kind === "field" &&
            s.typeName === typeName &&
            s.fieldName === fieldName) ||
            (s.selectionSet
                ? this._contains(typeName, fieldName, s.selectionSet)
                : false));
    }
    toString() {
        return this.source.replace(/\s+/g, " ");
    }
}
export class SelectionResolver {
    supergraphState;
    cache = new Map();
    constructor(supergraphState) {
        this.supergraphState = supergraphState;
    }
    resolve(typeName, keyFields) {
        const key = this.keyFactory(typeName, keyFields);
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const typeState = this.supergraphState.objectTypes.get(typeName) ??
            this.supergraphState.interfaceTypes.get(typeName) ??
            this.supergraphState.unionTypes.get(typeName);
        if (!typeState) {
            throw new Error(`Expected an object/interface/union type when resolving keyFields of ${typeName}`);
        }
        const selectionSetNode = parseFields(keyFields);
        if (!selectionSetNode) {
            throw new Error(`Expected a selection set when resolving keyFields of ${typeName}`);
        }
        const fields = new Selection(typeName, keyFields, this.resolveSelectionSetNode(typeName, selectionSetNode));
        this.cache.set(key, fields);
        return fields;
    }
    keyFactory(typeName, keyFields) {
        return `${typeName}/${keyFields}`;
    }
    resolveFieldNode(typeName, fieldNode, selectionSet) {
        if (fieldNode.name.value === "__typename") {
            return;
        }
        const typeState = this.supergraphState.objectTypes.get(typeName) ??
            this.supergraphState.interfaceTypes.get(typeName);
        if (!typeState) {
            throw new Error(`Type "${typeName}" is not defined.`);
        }
        if (!typeState.fields.has(fieldNode.name.value)) {
            throw new Error(`Type "${typeName.toString()}" does not have field "${fieldNode.name.value}".`);
        }
        if (fieldNode.selectionSet) {
            const outputType = stripTypeModifiers(typeState.fields.get(fieldNode.name.value).type);
            selectionSet.push({
                kind: "field",
                fieldName: fieldNode.name.value,
                typeName,
                selectionSet: this.resolveSelectionSetNode(outputType, fieldNode.selectionSet),
            });
        }
        else {
            selectionSet.push({
                kind: "field",
                typeName,
                fieldName: fieldNode.name.value,
                selectionSet: null,
            });
        }
    }
    resolveInlineFragmentNode(fragmentNode, selectionSet) {
        if (!fragmentNode.typeCondition?.name.value) {
            throw new Error(`Inline fragment without type condition is not supported.`);
        }
        const typeName = fragmentNode.typeCondition.name.value;
        const typeState = this.supergraphState.objectTypes.get(typeName) ??
            this.supergraphState.interfaceTypes.get(typeName);
        if (!typeState) {
            throw new Error(`Type "${typeName}" is not defined.`);
        }
        selectionSet.push({
            kind: "fragment",
            typeName,
            selectionSet: this.resolveSelectionSetNode(typeName, fragmentNode.selectionSet),
        });
    }
    resolveSelectionSetNode(typeName, selectionSetNode, selectionSet = []) {
        for (const selection of selectionSetNode.selections) {
            if (selection.kind === Kind.FIELD) {
                this.resolveFieldNode(typeName, selection, selectionSet);
            }
            else if (selection.kind === Kind.INLINE_FRAGMENT) {
                this.resolveInlineFragmentNode(selection, selectionSet);
            }
            else {
                throw new Error(`Fragment spread is not supported.`);
            }
        }
        return this.sort(selectionSet);
    }
    sort(selectionSet) {
        return selectionSet.sort((a, b) => {
            if (a.kind === b.kind) {
                return a.kind === "field" && b.kind === "field"
                    ?
                        `${a.typeName}.${a.fieldName}`.localeCompare(`${b.typeName}.${b.fieldName}`)
                    :
                        a.typeName.localeCompare(b.typeName);
            }
            return a.kind === "field" ? -1 : 1;
        });
    }
}
