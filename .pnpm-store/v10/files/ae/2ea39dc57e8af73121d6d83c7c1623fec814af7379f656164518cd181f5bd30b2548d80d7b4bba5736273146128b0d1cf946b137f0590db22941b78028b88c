/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/bX8ZT8jK2fo5Uy8G6j2Qic
 */
import * as components from '../components/index.js';
export function pickComponent({ prng, group, width, height, values = [], rotation, offsetX, offsetY, }) {
    const componentCollection = components;
    const key = prng.pick(values);
    const pickedRotation = prng.integer(Math.min(...rotation), Math.max(...rotation));
    const pickedOffsetX = prng.integer(Math.min(...offsetX), Math.max(...offsetX));
    const pickedOffsetY = prng.integer(Math.min(...offsetY), Math.max(...offsetY));
    if (key && componentCollection[group][key]) {
        return {
            name: key,
            value(components, colors) {
                var _a, _b, _c;
                let result = componentCollection[group][key](components, colors);
                if (this.rotation || this.offsetX || this.offsetY) {
                    result = `<g transform="translate(${(_a = this.offsetX) !== null && _a !== void 0 ? _a : 0}, ${(_b = this.offsetY) !== null && _b !== void 0 ? _b : 0}) rotate(${(_c = this.rotation) !== null && _c !== void 0 ? _c : 0} ${width / 2} ${height / 2})">${result}</g>`;
                }
                return result;
            },
            rotation: pickedRotation,
            offsetX: pickedOffsetX,
            offsetY: pickedOffsetY,
        };
    }
    else {
        return undefined;
    }
}
