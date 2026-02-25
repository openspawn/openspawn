/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/XXfL2r5Wylk623KpxDt7gO
 */
import { pickComponent } from './pickComponent.js';
export function getComponents({ prng, options, }) {
    const eyesComponent = pickComponent({
        prng,
        group: 'eyes',
        values: options.eyes,
    });
    const eyebrowsComponent = pickComponent({
        prng,
        group: 'eyebrows',
        values: options.eyebrows,
    });
    const mouthComponent = pickComponent({
        prng,
        group: 'mouth',
        values: options.mouth,
    });
    const glassesComponent = pickComponent({
        prng,
        group: 'glasses',
        values: options.glasses,
    });
    return {
        eyes: eyesComponent,
        eyebrows: eyebrowsComponent,
        mouth: mouthComponent,
        glasses: prng.bool(options.glassesProbability)
            ? glassesComponent
            : undefined,
    };
}
