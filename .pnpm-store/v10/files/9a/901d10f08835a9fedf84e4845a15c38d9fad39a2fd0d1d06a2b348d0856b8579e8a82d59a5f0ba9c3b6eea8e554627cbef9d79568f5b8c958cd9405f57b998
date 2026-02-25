/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/community/file/1198749693280469639
 */
import { getComponents } from './utils/getComponents.js';
import { getColors } from './utils/getColors.js';
import { onPostCreate } from './hooks/onPostCreate.js';
export const meta = {
    title: 'Lorelei',
    creator: 'Lisa Wischofsky',
    source: 'https://www.figma.com/community/file/1198749693280469639',
    homepage: 'https://www.instagram.com/lischi_art/',
    license: {
        name: 'CC0 1.0',
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b, _c, _d;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    onPostCreate({ prng, options, components, colors });
    return {
        attributes: {
            viewBox: '0 0 980 980',
            fill: 'none',
            'shape-rendering': 'auto',
        },
        body: `<g transform="translate(10 -60)">${(_b = (_a = components.hair) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}</g><g transform="translate(10 -60)">${(_d = (_c = components.hairAccessories) === null || _c === void 0 ? void 0 : _c.value(components, colors)) !== null && _d !== void 0 ? _d : ''}</g>`,
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
