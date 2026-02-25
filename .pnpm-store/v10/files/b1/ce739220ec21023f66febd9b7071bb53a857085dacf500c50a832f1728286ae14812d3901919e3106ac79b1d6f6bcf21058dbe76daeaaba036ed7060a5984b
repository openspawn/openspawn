/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/BRj9eonsORJ7GIUdm8gnu5
 */
import { getComponents } from './utils/getComponents.js';
import { getColors } from './utils/getColors.js';
export const meta = {
    title: 'Bootstrap Icons',
    creator: 'The Bootstrap Authors',
    source: 'https://github.com/twbs/icons',
    homepage: 'https://getbootstrap.com/',
    license: {
        name: 'MIT',
        url: 'https://github.com/twbs/icons/blob/main/LICENSE',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    return {
        attributes: {
            viewBox: '0 0 24 24',
            fill: 'none',
            'shape-rendering': 'auto',
        },
        body: `<g transform="translate(4 4)">${(_b = (_a = components.icon) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}</g>`,
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
