/*!
 * DiceBear Initials (@dicebear/initials)
 *
 * Code licensed under MIT (https://github.com/dicebear/dicebear/blob/v4/packages/initials/LICENSE)
 * Copyright (c) 2024 Florian Körner
 */
import { getInitials } from './utils/initials.js';
import { convertColor } from './utils/convertColor.js';
import { escapeXml } from './utils/escape.js';
export const meta = {
    title: 'Initials',
    creator: 'DiceBear',
    source: 'https://github.com/dicebear/dicebear',
    license: {
        name: 'CC0 1.0',
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
};
export const create = ({ prng, options }) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const fontFamily = (_b = (_a = options.fontFamily) === null || _a === void 0 ? void 0 : _a.join(', ')) !== null && _b !== void 0 ? _b : 'Arial, sans-serif';
    const fontSize = (_c = options.fontSize) !== null && _c !== void 0 ? _c : 50;
    const fontWeight = (_d = options.fontWeight) !== null && _d !== void 0 ? _d : 400;
    const textColor = convertColor((_f = prng.pick((_e = options.textColor) !== null && _e !== void 0 ? _e : [])) !== null && _f !== void 0 ? _f : 'ffffff');
    const initials = getInitials(prng.seed.trim()).slice(0, (_g = options.chars) !== null && _g !== void 0 ? _g : 2);
    // prettier-ignore
    const svg = [
        `<text x="50%" y="50%" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="middle" dy="${(fontSize * .356).toFixed(3)}">${escapeXml(initials)}</text>`,
    ].join('');
    return {
        attributes: {
            viewBox: '0 0 100 100',
        },
        body: svg,
        extra: () => ({
            fontFamily,
            fontSize,
            fontWeight,
            textColor,
            initials,
        }),
    };
};
export { schema } from './schema.js';
