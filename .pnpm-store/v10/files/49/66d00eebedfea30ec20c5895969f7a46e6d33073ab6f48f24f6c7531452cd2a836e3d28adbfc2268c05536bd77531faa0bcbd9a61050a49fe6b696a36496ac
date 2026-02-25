"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEDERATION_V1 = void 0;
exports.extractLinkImplementations = extractLinkImplementations;
const link_js_1 = require("./link.js");
exports.FEDERATION_V1 = Symbol("Federation_V1");
function extractLinkImplementations(typeDefs) {
    const links = link_js_1.FederatedLink.fromTypedefs(typeDefs);
    const linkByIdentity = Object.fromEntries(links.map((l) => [l.identity, l]));
    const supportsFederationV2 = Object.keys(linkByIdentity).length > 0;
    return {
        links,
        resolveImportName: (identity, name) => {
            const matchingLink = linkByIdentity[identity];
            if (!matchingLink) {
                return name.startsWith("@") ? name.substring(1) : name;
            }
            return matchingLink.resolveImportName(name);
        },
        matchesImplementation: (identity, version) => {
            if (version === exports.FEDERATION_V1) {
                return !supportsFederationV2;
            }
            const matchingLink = linkByIdentity[identity];
            if (!matchingLink) {
                return false;
            }
            if (typeof version === "string") {
                return matchingLink.supports(version);
            }
            if (version === null) {
                return matchingLink.supports(version);
            }
            return matchingLink.supports(version.major, version.minor);
        },
    };
}
