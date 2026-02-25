"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeServices = composeServices;
exports.assertCompositionSuccess = assertCompositionSuccess;
exports.assertCompositionFailure = assertCompositionFailure;
exports.compositionHasErrors = compositionHasErrors;
const graphql_1 = require("graphql");
const printer_js_1 = require("./graphql/printer.js");
const transform_supergraph_to_public_schema_js_1 = require("./graphql/transform-supergraph-to-public-schema.js");
const authenticated_js_1 = require("./specifications/authenticated.js");
const cost_js_1 = require("./specifications/cost.js");
const inaccessible_js_1 = require("./specifications/inaccessible.js");
const join_js_1 = require("./specifications/join.js");
const link_js_1 = require("./specifications/link.js");
const policy_js_1 = require("./specifications/policy.js");
const requires_scopes_js_1 = require("./specifications/requires-scopes.js");
const tag_js_1 = require("./specifications/tag.js");
const validate_js_1 = require("./validate.js");
function composeServices(services, __internal) {
    const validationResult = (0, validate_js_1.validate)(services, __internal);
    if (!validationResult.success) {
        return {
            errors: validationResult.errors,
        };
    }
    const rootTypes = {
        query: false,
        mutation: false,
        subscription: false,
    };
    for (const def of validationResult.supergraph) {
        if (def.name.value === "Query") {
            rootTypes.query = true;
        }
        else if (def.name.value === "Mutation") {
            rootTypes.mutation = true;
        }
        else if (def.name.value === "Subscription") {
            rootTypes.subscription = true;
        }
        if (rootTypes.query === true &&
            rootTypes.mutation === true &&
            rootTypes.subscription === true) {
            break;
        }
    }
    const usedTagSpec = validationResult.specs.tag;
    const usedCostSpec = validationResult.specs.cost;
    const usedInaccessibleSpec = validationResult.specs.inaccessible;
    const usedPolicySpec = validationResult.specs.policy;
    const usedRequiresScopesSpec = validationResult.specs.requiresScopes;
    const usedAuthenticatedSpec = validationResult.specs.authenticated;
    let _publicSdl;
    let costLinkImports = "";
    if (usedCostSpec.used) {
        const imports = [];
        if (usedCostSpec.names.cost && usedCostSpec.names.cost !== "cost") {
            imports.push(createLinkImportValue("@cost", `@${usedCostSpec.names.cost}`));
        }
        if (usedCostSpec.names.listSize) {
            imports.push(createLinkImportValue("@listSize", usedCostSpec.names.listSize !== "listSize"
                ? `@${usedCostSpec.names.listSize}`
                : null));
        }
        if (imports.length) {
            costLinkImports = `, import: [${imports.join(", ")}]`;
        }
    }
    const federationVersionToJoinVersion = {
        "v1.0": "v0.3",
        "v2.0": "v0.3",
        "v2.1": "v0.3",
        "v2.2": "v0.3",
        "v2.3": "v0.3",
        "v2.4": "v0.3",
        "v2.5": "v0.3",
        "v2.6": "v0.3",
        "v2.7": "v0.4",
        "v2.8": "v0.5",
        "v2.9": "v0.5",
    };
    const core = `
    schema
    @link(url: "https://specs.apollo.dev/link/v1.0")
    @link(url: "https://specs.apollo.dev/join/${federationVersionToJoinVersion[validationResult.federationVersion]}", for: EXECUTION)
    ${usedTagSpec ? '@link(url: "https://specs.apollo.dev/tag/v0.3")' : ""}
    ${usedCostSpec.used ? `@link(url: "https://specs.apollo.dev/cost/v0.1"${costLinkImports})` : ""}
    ${usedInaccessibleSpec
        ? '@link(url: "https://specs.apollo.dev/inaccessible/v0.2", for: SECURITY)'
        : ""}
    ${usedPolicySpec ? '@link(url: "https://specs.apollo.dev/policy/v0.1", for: SECURITY)' : ""}
    ${usedRequiresScopesSpec
        ? '@link(url: "https://specs.apollo.dev/requiresScopes/v0.1", for: SECURITY)'
        : ""}
    ${usedAuthenticatedSpec
        ? '@link(url: "https://specs.apollo.dev/authenticated/v0.1", for: SECURITY)'
        : ""}
    ${validationResult.links.map(link_js_1.printLink).join("\n  ")}
  {
    ${rootTypes.query ? "query: Query" : ""}
    ${rootTypes.mutation ? "mutation: Mutation" : ""}
    ${rootTypes.subscription ? "subscription: Subscription" : ""}
  }

  ${(0, join_js_1.sdl)(validationResult.federationVersion)}
  ${link_js_1.sdl}
  ${usedTagSpec ? tag_js_1.sdl : ""}
  ${usedCostSpec.used
        ? (0, cost_js_1.sdl)({
            cost: usedCostSpec.names.cost ?? "cost",
            listSize: usedCostSpec.names.listSize ?? "listSize",
        })
        : ""}
  ${usedInaccessibleSpec ? inaccessible_js_1.sdl : ""}
  ${usedPolicySpec ? policy_js_1.sdl : ""}
  ${usedRequiresScopesSpec ? requires_scopes_js_1.sdl : ""}
  ${usedAuthenticatedSpec ? authenticated_js_1.sdl : ""}
  `;
    return {
        supergraphSdl: `
${core}
${(0, printer_js_1.print)({
            kind: graphql_1.Kind.DOCUMENT,
            definitions: validationResult.supergraph,
        })}
    `,
        get publicSdl() {
            if (_publicSdl) {
                return _publicSdl;
            }
            _publicSdl = (0, printer_js_1.print)((0, transform_supergraph_to_public_schema_js_1.transformSupergraphToPublicSchema)({
                kind: graphql_1.Kind.DOCUMENT,
                definitions: (0, graphql_1.parse)(core).definitions.concat(validationResult.supergraph),
            }));
            return _publicSdl;
        },
    };
}
function createLinkImportValue(name, alias) {
    if (alias) {
        return `{ name: "${name}", as: "${alias}" }`;
    }
    return `"${name}"`;
}
function assertCompositionSuccess(compositionResult, message) {
    if (compositionHasErrors(compositionResult)) {
        throw new Error(message || "Unexpected test failure");
    }
}
function assertCompositionFailure(compositionResult, message) {
    if (!compositionHasErrors(compositionResult)) {
        throw new Error(message || "Unexpected test failure");
    }
}
function compositionHasErrors(compositionResult) {
    return "errors" in compositionResult && !!compositionResult.errors;
}
