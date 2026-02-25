/**
 * Do not change this file manually! This file was generated with the "Dicebear Exporter"-Plugin for Figma.
 *
 * Plugin: https://www.figma.com/community/plugin/1005765655729342787
 */
import { pickComponent } from './pickComponent.js';
export function getComponents({ prng, options }) {
    const rearHairComponent = pickComponent({
        prng,
        group: 'rearHair',
        values: options.rearHair,
    });
    const bodyComponent = pickComponent({
        prng,
        group: 'body',
        values: options.body,
    });
    const headComponent = pickComponent({
        prng,
        group: 'head',
        values: options.head,
    });
    const clothesComponent = pickComponent({
        prng,
        group: 'clothes',
        values: options.clothes,
    });
    const mouthComponent = pickComponent({
        prng,
        group: 'mouth',
        values: options.mouth,
    });
    const beardComponent = pickComponent({
        prng,
        group: 'beard',
        values: options.beard,
    });
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
    const hairComponent = pickComponent({
        prng,
        group: 'hair',
        values: options.hair,
    });
    return {
        'rearHair': prng.bool(options.rearHairProbability) ? rearHairComponent : undefined,
        'body': bodyComponent,
        'head': headComponent,
        'clothes': clothesComponent,
        'mouth': mouthComponent,
        'beard': prng.bool(options.beardProbability) ? beardComponent : undefined,
        'eyes': eyesComponent,
        'eyebrows': eyebrowsComponent,
        'hair': prng.bool(options.hairProbability) ? hairComponent : undefined,
    };
}
;
