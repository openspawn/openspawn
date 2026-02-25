import { schema } from '../schema.js';
export function defaults(schema) {
    var _a;
    let result = {};
    let props = (_a = schema.properties) !== null && _a !== void 0 ? _a : {};
    Object.keys(props).forEach((key) => {
        let val = props[key];
        if (typeof val === 'object' && undefined !== val.default) {
            if (Array.isArray(val.default)) {
                result[key] = [...val.default];
            }
            else if (typeof val.default === 'object') {
                result[key] = { ...val.default };
            }
            else {
                result[key] = val.default;
            }
        }
    });
    return result;
}
export function merge(style, options) {
    var _a;
    let result = {
        ...defaults(schema),
        ...defaults((_a = style.schema) !== null && _a !== void 0 ? _a : {}),
        ...options,
    };
    // Return a complete copy because the styles could partially customize the
    // options and thus modify nested objects and arrays.
    return JSON.parse(JSON.stringify(result));
}
