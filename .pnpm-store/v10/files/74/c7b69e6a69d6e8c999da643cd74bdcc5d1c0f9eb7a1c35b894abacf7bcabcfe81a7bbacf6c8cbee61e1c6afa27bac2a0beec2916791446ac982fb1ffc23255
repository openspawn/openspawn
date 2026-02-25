/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/bX8ZT8jK2fo5Uy8G6j2Qic
 */
export function onPreCreate({ prng, options }) {
    var _a, _b, _c, _d;
    const usedColors = new Set();
    function getAvailableColors(colors) {
        const filteredColors = colors.filter((color) => !usedColors.has(color));
        return filteredColors.length > 0 ? filteredColors : colors;
    }
    function getColor(colors) {
        const availableColors = getAvailableColors(colors);
        const color = prng.pick(availableColors, 'transparent');
        usedColors.add(color);
        return color;
    }
    options.shape1Color = [getColor((_a = options.shape1Color) !== null && _a !== void 0 ? _a : [])];
    options.shape2Color = [getColor((_b = options.shape2Color) !== null && _b !== void 0 ? _b : [])];
    options.shape3Color = [getColor((_c = options.shape3Color) !== null && _c !== void 0 ? _c : [])];
    options.backgroundColor = getAvailableColors((_d = options.backgroundColor) !== null && _d !== void 0 ? _d : []);
}
