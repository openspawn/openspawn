import { Kind } from "graphql";
import { extraFederationDirectiveNames, extraFederationTypeNames, getSupergraphSpecNodes, } from "./supergraph-spec.js";
let containsSupergraphSpecRegex = null;
export function containsSupergraphSpec(sdl) {
    if (containsSupergraphSpecRegex !== null) {
        return containsSupergraphSpecRegex.test(sdl);
    }
    const patterns = [];
    for (const { name, kind } of getSupergraphSpecNodes()) {
        if (kind === Kind.DIRECTIVE) {
            patterns.push(`@${name}`);
        }
        else {
            patterns.push(`\\[${name}`, `\\s${name}`);
        }
    }
    extraFederationTypeNames.forEach((name) => {
        patterns.push(`\\[${name}`, `\\s${name}`);
    });
    extraFederationDirectiveNames.forEach((name) => {
        patterns.push(`@${name}`);
    });
    containsSupergraphSpecRegex = new RegExp(patterns.join("|"));
    return containsSupergraphSpecRegex.test(sdl);
}
