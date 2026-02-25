/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/design/rjF7B4FgtEB3FC8ruNuUGf/%40dicebear%2Fdylan
 */
import { pickComponent } from './pickComponent.js';
export function getComponents({ prng, options, }) {
    const facialHairComponent = pickComponent({
        prng,
        group: 'facialHair',
        values: options.facialHair,
    });
    const moodComponent = pickComponent({
        prng,
        group: 'mood',
        values: options.mood,
    });
    const hairComponent = pickComponent({
        prng,
        group: 'hair',
        values: options.hair,
    });
    return {
        facialHair: prng.bool(options.facialHairProbability)
            ? facialHairComponent
            : undefined,
        mood: moodComponent,
        hair: hairComponent,
    };
}
