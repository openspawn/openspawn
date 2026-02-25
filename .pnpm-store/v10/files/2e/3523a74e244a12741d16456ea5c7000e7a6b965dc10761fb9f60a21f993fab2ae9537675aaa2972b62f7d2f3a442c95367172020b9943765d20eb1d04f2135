/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/XXfL2r5Wylk623KpxDt7gO
 */
import { getComponents } from './utils/getComponents.js';
import { getColors } from './utils/getColors.js';
import { onPostCreate } from './hooks/onPostCreate.js';
export const meta = {
    title: 'Adventurer',
    creator: 'Lisa Wischofsky',
    source: 'https://www.figma.com/community/file/1184595184137881796',
    homepage: 'https://www.instagram.com/lischi_art/',
    license: {
        name: 'CC BY 4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    onPostCreate({ prng, options, components, colors });
    return {
        attributes: {
            viewBox: '0 0 762 762',
            fill: 'none',
            'shape-rendering': 'auto',
        },
        body: `${(_b = (_a = components.base) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}<g transform="translate(-161 -83)">${(_d = (_c = components.eyes) === null || _c === void 0 ? void 0 : _c.value(components, colors)) !== null && _d !== void 0 ? _d : ''}</g><g transform="translate(-161 -83)">${(_f = (_e = components.eyebrows) === null || _e === void 0 ? void 0 : _e.value(components, colors)) !== null && _f !== void 0 ? _f : ''}</g><g transform="translate(-161 -83)">${(_h = (_g = components.mouth) === null || _g === void 0 ? void 0 : _g.value(components, colors)) !== null && _h !== void 0 ? _h : ''}</g><g transform="translate(-161 -83)">${(_k = (_j = components.features) === null || _j === void 0 ? void 0 : _j.value(components, colors)) !== null && _k !== void 0 ? _k : ''}</g><g transform="translate(-161 -83)">${(_m = (_l = components.glasses) === null || _l === void 0 ? void 0 : _l.value(components, colors)) !== null && _m !== void 0 ? _m : ''}</g><g transform="translate(-161 -83)">${(_p = (_o = components.hair) === null || _o === void 0 ? void 0 : _o.value(components, colors)) !== null && _p !== void 0 ? _p : ''}</g><g transform="translate(-161 -83)">${(_r = (_q = components.earrings) === null || _q === void 0 ? void 0 : _q.value(components, colors)) !== null && _r !== void 0 ? _r : ''}</g>`,
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
