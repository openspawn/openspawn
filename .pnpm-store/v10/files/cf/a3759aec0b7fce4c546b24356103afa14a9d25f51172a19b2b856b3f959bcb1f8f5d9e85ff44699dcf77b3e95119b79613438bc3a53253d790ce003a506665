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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    return {
        attributes: {
            viewBox: '0 0 210 210',
            fill: 'none',
            'shape-rendering': 'auto',
        },
        body: `<g transform="translate(86.8 138.9) scale(.71856)">${(_b = (_a = components.mouth) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}</g><g transform="translate(2 11) scale(.71856)">${(_d = (_c = components.eyes) === null || _c === void 0 ? void 0 : _c.value(components, colors)) !== null && _d !== void 0 ? _d : ''}</g><g transform="translate(15 89.2) scale(.71856)">${(_f = (_e = components.cheek) === null || _e === void 0 ? void 0 : _e.value(components, colors)) !== null && _f !== void 0 ? _f : ''}</g><g transform="translate(80.3 79.8) scale(.71856)">${(_h = (_g = components.nose) === null || _g === void 0 ? void 0 : _g.value(components, colors)) !== null && _h !== void 0 ? _h : ''}</g>`,
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
