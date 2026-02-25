/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/sNI8OuD41VSfu5Gfl3eprv
 */
import { pickComponent } from './pickComponent.js';
export function getComponents({ prng, options, }) {
    var _a, _b, _c, _d, _e, _f;
    const shapeComponent = pickComponent({
        prng,
        group: 'shape',
        values: options.shape,
        width: 100,
        height: 140,
        rotation: ((_a = options.shapeRotation) === null || _a === void 0 ? void 0 : _a.length) ? options.shapeRotation : [0],
        offsetX: ((_b = options.shapeOffsetX) === null || _b === void 0 ? void 0 : _b.length) ? options.shapeOffsetX : [0],
        offsetY: ((_c = options.shapeOffsetY) === null || _c === void 0 ? void 0 : _c.length) ? options.shapeOffsetY : [0],
    });
    const faceComponent = pickComponent({
        prng,
        group: 'face',
        values: options.face,
        width: 42,
        height: 42,
        rotation: ((_d = options.faceRotation) === null || _d === void 0 ? void 0 : _d.length) ? options.faceRotation : [0],
        offsetX: ((_e = options.faceOffsetX) === null || _e === void 0 ? void 0 : _e.length) ? options.faceOffsetX : [0],
        offsetY: ((_f = options.faceOffsetY) === null || _f === void 0 ? void 0 : _f.length) ? options.faceOffsetY : [0],
    });
    const eyesComponent = pickComponent({
        prng,
        group: 'eyes',
        values: options.eyes,
        width: 42,
        height: 16,
        rotation: [0],
        offsetX: [0],
        offsetY: [0],
    });
    const mouthComponent = pickComponent({
        prng,
        group: 'mouth',
        values: options.mouth,
        width: 30,
        height: 14,
        rotation: [0],
        offsetX: [0],
        offsetY: [0],
    });
    return {
        shape: shapeComponent,
        face: faceComponent,
        eyes: eyesComponent,
        mouth: mouthComponent,
    };
}
