import { isTypeDefinitionNode, Kind, parse, } from "graphql";
import { sdl as authenticatedSdl } from "../specifications/authenticated.js";
import { sdl as costSdl } from "../specifications/cost.js";
import { getLatestFederationVersion } from "../specifications/federation.js";
import { sdl as inaccessibleSdl } from "../specifications/inaccessible.js";
import { sdl as joinSdl } from "../specifications/join.js";
import { sdl as linkSdl } from "../specifications/link.js";
import { sdl as policySdl } from "../specifications/policy.js";
import { sdl as requiresSdl } from "../specifications/requires-scopes.js";
import { sdl as tagSdl } from "../specifications/tag.js";
let supergraphSpecNodes = null;
export const extraFederationTypeNames = new Set([
    "_FieldSet",
    "join__DirectiveArguments",
]);
export const extraFederationDirectiveNames = new Set([
    "core",
    "join__owner",
    "join__directive",
    "context",
]);
export function getSupergraphSpecNodes() {
    if (supergraphSpecNodes !== null) {
        return supergraphSpecNodes;
    }
    const latestVersion = getLatestFederationVersion();
    supergraphSpecNodes = [
        authenticatedSdl,
        costSdl({
            cost: "cost",
            listSize: "listSize",
        }),
        inaccessibleSdl,
        joinSdl(latestVersion),
        linkSdl,
        policySdl,
        requiresSdl,
        tagSdl,
    ]
        .map((sdl) => parse(sdl, { noLocation: true })
        .definitions.filter(isDefinitionNode)
        .map((d) => ({
        name: d.name.value,
        kind: d.kind,
    })))
        .flat();
    return supergraphSpecNodes;
}
function isDirectiveDefinitionNode(node) {
    return node.kind === Kind.DIRECTIVE_DEFINITION;
}
function isDefinitionNode(node) {
    return isDirectiveDefinitionNode(node) || isTypeDefinitionNode(node);
}
