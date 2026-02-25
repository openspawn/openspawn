/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/KhTfMFWWniVgZmGVFL0KK6
 */
import { getComponents } from './utils/getComponents.js';
import { getColors } from './utils/getColors.js';
export const meta = {
    title: 'Face Generator',
    creator: 'The Visual Team',
    source: 'https://www.figma.com/community/file/986078800058673824',
    homepage: 'https://thevisual.team/',
    license: {
        name: 'CC BY 4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    return {
        attributes: {
            viewBox: '0 0 440 440',
            fill: 'none',
            'shape-rendering': 'auto',
        },
        body: `<g transform="matrix(.71048 0 0 .71048 24 2)">${(_b = (_a = components.hair) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}</g><g transform="translate(81.7 150.7) scale(.71856)">${(_d = (_c = components.face) === null || _c === void 0 ? void 0 : _c.value(components, colors)) !== null && _d !== void 0 ? _d : ''}</g><g transform="translate(199.5 333.4) scale(.71856)">${(_f = (_e = components.mouth) === null || _e === void 0 ? void 0 : _e.value(components, colors)) !== null && _f !== void 0 ? _f : ''}</g><g transform="translate(280.7 235.4) scale(.71856)">${(_h = (_g = components.ear) === null || _g === void 0 ? void 0 : _g.value(components, colors)) !== null && _h !== void 0 ? _h : ''}</g><g transform="matrix(-.71856 0 0 .71856 161.5 235.4)">${(_k = (_j = components.ear) === null || _j === void 0 ? void 0 : _j.value(components, colors)) !== null && _k !== void 0 ? _k : ''}</g><g transform="translate(114.8 215.5) scale(.71856)">${(_m = (_l = components.eyes) === null || _l === void 0 ? void 0 : _l.value(components, colors)) !== null && _m !== void 0 ? _m : ''}</g><g transform="translate(127.7 288.7) scale(.71856)">${(_p = (_o = components.cheek) === null || _o === void 0 ? void 0 : _o.value(components, colors)) !== null && _p !== void 0 ? _p : ''}</g><g transform="translate(193 279.4) scale(.71856)">${(_r = (_q = components.nose) === null || _q === void 0 ? void 0 : _q.value(components, colors)) !== null && _r !== void 0 ? _r : ''}</g><g transform="matrix(.52237 0 0 .52237 122.9 244.8)">${(_t = (_s = components.sideburn) === null || _s === void 0 ? void 0 : _s.value(components, colors)) !== null && _t !== void 0 ? _t : ''}</g><g transform="matrix(-.52237 0 0 .52237 315.7 244.8)">${(_v = (_u = components.sideburn) === null || _u === void 0 ? void 0 : _u.value(components, colors)) !== null && _v !== void 0 ? _v : ''}</g><g transform="matrix(.52237 0 0 .52237 108.7 145.6)">${(_x = (_w = components.frontHair) === null || _w === void 0 ? void 0 : _w.value(components, colors)) !== null && _x !== void 0 ? _x : ''}</g>`,
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
