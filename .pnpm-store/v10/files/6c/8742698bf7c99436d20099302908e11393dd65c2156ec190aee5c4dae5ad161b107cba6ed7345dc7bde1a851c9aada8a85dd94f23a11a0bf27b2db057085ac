"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsSupergraphSpec = containsSupergraphSpec;
const graphql_1 = require("graphql");
const supergraph_spec_js_1 = require("./supergraph-spec.js");
let containsSupergraphSpecRegex = null;
function containsSupergraphSpec(sdl) {
    if (containsSupergraphSpecRegex !== null) {
        return containsSupergraphSpecRegex.test(sdl);
    }
    const patterns = [];
    for (const { name, kind } of (0, supergraph_spec_js_1.getSupergraphSpecNodes)()) {
        if (kind === graphql_1.Kind.DIRECTIVE) {
            patterns.push(`@${name}`);
        }
        else {
            patterns.push(`\\[${name}`, `\\s${name}`);
        }
    }
    supergraph_spec_js_1.extraFederationTypeNames.forEach((name) => {
        patterns.push(`\\[${name}`, `\\s${name}`);
    });
    supergraph_spec_js_1.extraFederationDirectiveNames.forEach((name) => {
        patterns.push(`@${name}`);
    });
    containsSupergraphSpecRegex = new RegExp(patterns.join("|"));
    return containsSupergraphSpecRegex.test(sdl);
}
