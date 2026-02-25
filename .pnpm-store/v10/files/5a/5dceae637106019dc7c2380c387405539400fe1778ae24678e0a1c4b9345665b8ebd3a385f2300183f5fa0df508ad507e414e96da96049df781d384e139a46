"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityMove = exports.AbstractMove = exports.FieldMove = void 0;
const helpers_js_1 = require("./helpers.js");
class FieldMove {
    typeName;
    fieldName;
    requires;
    provides;
    _override;
    provided;
    _toString = (0, helpers_js_1.lazy)(() => {
        let str = this.fieldName;
        if (this.requires) {
            str += ` @require(${this.requires})`;
        }
        if (this.provides) {
            str += ` @provides(${this.provides})`;
        }
        if (this.provided) {
            str += " @provided";
        }
        if (this.override) {
            str += ` @override(label: ${this.override.label}`;
            str += `, on: ${this.override.value})`;
        }
        return str;
    });
    constructor(typeName, fieldName, requires = null, provides = null, _override = null, provided = false) {
        this.typeName = typeName;
        this.fieldName = fieldName;
        this.requires = requires;
        this.provides = provides;
        this._override = _override;
        this.provided = provided;
    }
    get override() {
        return this._override;
    }
    set override(override) {
        this._override = override;
        this._toString.invalidate();
    }
    toString() {
        return this._toString.get();
    }
}
exports.FieldMove = FieldMove;
class AbstractMove {
    keyFields;
    _toString = (0, helpers_js_1.lazy)(() => this.keyFields ? `🔮 🔑 ${this.keyFields}` : `🔮`);
    constructor(keyFields) {
        this.keyFields = keyFields;
    }
    toString() {
        return this._toString.get();
    }
}
exports.AbstractMove = AbstractMove;
class EntityMove {
    keyFields;
    _toString = (0, helpers_js_1.lazy)(() => `🔑 ${this.keyFields}`);
    constructor(keyFields) {
        this.keyFields = keyFields;
    }
    toString() {
        return this._toString.get();
    }
}
exports.EntityMove = EntityMove;
