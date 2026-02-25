/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/WTcivb1XPf5ODtyv7ZNnU9
 */
import { escape } from '@dicebear/core';
import { getComponents } from './utils/getComponents.js';
import { getColors } from './utils/getColors.js';
export const meta = {
    title: 'Pixel Art',
    creator: 'DiceBear',
    source: 'https://www.figma.com/community/file/1198754108850888330',
    homepage: 'https://www.dicebear.com',
    license: {
        name: 'CC0 1.0',
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    return {
        attributes: {
            viewBox: '0 0 16 16',
            fill: 'none',
            'shape-rendering': 'crispEdges',
        },
        body: `<path d="M4 2h8v1h1v3h1v2h-1v3h-1v1H9v1h4v1h1v2H2v-2h1v-1h4v-1H4v-1H3V8H2V6h1V3h1V2Z" fill="${escape.xml(`${colors.skin}`)}"/><path d="M4 2h8v1h1v3h1v2h-1v3h-1v1H4v-1H3V8H2V6h1V3h1V2Z" fill="#fff" fill-opacity=".1"/>${(_b = (_a = components.accessories) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}${(_d = (_c = components.clothing) === null || _c === void 0 ? void 0 : _c.value(components, colors)) !== null && _d !== void 0 ? _d : ''}${(_f = (_e = components.eyes) === null || _e === void 0 ? void 0 : _e.value(components, colors)) !== null && _f !== void 0 ? _f : ''}${(_h = (_g = components.glasses) === null || _g === void 0 ? void 0 : _g.value(components, colors)) !== null && _h !== void 0 ? _h : ''}${(_k = (_j = components.beard) === null || _j === void 0 ? void 0 : _j.value(components, colors)) !== null && _k !== void 0 ? _k : ''}${(_m = (_l = components.mouth) === null || _l === void 0 ? void 0 : _l.value(components, colors)) !== null && _m !== void 0 ? _m : ''}${(_p = (_o = components.hair) === null || _o === void 0 ? void 0 : _o.value(components, colors)) !== null && _p !== void 0 ? _p : ''}${(_r = (_q = components.hat) === null || _q === void 0 ? void 0 : _q.value(components, colors)) !== null && _r !== void 0 ? _r : ''}`,
        extra: () => ({
            ...Object.entries(components).reduce((acc, [key, value]) => {
                acc[key] = value === null || value === void 0 ? void 0 : value.name;
                return acc;
            }, {}),
            ...Object.entries(colors).reduce((acc, [key, value]) => {
                acc[`${key}Color`] = value;
                return acc;
            }, {}),
        }),
    };
};
export { schema } from './schema.js';
