import * as svgUtils from './utils/svg.js';
import { merge as mergeOptions } from './utils/options.js';
import { create as createPrng } from './utils/prng.js';
import * as license from './utils/license.js';
import { getBackgroundColors } from './utils/color.js';
export function createAvatar(style, options = {}) {
    var _a, _b, _c, _d, _e;
    options = mergeOptions(style, options);
    const prng = createPrng(options.seed);
    const result = style.create({ prng: prng, options });
    const backgroundType = prng.pick((_a = options.backgroundType) !== null && _a !== void 0 ? _a : [], 'solid');
    const { primary: primaryBackgroundColor, secondary: secondaryBackgroundColor, } = getBackgroundColors(prng, (_b = options.backgroundColor) !== null && _b !== void 0 ? _b : [], backgroundType);
    const backgroundRotation = prng.integer(((_c = options.backgroundRotation) === null || _c === void 0 ? void 0 : _c.length)
        ? Math.min(...options.backgroundRotation)
        : 0, ((_d = options.backgroundRotation) === null || _d === void 0 ? void 0 : _d.length)
        ? Math.max(...options.backgroundRotation)
        : 0);
    if (options.size) {
        result.attributes.width = options.size.toString();
        result.attributes.height = options.size.toString();
    }
    if (options.scale !== undefined && options.scale !== 100) {
        result.body = svgUtils.addScale(result, options.scale);
    }
    if (options.flip) {
        result.body = svgUtils.addFlip(result);
    }
    if (options.rotate) {
        result.body = svgUtils.addRotate(result, options.rotate);
    }
    if (options.translateX || options.translateY) {
        result.body = svgUtils.addTranslate(result, options.translateX, options.translateY);
    }
    if (primaryBackgroundColor !== 'transparent' &&
        secondaryBackgroundColor !== 'transparent') {
        result.body = svgUtils.addBackground(result, primaryBackgroundColor, secondaryBackgroundColor, backgroundType, backgroundRotation);
    }
    if (options.radius || options.clip) {
        result.body = svgUtils.addViewboxMask(result, (_e = options.radius) !== null && _e !== void 0 ? _e : 0);
    }
    if (options.randomizeIds) {
        // Reduces the occurrence of ID collisions when rendering multiple avatars on one HTML page.
        result.body = svgUtils.randomizeIds(result);
    }
    const attributes = svgUtils.createAttrString(result);
    const metadata = license.xml(style);
    const svg = `<svg ${attributes}>${metadata}${result.body}</svg>`;
    return {
        toString: () => svg,
        toJson: () => {
            var _a;
            return ({
                svg: svg,
                extra: {
                    primaryBackgroundColor,
                    secondaryBackgroundColor,
                    backgroundType,
                    backgroundRotation,
                    ...(_a = result.extra) === null || _a === void 0 ? void 0 : _a.call(result),
                },
            });
        },
        toDataUri: () => {
            return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        },
    };
}
