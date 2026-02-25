/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 */
import { getComponents } from './utils/getComponents.js';
import { getColors } from './utils/getColors.js';
export const meta = {
    title: 'ToonHead',
    creator: 'Johan Melin',
    source: 'https://www.figma.com/community/file/1589627891082866389',
    homepage: 'https://www.johanmelin.com',
    license: {
        name: 'CC BY 4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    return {
        attributes: {
            viewBox: '0 0 768 768',
            fill: 'none',
            'shape-rendering': 'auto'
        },
        body: `<g transform="translate(0 10)">${(_b = (_a = components.rearHair) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}</g>${(_d = (_c = components.body) === null || _c === void 0 ? void 0 : _c.value(components, colors)) !== null && _d !== void 0 ? _d : ''}${(_f = (_e = components.head) === null || _e === void 0 ? void 0 : _e.value(components, colors)) !== null && _f !== void 0 ? _f : ''}${(_h = (_g = components.clothes) === null || _g === void 0 ? void 0 : _g.value(components, colors)) !== null && _h !== void 0 ? _h : ''}${(_k = (_j = components.mouth) === null || _j === void 0 ? void 0 : _j.value(components, colors)) !== null && _k !== void 0 ? _k : ''}${(_m = (_l = components.beard) === null || _l === void 0 ? void 0 : _l.value(components, colors)) !== null && _m !== void 0 ? _m : ''}${(_p = (_o = components.eyes) === null || _o === void 0 ? void 0 : _o.value(components, colors)) !== null && _p !== void 0 ? _p : ''}${(_r = (_q = components.eyebrows) === null || _q === void 0 ? void 0 : _q.value(components, colors)) !== null && _r !== void 0 ? _r : ''}${(_t = (_s = components.hair) === null || _s === void 0 ? void 0 : _s.value(components, colors)) !== null && _t !== void 0 ? _t : ''}`,
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
