/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/ZHPv3t2L6Asuuql9ND4q1L
 */
import { getComponents } from './utils/getComponents.js';
import { getColors } from './utils/getColors.js';
export const meta = {
    title: 'Croodles - Doodle your face',
    creator: 'vijay verma',
    source: 'https://www.figma.com/community/file/966199982810283152',
    homepage: 'https://vjy.me/',
    license: {
        name: 'CC BY 4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    return {
        attributes: {
            viewBox: '0 0 256 256',
            fill: 'none',
            'shape-rendering': 'auto',
        },
        body: `${(_b = (_a = components.face) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}`,
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
