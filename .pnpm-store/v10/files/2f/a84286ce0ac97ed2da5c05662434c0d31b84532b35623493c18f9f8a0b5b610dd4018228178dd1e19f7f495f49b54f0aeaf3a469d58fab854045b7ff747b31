"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extraFederationDirectiveNames = exports.extraFederationTypeNames = void 0;
exports.getSupergraphSpecNodes = getSupergraphSpecNodes;
const graphql_1 = require("graphql");
const authenticated_js_1 = require("../specifications/authenticated.js");
const cost_js_1 = require("../specifications/cost.js");
const federation_js_1 = require("../specifications/federation.js");
const inaccessible_js_1 = require("../specifications/inaccessible.js");
const join_js_1 = require("../specifications/join.js");
const link_js_1 = require("../specifications/link.js");
const policy_js_1 = require("../specifications/policy.js");
const requires_scopes_js_1 = require("../specifications/requires-scopes.js");
const tag_js_1 = require("../specifications/tag.js");
let supergraphSpecNodes = null;
exports.extraFederationTypeNames = new Set([
    "_FieldSet",
    "join__DirectiveArguments",
]);
exports.extraFederationDirectiveNames = new Set([
    "core",
    "join__owner",
    "join__directive",
    "context",
]);
function getSupergraphSpecNodes() {
    if (supergraphSpecNodes !== null) {
        return supergraphSpecNodes;
    }
    const latestVersion = (0, federation_js_1.getLatestFederationVersion)();
    supergraphSpecNodes = [
        authenticated_js_1.sdl,
        (0, cost_js_1.sdl)({
            cost: "cost",
            listSize: "listSize",
        }),
        inaccessible_js_1.sdl,
        (0, join_js_1.sdl)(latestVersion),
        link_js_1.sdl,
        policy_js_1.sdl,
        requires_scopes_js_1.sdl,
        tag_js_1.sdl,
    ]
        .map((sdl) => (0, graphql_1.parse)(sdl, { noLocation: true })
        .definitions.filter(isDefinitionNode)
        .map((d) => ({
        name: d.name.value,
        kind: d.kind,
    })))
        .flat();
    return supergraphSpecNodes;
}
function isDirectiveDefinitionNode(node) {
    return node.kind === graphql_1.Kind.DIRECTIVE_DEFINITION;
}
function isDefinitionNode(node) {
    return isDirectiveDefinitionNode(node) || (0, graphql_1.isTypeDefinitionNode)(node);
}
