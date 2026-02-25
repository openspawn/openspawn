/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/WTcivb1XPf5ODtyv7ZNnU9
 */
import { pickComponent } from './pickComponent.js';
export function getComponents({ prng, options, }) {
    const eyesComponent = pickComponent({
        prng,
        group: 'eyes',
        values: options.eyes,
    });
    const glassesComponent = pickComponent({
        prng,
        group: 'glasses',
        values: options.glasses,
    });
    const mouthComponent = pickComponent({
        prng,
        group: 'mouth',
        values: options.mouth,
    });
    return {
        eyes: eyesComponent,
        glasses: prng.bool(options.glassesProbability)
            ? glassesComponent
            : undefined,
        mouth: mouthComponent,
    };
}
