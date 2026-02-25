/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 * File: https://www.figma.com/file/WTcivb1XPf5ODtyv7ZNnU9
 */
import { pickComponent } from './pickComponent.js';
export function getComponents({ prng, options, }) {
    const accessoriesComponent = pickComponent({
        prng,
        group: 'accessories',
        values: options.accessories,
    });
    const clothingComponent = pickComponent({
        prng,
        group: 'clothing',
        values: options.clothing,
    });
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
    const beardComponent = pickComponent({
        prng,
        group: 'beard',
        values: options.beard,
    });
    const mouthComponent = pickComponent({
        prng,
        group: 'mouth',
        values: options.mouth,
    });
    const hairComponent = pickComponent({
        prng,
        group: 'hair',
        values: options.hair,
    });
    const hatComponent = pickComponent({
        prng,
        group: 'hat',
        values: options.hat,
    });
    return {
        accessories: prng.bool(options.accessoriesProbability)
            ? accessoriesComponent
            : undefined,
        clothing: clothingComponent,
        eyes: eyesComponent,
        glasses: prng.bool(options.glassesProbability)
            ? glassesComponent
            : undefined,
        beard: prng.bool(options.beardProbability) ? beardComponent : undefined,
        mouth: mouthComponent,
        hair: hairComponent,
        hat: prng.bool(options.hatProbability) ? hatComponent : undefined,
    };
}
