/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/design/MbbQiNEkuiiLZSbZuPzyVD
 */
import { getComponents } from './utils/getComponents.js';
import { getColors } from './utils/getColors.js';
export const meta = {
    title: 'Glass',
    creator: 'DiceBear',
    source: 'https://www.dicebear.com',
    homepage: 'https://www.dicebear.com',
    license: {
        name: 'CC0 1.0',
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b, _c, _d;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    return {
        attributes: {
            viewBox: '0 0 100 100',
            fill: 'none',
            'shape-rendering': 'auto',
        },
        body: `<g style="mix-blend-mode:screen" opacity="0.6" filter="url(#dicebearGlass-a)"><g transform="translate(-25 -25)">${(_b = (_a = components.shape2) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}</g></g><g style="mix-blend-mode:screen" opacity="0.6" filter="url(#dicebearGlass-b)"><g transform="translate(-25 -25)">${(_d = (_c = components.shape1) === null || _c === void 0 ? void 0 : _c.value(components, colors)) !== null && _d !== void 0 ? _d : ''}</g></g><defs><filter id="dicebearGlass-a" x="-57" y="-57" width="214" height="214" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur_25_7"/></filter><filter id="dicebearGlass-b" x="-57" y="-57" width="214" height="214" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur_25_7"/></filter></defs>`,
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
