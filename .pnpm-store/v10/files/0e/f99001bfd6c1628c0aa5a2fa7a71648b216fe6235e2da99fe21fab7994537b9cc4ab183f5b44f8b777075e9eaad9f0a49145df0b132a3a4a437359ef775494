/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/sNI8OuD41VSfu5Gfl3eprv
 */
export function onPostCreate({ prng, options, components, colors }) {
    var _a, _b, _c;
    function getContrastYiq(hexcolor) {
        const r = parseInt(hexcolor.slice(1, 3), 16);
        const g = parseInt(hexcolor.slice(3, 5), 16);
        const b = parseInt(hexcolor.slice(5, 7), 16);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 200 ? '#000000' : '#ffffff';
    }
    const possibleBackgroundColors = (_a = options.backgroundColor) === null || _a === void 0 ? void 0 : _a.filter((v) => v !== colors.shape.replace('#', ''));
    if (possibleBackgroundColors === null || possibleBackgroundColors === void 0 ? void 0 : possibleBackgroundColors.length) {
        options.backgroundColor = possibleBackgroundColors;
    }
    const shapeContrast = colors.shape[0] === '#' ? getContrastYiq(colors.shape) : undefined;
    if (shapeContrast) {
        if (((_b = options.eyesColor) === null || _b === void 0 ? void 0 : _b.length) === 2 &&
            options.eyesColor.includes('000000') &&
            options.eyesColor.includes('ffffff')) {
            colors.eyes = shapeContrast;
        }
        if (((_c = options.mouthColor) === null || _c === void 0 ? void 0 : _c.length) === 2 &&
            options.mouthColor.includes('000000') &&
            options.mouthColor.includes('ffffff')) {
            colors.mouth = shapeContrast;
        }
    }
}
