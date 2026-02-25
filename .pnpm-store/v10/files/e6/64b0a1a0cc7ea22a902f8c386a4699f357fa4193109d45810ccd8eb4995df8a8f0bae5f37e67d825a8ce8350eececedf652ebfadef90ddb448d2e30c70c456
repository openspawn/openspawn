/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/YHb4ShTgmO8Lqhkz1plLfL
 */
export function onPreCreate({ prng, options }) {
    var _a;
    // Prevent baseColor from being used a second time if possible.
    options.baseColor =
        options.baseColor && options.baseColor.length > 0
            ? [prng.pick(options.baseColor, 'transparent')]
            : [];
    for (const colorName of [
        'eyebrows',
        'hair',
        'eyes',
        'nose',
        'ears',
        'shirt',
        'earrings',
        'glasses',
        'facialHair',
    ]) {
        // @ts-ignore
        const colorOption = (_a = options[`${colorName}Color`]) !== null && _a !== void 0 ? _a : [];
        const index = colorOption.indexOf(options.baseColor[0]);
        if (colorOption.length > 1 && index > -1) {
            colorOption.splice(index, 1);
        }
    }
}
