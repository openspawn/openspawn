import { Kind, } from "graphql";
function getEnterLeaveForKind(visitor, kind) {
    const kindVisitor = visitor[kind];
    if (typeof kindVisitor === "object") {
        return kindVisitor;
    }
    if (typeof kindVisitor === "function") {
        return { enter: kindVisitor, leave: undefined };
    }
    return { enter: visitor.enter, leave: visitor.leave };
}
function isNode(maybeNode) {
    const maybeKind = maybeNode?.kind;
    return typeof maybeKind === "string";
}
export class TypeNodeInfo {
    _type;
    _field;
    _arg;
    _value;
    constructor() {
        this._type = undefined;
        this._field = undefined;
        this._arg = undefined;
        this._value = undefined;
    }
    get [Symbol.toStringTag]() {
        return "TypeNodeInfo";
    }
    getTypeDef() {
        return this._type;
    }
    getFieldDef() {
        return this._field;
    }
    getArgumentDef() {
        return this._arg;
    }
    getValueDef() {
        return this._value;
    }
    enter(node) {
        switch (node.kind) {
            case Kind.OBJECT_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_EXTENSION:
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.INTERFACE_TYPE_EXTENSION:
            case Kind.UNION_TYPE_DEFINITION:
            case Kind.UNION_TYPE_EXTENSION:
            case Kind.ENUM_TYPE_DEFINITION:
            case Kind.ENUM_TYPE_EXTENSION:
            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
            case Kind.INPUT_OBJECT_TYPE_EXTENSION:
            case Kind.SCALAR_TYPE_DEFINITION:
            case Kind.SCALAR_TYPE_EXTENSION:
            case Kind.DIRECTIVE_DEFINITION:
                this._type = node;
                break;
            case Kind.ENUM_VALUE_DEFINITION:
                this._value = node;
                break;
            case Kind.FIELD_DEFINITION:
                this._field = node;
                break;
            case Kind.INPUT_VALUE_DEFINITION:
                if (this._field) {
                    this._arg = node;
                }
                else {
                    this._field = node;
                }
                break;
            default:
        }
    }
    leave(node) {
        switch (node.kind) {
            case Kind.OBJECT_TYPE_DEFINITION:
            case Kind.OBJECT_TYPE_EXTENSION:
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.INTERFACE_TYPE_EXTENSION:
            case Kind.UNION_TYPE_DEFINITION:
            case Kind.UNION_TYPE_EXTENSION:
            case Kind.ENUM_TYPE_DEFINITION:
            case Kind.ENUM_TYPE_EXTENSION:
            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
            case Kind.INPUT_OBJECT_TYPE_EXTENSION:
            case Kind.SCALAR_TYPE_DEFINITION:
            case Kind.SCALAR_TYPE_EXTENSION:
            case Kind.DIRECTIVE_DEFINITION:
                this._type = undefined;
                break;
            case Kind.FIELD_DEFINITION:
                this._field = undefined;
                break;
            case Kind.ENUM_VALUE_DEFINITION:
                this._value = undefined;
                break;
            case Kind.INPUT_VALUE_DEFINITION:
                if (this._arg) {
                    this._arg = undefined;
                }
                else {
                    this._field = undefined;
                }
                break;
            default:
        }
    }
}
export function visitWithTypeNodeInfo(typeInfo, visitor) {
    return {
        enter(node, key, parent, path, ancestors) {
            typeInfo.enter(node);
            const fn = getEnterLeaveForKind(visitor, node.kind).enter;
            if (fn) {
                const result = fn.call(visitor, node, key, parent, path, ancestors);
                if (result !== undefined) {
                    typeInfo.leave(node);
                    if (isNode(result)) {
                        typeInfo.enter(result);
                    }
                }
                return result;
            }
        },
        leave(node, key, parent, path, ancestors) {
            const fn = getEnterLeaveForKind(visitor, node.kind).leave;
            let result;
            if (fn) {
                result = fn.call(visitor, node, key, parent, path, ancestors);
            }
            typeInfo.leave(node);
            return result;
        },
    };
}
