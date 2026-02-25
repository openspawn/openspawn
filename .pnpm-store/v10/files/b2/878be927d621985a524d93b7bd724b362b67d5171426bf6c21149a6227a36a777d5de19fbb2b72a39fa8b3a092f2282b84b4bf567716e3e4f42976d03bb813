/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/design/rjF7B4FgtEB3FC8ruNuUGf/%40dicebear%2Fdylan
 */
import { escape } from '@dicebear/core';
import { getComponents } from './utils/getComponents.js';
import { getColors } from './utils/getColors.js';
export const meta = {
    title: 'Dylan! The Avatar Generator',
    creator: 'Natalia Spivak',
    source: 'https://www.figma.com/community/file/1356575240759683500',
    homepage: 'https://nataspvk.tilda.ws/',
    license: {
        name: 'CC BY 4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b, _c, _d, _e, _f;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    return {
        attributes: {
            viewBox: '0 0 80 80',
            fill: 'none',
            'shape-rendering': 'auto',
        },
        body: `<path d="M19.07 30.47s1.57-20.23 21.59-20.23S62.3 30.55 62.3 30.55s9.43-.8 9.43 7.6c0 8.42-9.28 7.13-9.28 7.13S60.9 67.15 42.03 67.15c-21.11 0-23.4-20.8-23.4-20.8s-9 .72-9.93-6.25c-1.08-8.2 10.37-9.64 10.37-9.64" fill="${escape.xml(`${colors.skin}`)}"/><path d="m64.3 39.49.46-.41.1-.09c.12-.1-.13.1-.02.02l.24-.17q.5-.35 1.06-.62l.26-.12.05-.02.05-.02.58-.21q.6-.18 1.2-.28c.52-.08.85-.76.7-1.23-.18-.56-.67-.8-1.23-.7a9.3 9.3 0 0 0-4.87 2.43c-.38.36-.4 1.06 0 1.4.4.36 1 .4 1.4 0zm-51.8-1.16.14.01c-.27-.02-.11-.01-.04 0l.3.05.52.14.28.09.12.05c.02 0 .22.09.06.02-.14-.1 0-.04.03-.03l.15.06.26.13.47.3.27.22q.47.38.83.83c.33.4 1.07.37 1.41 0 .4-.43.36-.98 0-1.4a7.3 7.3 0 0 0-4.84-2.53c-.52-.06-1.02.5-1 1 .03.59.44.94 1 1m18.3-1.9v4.54c0 .52.46 1.02 1 1s1-.44 1-1V36.4c0-.52-.46-1.02-1-1s-1 .44-1 1M49.2 36l-.15 4.81a1 1 0 0 0 1 1c.56-.02.98-.44 1-1l.15-4.8a1 1 0 0 0-1-1 1 1 0 0 0-1 1" fill="black"/>${(_b = (_a = components.facialHair) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ''}${(_d = (_c = components.mood) === null || _c === void 0 ? void 0 : _c.value(components, colors)) !== null && _d !== void 0 ? _d : ''}${(_f = (_e = components.hair) === null || _e === void 0 ? void 0 : _e.value(components, colors)) !== null && _f !== void 0 ? _f : ''}`,
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
